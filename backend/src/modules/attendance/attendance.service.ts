import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "../../database";
import { getRedis } from "../../config/redis";
import {
  attendanceAdjustments,
  attendanceBreaks,
  attendanceEvents,
  attendancePolicies,
  attendanceRecords,
  employeeShiftAssignments,
  holidays,
  shiftBreaks,
  shifts,
  users,
} from "../../database/schema";

function formatUserDisplay(u: { firstName: string | null; lastName: string | null; email: string }): string {
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  if (name) return name;
  const local = u.email.split("@")[0];
  return local || u.email;
}

async function userDisplayByIds(userIds: (number | null | undefined)[]): Promise<Map<number, string>> {
  const ids = [...new Set(userIds.filter((x): x is number => typeof x === "number" && x > 0))];
  if (ids.length === 0) return new Map();
  const rows = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(users)
    .where(inArray(users.id, ids));
  const m = new Map<number, string>();
  for (const r of rows) m.set(r.id, formatUserDisplay(r));
  return m;
}

function toDateOnly(dateInput: Date): Date {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateTimeFromShift(dateOnly: Date, hhmmss: string): Date {
  const [h, m, s] = hhmmss.split(":").map((x) => Number(x));
  const d = new Date(dateOnly);
  d.setHours(h || 0, m || 0, s || 0, 0);
  return d;
}

function toShiftWindow(dateOnly: Date, startTime: string, endTime: string) {
  const start = toDateTimeFromShift(dateOnly, startTime);
  const end = toDateTimeFromShift(dateOnly, endTime);
  if (end <= start) end.setDate(end.getDate() + 1);
  return { start, end };
}

function minuteOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function timeToMinute(value: string | null | undefined) {
  if (!value) return null;
  const [h, m] = value.split(":").map((x) => Number(x));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function timeRangeContainsMinute(start: string | null, end: string | null, minute: number) {
  const s = timeToMinute(start);
  const e = timeToMinute(end);
  if (s == null || e == null) return false;
  if (e >= s) return minute >= s && minute <= e;
  return minute >= s || minute <= e;
}

async function findBreakRuleForStart(organizationId: number, shiftId: number, startedAt: Date, shiftBreakId?: number) {
  const rows = await db
    .select()
    .from(shiftBreaks)
    .where(and(eq(shiftBreaks.organizationId, organizationId), eq(shiftBreaks.shiftId, shiftId)));
  if (shiftBreakId) {
    const exact = rows.find((row) => row.id === shiftBreakId);
    if (exact) return exact;
  }
  const minute = minuteOfDay(startedAt);
  return (
    rows.find(
      (row) =>
        row.ruleType === "interval" &&
        timeRangeContainsMinute(row.bufferStartTime ?? row.startTime, row.bufferEndTime ?? row.endTime, minute),
    ) ??
    rows.find((row) => row.ruleType === "duration" && row.category === "casual_break") ??
    null
  );
}

async function computeCompletedBreakMinutes(recordId: number) {
  const rows = await db.select().from(attendanceBreaks).where(eq(attendanceBreaks.recordId, recordId));
  return rows.reduce(
    (acc, row) => {
      const duration = row.durationMinutes ?? 0;
      acc.total += duration;
      if (row.payType === "unpaid") acc.unpaid += duration;
      return acc;
    },
    { total: 0, unpaid: 0 },
  );
}

async function getActiveShiftAssignment(organizationId: number, employeeId: number, forDate: Date) {
  const [assignment] = await db
    .select()
    .from(employeeShiftAssignments)
    .where(
      and(
        eq(employeeShiftAssignments.organizationId, organizationId),
        eq(employeeShiftAssignments.employeeId, employeeId),
        lte(employeeShiftAssignments.effectiveFrom, forDate),
        sql`${employeeShiftAssignments.effectiveTo} IS NULL OR ${employeeShiftAssignments.effectiveTo} >= ${forDate}`,
      ),
    )
    .orderBy(desc(employeeShiftAssignments.id))
    .limit(1);
  return assignment ?? null;
}

async function getEffectivePolicy(organizationId: number) {
  const [policy] = await db
    .select()
    .from(attendancePolicies)
    .where(eq(attendancePolicies.organizationId, organizationId))
    .orderBy(desc(attendancePolicies.id))
    .limit(1);
  return policy ?? null;
}

async function invalidateDashCache(organizationId: number) {
  const redis = getRedis();
  if (!redis || !redis.isOpen) return;
  await redis.del(`attendance:dashboard:${organizationId}`);
}

export const attendanceTemplateOptions = {
  attendanceModes: [
    {
      value: "mark_present_by_default",
      label: "Mark Present by Default",
      description: "Default auto present, can be changed manually",
    },
    {
      value: "manual_attendance",
      label: "Manual Attendance",
      description: "Attendance is neutral by default, should be marked manually",
    },
    {
      value: "location_based",
      label: "Location Based",
      description: "Staff can mark their own attendance. Location will be captured automatically",
    },
    {
      value: "selfie_location_based",
      label: "Selfie & Location Based",
      description: "Staff can mark their own attendance with selfie. Location will be captured automatically",
    },
  ],
  holidayAttendance: [
    {
      value: "block_paid_holidays",
      label: "Do NOT Allow attendance on paid holidays",
      description: "Do not let staff mark attendance on paid holidays",
    },
    {
      value: "comp_off",
      label: "Comp Off",
      description: "Allow a comp off leave if a staff works on a holiday",
    },
    {
      value: "allow_paid_holidays",
      label: "Allow attendance on paid holidays",
      description: "Let staff mark attendance on paid holidays",
    },
  ],
  effectiveWorkingHourRules: [
    {
      value: "do_not_show",
      label: "Do not show",
      description: "Hide effective working hours from attendance calculations",
    },
    {
      value: "rule_1",
      label: "Rule 1",
      description: "Overtime and paid breaks will be deducted from the total time",
    },
    {
      value: "rule_2",
      label: "Rule 2",
      description: "Total time only, no deductions",
    },
    {
      value: "rule_3",
      label: "Rule 3",
      description: "Overtime will be deducted from total time",
    },
    {
      value: "rule_4",
      label: "Rule 4",
      description: "All breaks will be deducted from total time",
    },
  ],
  approvalAfterDays: [
    { value: "1", label: "1 day" },
    { value: "2", label: "2 days" },
    { value: "3", label: "3 days" },
    { value: "7", label: "7 days" },
    { value: "15", label: "15 days" },
    { value: "30", label: "30 days" },
  ],
};

type AttendanceTemplateSettings = {
  attendanceMode: string;
  holidayAttendance: string;
  trackInOutTime: boolean;
  noAttendanceWithoutPunchOut: boolean;
  allowMultiplePunches: boolean;
  autoApproveAttendance: boolean;
  autoApproveAfterDays: string;
  markAbsentPreviousDays: boolean;
  effectiveWorkingHourRule: string;
};

const defaultAttendanceTemplateSettings: AttendanceTemplateSettings = {
  attendanceMode: "selfie_location_based",
  holidayAttendance: "block_paid_holidays",
  trackInOutTime: false,
  noAttendanceWithoutPunchOut: false,
  allowMultiplePunches: false,
  autoApproveAttendance: false,
  autoApproveAfterDays: "7",
  markAbsentPreviousDays: false,
  effectiveWorkingHourRule: "do_not_show",
};

function parseTemplateSettings(settings: string | null | undefined): AttendanceTemplateSettings {
  if (!settings) return defaultAttendanceTemplateSettings;
  try {
    const parsed = JSON.parse(settings) as Partial<AttendanceTemplateSettings>;
    return {
      ...defaultAttendanceTemplateSettings,
      ...parsed,
    };
  } catch {
    return defaultAttendanceTemplateSettings;
  }
}

function policyToTemplate(policy: Awaited<ReturnType<typeof getEffectivePolicy>>) {
  const settings = parseTemplateSettings(policy?.templateSettings);
  return {
    id: "default",
    name: policy?.name ?? "Default Template",
    createdBy: "Niyam",
    assignedStaffCount: 0,
    ...settings,
    lateAfterMinutes: policy?.lateAfterMinutes ?? 0,
    halfDayAfterMinutes: policy?.halfDayAfterMinutes ?? 240,
    overtimeAfterMinutes: policy?.overtimeAfterMinutes ?? 0,
    weeklyOffDays: policy?.weeklyOffDays ?? "sunday",
  };
}

export async function listAttendanceTemplates(organizationId: number) {
  const policy = await getEffectivePolicy(organizationId);
  const template = policyToTemplate(policy);
  const labels = await userDisplayByIds([policy?.createdByUserId, policy?.updatedByUserId]);
  const createdBy =
    policy?.createdByUserId != null && labels.has(policy.createdByUserId)
      ? labels.get(policy.createdByUserId)!
      : template.createdBy;
  const updatedBy =
    policy?.updatedByUserId != null && labels.has(policy.updatedByUserId) ? labels.get(policy.updatedByUserId)! : "—";

  return [
    {
      id: template.id,
      name: template.name,
      createdBy,
      updatedBy,
      assignedStaffCount: template.assignedStaffCount,
    },
  ];
}

export async function getDefaultAttendanceTemplate(organizationId: number) {
  const policy = await getEffectivePolicy(organizationId);
  return policyToTemplate(policy);
}

export async function updateDefaultAttendanceTemplate(
  organizationId: number,
  input: {
    name: string;
    attendanceMode?: string;
    holidayAttendance?: string;
    trackInOutTime?: boolean;
    noAttendanceWithoutPunchOut?: boolean;
    allowMultiplePunches?: boolean;
    autoApproveAttendance?: boolean;
    autoApproveAfterDays?: string;
    markAbsentPreviousDays?: boolean;
    effectiveWorkingHourRule?: string;
    lateAfterMinutes?: number;
    halfDayAfterMinutes?: number;
    overtimeAfterMinutes?: number;
    weeklyOffDays?: string;
  },
  actorUserId: number,
) {
  const policy = await getEffectivePolicy(organizationId);
  const values = {
    organizationId,
    name: input.name.trim(),
    lateAfterMinutes: input.lateAfterMinutes ?? 0,
    halfDayAfterMinutes: input.halfDayAfterMinutes ?? 240,
    overtimeAfterMinutes: input.overtimeAfterMinutes ?? 0,
    weeklyOffDays: input.weeklyOffDays ?? "sunday",
    templateSettings: JSON.stringify({
      ...parseTemplateSettings(policy?.templateSettings),
      attendanceMode: input.attendanceMode ?? defaultAttendanceTemplateSettings.attendanceMode,
      holidayAttendance: input.holidayAttendance ?? defaultAttendanceTemplateSettings.holidayAttendance,
      trackInOutTime: input.trackInOutTime ?? defaultAttendanceTemplateSettings.trackInOutTime,
      noAttendanceWithoutPunchOut:
        input.noAttendanceWithoutPunchOut ?? defaultAttendanceTemplateSettings.noAttendanceWithoutPunchOut,
      allowMultiplePunches: input.allowMultiplePunches ?? defaultAttendanceTemplateSettings.allowMultiplePunches,
      autoApproveAttendance: input.autoApproveAttendance ?? defaultAttendanceTemplateSettings.autoApproveAttendance,
      autoApproveAfterDays: input.autoApproveAfterDays ?? defaultAttendanceTemplateSettings.autoApproveAfterDays,
      markAbsentPreviousDays: input.markAbsentPreviousDays ?? defaultAttendanceTemplateSettings.markAbsentPreviousDays,
      effectiveWorkingHourRule: input.effectiveWorkingHourRule ?? defaultAttendanceTemplateSettings.effectiveWorkingHourRule,
    }),
  };

  if (policy) {
    const backfillCreated = policy.createdByUserId == null;
    await db
      .update(attendancePolicies)
      .set({
        ...values,
        updatedByUserId: actorUserId,
        ...(backfillCreated ? { createdByUserId: actorUserId } : {}),
      })
      .where(eq(attendancePolicies.id, policy.id));
  } else {
    await db.insert(attendancePolicies).values({
      ...values,
      createdByUserId: actorUserId,
      updatedByUserId: actorUserId,
    });
  }

  return getDefaultAttendanceTemplate(organizationId);
}

export async function checkIn(input: {
  organizationId: number;
  employeeId: number;
  source?: "mobile" | "biometric" | "face" | "qr" | "manual";
}) {
  const now = new Date();
  const day = toDateOnly(now);

  const [holiday] = await db
    .select()
    .from(holidays)
    .where(and(eq(holidays.organizationId, input.organizationId), eq(holidays.holidayDate, day)))
    .limit(1);
  if (holiday) {
    const err = new Error("Check-in blocked on holiday");
    (err as { status?: number }).status = 400;
    throw err;
  }

  const assignment = await getActiveShiftAssignment(input.organizationId, input.employeeId, day);
  if (!assignment) {
    const err = new Error("No active shift assignment for employee");
    (err as { status?: number }).status = 400;
    throw err;
  }

  const [shift] = await db.select().from(shifts).where(eq(shifts.id, assignment.shiftId)).limit(1);
  if (!shift) throw new Error("Shift not found");
  const policy = await getEffectivePolicy(input.organizationId);

  const shiftWindow = toShiftWindow(day, shift.startTime as unknown as string, shift.endTime as unknown as string);
  const shiftStart = shiftWindow.start;
  const grace = shift.gracePeriodMinutes ?? 0;
  const lateThreshold = new Date(shiftStart.getTime() + grace * 60_000);
  const lateMinutes = now > lateThreshold ? Math.max(0, Math.floor((now.getTime() - shiftStart.getTime()) / 60_000)) : 0;

  const [existing] = await db
    .select()
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.organizationId, input.organizationId),
        eq(attendanceRecords.employeeId, input.employeeId),
        eq(attendanceRecords.attendanceDate, day),
      ),
    )
    .limit(1);
  if (existing?.checkInTime) {
    const err = new Error("Employee already checked in");
    (err as { status?: number }).status = 409;
    throw err;
  }

  if (existing) {
    await db
      .update(attendanceRecords)
      .set({
        checkInTime: now,
        shiftAssignmentId: assignment.id,
        lateMinutes,
        attendanceStatus: lateMinutes > 0 ? "late" : "present",
        attendanceSource: input.source ?? "mobile",
      })
      .where(eq(attendanceRecords.id, existing.id));
  } else {
    await db.insert(attendanceRecords).values({
      organizationId: input.organizationId,
      employeeId: input.employeeId,
      shiftAssignmentId: assignment.id,
      attendanceDate: day,
      checkInTime: now,
      lateMinutes,
      attendanceStatus: lateMinutes > 0 ? "late" : "present",
      attendanceSource: input.source ?? "mobile",
    });
  }

  const [record] = await db
    .select()
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.organizationId, input.organizationId),
        eq(attendanceRecords.employeeId, input.employeeId),
        eq(attendanceRecords.attendanceDate, day),
      ),
    )
    .limit(1);

  await db.insert(attendanceEvents).values({
    organizationId: input.organizationId,
    employeeId: input.employeeId,
    recordId: record?.id,
    eventType: "check_in",
    eventTime: now,
    source: input.source ?? "mobile",
  });
  await invalidateDashCache(input.organizationId);

  return { record, policy };
}

export async function checkOut(input: { organizationId: number; employeeId: number }) {
  const now = new Date();
  const day = toDateOnly(now);

  const [record] = await db
    .select()
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.organizationId, input.organizationId),
        eq(attendanceRecords.employeeId, input.employeeId),
        eq(attendanceRecords.attendanceDate, day),
      ),
    )
    .limit(1);
  if (!record || !record.checkInTime) {
    const err = new Error("No check-in found for today");
    (err as { status?: number }).status = 400;
    throw err;
  }

  const checkIn = new Date(record.checkInTime);
  const workDurationMinutes = Math.max(0, Math.floor((now.getTime() - checkIn.getTime()) / 60_000));

  const assignment = await getActiveShiftAssignment(input.organizationId, input.employeeId, day);
  let overtimeMinutes = 0;
  let earlyExitMinutes = 0;
  if (assignment) {
    const [shift] = await db.select().from(shifts).where(eq(shifts.id, assignment.shiftId)).limit(1);
    if (shift) {
      const shiftEnd = toShiftWindow(day, shift.startTime as unknown as string, shift.endTime as unknown as string).end;
      if (now > shiftEnd && shift.overtimeEnabled === 1) {
        overtimeMinutes = Math.floor((now.getTime() - shiftEnd.getTime()) / 60_000);
      } else if (now < shiftEnd) {
        earlyExitMinutes = Math.floor((shiftEnd.getTime() - now.getTime()) / 60_000);
      }
    }
  }

  const breakMinutes = await computeCompletedBreakMinutes(record.id);
  const payableDurationMinutes = Math.max(0, workDurationMinutes - breakMinutes.unpaid);

  await db
    .update(attendanceRecords)
    .set({
      checkOutTime: now,
      workDurationMinutes,
      payableDurationMinutes,
      unpaidBreakMinutes: breakMinutes.unpaid,
      overtimeMinutes,
      earlyExitMinutes,
    })
    .where(eq(attendanceRecords.id, record.id));

  await db.insert(attendanceEvents).values({
    organizationId: input.organizationId,
    employeeId: input.employeeId,
    recordId: record.id,
    eventType: "check_out",
    eventTime: now,
    source: record.attendanceSource,
  });
  await invalidateDashCache(input.organizationId);

  return { ok: true, workDurationMinutes, payableDurationMinutes, unpaidBreakMinutes: breakMinutes.unpaid, overtimeMinutes, earlyExitMinutes };
}

export async function startBreak(input: { organizationId: number; employeeId: number; shiftBreakId?: number }) {
  const now = new Date();
  const day = toDateOnly(now);
  const [record] = await db
    .select()
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.organizationId, input.organizationId),
        eq(attendanceRecords.employeeId, input.employeeId),
        eq(attendanceRecords.attendanceDate, day),
      ),
    )
    .limit(1);
  if (!record) throw new Error("Attendance record not found");
  const assignment = await getActiveShiftAssignment(input.organizationId, input.employeeId, day);
  const rule = assignment
    ? await findBreakRuleForStart(input.organizationId, assignment.shiftId, now, input.shiftBreakId)
    : null;
  await db.insert(attendanceBreaks).values({
    organizationId: input.organizationId,
    recordId: record.id,
    shiftBreakId: rule?.id,
    category: rule?.category,
    payType: rule?.payType,
    ruleType: rule?.ruleType,
    breakStart: now,
  });
  await db.insert(attendanceEvents).values({
    organizationId: input.organizationId,
    employeeId: input.employeeId,
    recordId: record.id,
    eventType: "break_start",
    eventTime: now,
    source: "mobile",
    metadata: rule
      ? JSON.stringify({
          shiftBreakId: rule.id,
          category: rule.category,
          payType: rule.payType,
          ruleType: rule.ruleType,
        })
      : undefined,
  });
  await invalidateDashCache(input.organizationId);
  return { ok: true };
}

export async function endBreak(input: { organizationId: number; employeeId: number }) {
  const now = new Date();
  const day = toDateOnly(now);
  const [record] = await db
    .select()
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.organizationId, input.organizationId),
        eq(attendanceRecords.employeeId, input.employeeId),
        eq(attendanceRecords.attendanceDate, day),
      ),
    )
    .limit(1);
  if (!record) throw new Error("Attendance record not found");
  const [openBreak] = await db
    .select()
    .from(attendanceBreaks)
    .where(and(eq(attendanceBreaks.recordId, record.id), sql`${attendanceBreaks.breakEnd} IS NULL`))
    .orderBy(desc(attendanceBreaks.id))
    .limit(1);
  if (!openBreak) throw new Error("No open break found");
  const duration = Math.max(0, Math.floor((now.getTime() - new Date(openBreak.breakStart).getTime()) / 60_000));
  await db
    .update(attendanceBreaks)
    .set({ breakEnd: now, durationMinutes: duration })
    .where(eq(attendanceBreaks.id, openBreak.id));
  await db.insert(attendanceEvents).values({
    organizationId: input.organizationId,
    employeeId: input.employeeId,
    recordId: record.id,
    eventType: "break_end",
    eventTime: now,
    source: "mobile",
  });
  await invalidateDashCache(input.organizationId);
  return { ok: true, durationMinutes: duration };
}

export async function adjustAttendance(input: {
  organizationId: number;
  recordId: number;
  adjustedByUserId: number;
  reason: string;
  newCheckIn?: string;
  newCheckOut?: string;
}) {
  const [record] = await db
    .select()
    .from(attendanceRecords)
    .where(and(eq(attendanceRecords.organizationId, input.organizationId), eq(attendanceRecords.id, input.recordId)))
    .limit(1);
  if (!record) throw new Error("Attendance record not found");

  await db.insert(attendanceAdjustments).values({
    organizationId: input.organizationId,
    recordId: input.recordId,
    adjustedByUserId: input.adjustedByUserId,
    reason: input.reason,
    previousCheckIn: record.checkInTime,
    previousCheckOut: record.checkOutTime,
    newCheckIn: input.newCheckIn ? new Date(input.newCheckIn) : undefined,
    newCheckOut: input.newCheckOut ? new Date(input.newCheckOut) : undefined,
  });

  await db
    .update(attendanceRecords)
    .set({
      checkInTime: input.newCheckIn ? new Date(input.newCheckIn) : record.checkInTime,
      checkOutTime: input.newCheckOut ? new Date(input.newCheckOut) : record.checkOutTime,
    })
    .where(eq(attendanceRecords.id, input.recordId));
  await invalidateDashCache(input.organizationId);
  return { ok: true };
}

export async function dashboardSummary(organizationId: number) {
  const redis = getRedis();
  const key = `attendance:dashboard:${organizationId}`;
  if (redis && redis.isOpen) {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit);
  }

  const today = toDateOnly(new Date());
  const rows = await db
    .select({
      status: attendanceRecords.attendanceStatus,
      count: sql<number>`count(*)`,
    })
    .from(attendanceRecords)
    .where(and(eq(attendanceRecords.organizationId, organizationId), eq(attendanceRecords.attendanceDate, today)))
    .groupBy(attendanceRecords.attendanceStatus);

  const summary = {
    date: today.toISOString().slice(0, 10),
    counts: rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = Number(row.count);
      return acc;
    }, {}),
  };

  if (redis && redis.isOpen) {
    await redis.setEx(key, 60, JSON.stringify(summary));
  }
  return summary;
}

export async function recentAttendance(organizationId: number) {
  const start = toDateOnly(new Date(Date.now() - 1000 * 60 * 60 * 24 * 7));
  return db
    .select()
    .from(attendanceRecords)
    .where(and(eq(attendanceRecords.organizationId, organizationId), gte(attendanceRecords.attendanceDate, start)))
    .orderBy(desc(attendanceRecords.id))
    .limit(50);
}
