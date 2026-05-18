import { and, asc, desc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { db } from "../../database";
import {
  attendancePolicies,
  employeeShiftAssignments,
  employees,
  holidayTemplateAssignments,
  holidayTemplateHolidays,
  holidayTemplates,
  holidays,
  shiftBreaks,
  shiftTypeMasters,
  shifts,
} from "../../database/schema";

const DEFAULT_SHIFT_TYPE_ROWS = [
  { code: "fixed", label: "Fixed Shift", description: "Same clock-in and clock-out each day", sortOrder: 10 },
  { code: "open", label: "Open Shift", description: "Flexible within a wider window", sortOrder: 20 },
  { code: "rotational", label: "Rotational Shift", description: "Pattern that rotates across teams", sortOrder: 30 },
] as const;

export async function listShiftTypeMasters() {
  try {
    const rows = await db.select().from(shiftTypeMasters).orderBy(asc(shiftTypeMasters.sortOrder), asc(shiftTypeMasters.id));
    if (rows.length > 0) {
      return rows;
    }
    for (const row of DEFAULT_SHIFT_TYPE_ROWS) {
      try {
        await db.insert(shiftTypeMasters).values(row);
      } catch {
        /* race or table missing */
      }
    }
    const seeded = await db.select().from(shiftTypeMasters).orderBy(asc(shiftTypeMasters.sortOrder), asc(shiftTypeMasters.id));
    if (seeded.length > 0) {
      return seeded;
    }
  } catch {
    /* table not migrated yet */
  }
  return DEFAULT_SHIFT_TYPE_ROWS.map((row, i) => ({
    id: i + 1,
    code: row.code,
    label: row.label,
    description: row.description,
    sortOrder: row.sortOrder,
  }));
}

export async function createShift(input: {
  organizationId: number;
  name: string;
  shiftCode?: string | null;
  shiftType?: "fixed" | "flexible" | "open" | "rotational";
  startTime: string;
  endTime: string;
  earliestPunchIn?: string | null;
  latestPunchOut?: string | null;
  branchId?: number;
  gracePeriodMinutes?: number;
  overtimeEnabled?: number;
  lateMarkEnabled?: number;
  weeklyOffPolicy?: string;
  breakPolicy?: string | null;
  breaks?: ShiftBreakInput[];
}) {
  await db.insert(shifts).values({
    organizationId: input.organizationId,
    name: input.name,
    shiftCode: input.shiftCode?.trim() || null,
    shiftType: input.shiftType ?? "fixed",
    startTime: input.startTime,
    endTime: input.endTime,
    earliestPunchIn: input.earliestPunchIn ?? null,
    latestPunchOut: input.latestPunchOut ?? null,
    branchId: input.branchId,
    gracePeriodMinutes: input.gracePeriodMinutes ?? 0,
    overtimeEnabled: input.overtimeEnabled ?? 0,
    lateMarkEnabled: input.lateMarkEnabled ?? 1,
    weeklyOffPolicy: input.weeklyOffPolicy,
    breakPolicy: input.breakPolicy ?? null,
  });
  const [row] = await db
    .select()
    .from(shifts)
    .where(and(eq(shifts.organizationId, input.organizationId), eq(shifts.name, input.name)))
    .limit(1);
  if (row && input.breaks?.length) {
    await replaceShiftBreaks(input.organizationId, row.id, input.breaks);
  }
  return row ? getShift(input.organizationId, row.id) : row;
}

export async function listShifts(organizationId: number) {
  const rows = await db.select().from(shifts).where(eq(shifts.organizationId, organizationId));
  const breakRows = await db.select().from(shiftBreaks).where(eq(shiftBreaks.organizationId, organizationId));
  const byShift = groupBreaksByShift(breakRows);
  return rows.map((row) => ({ ...row, breaks: byShift.get(row.id) ?? legacyBreaksFromPolicy(row.breakPolicy) }));
}

export async function getShift(organizationId: number, shiftId: number) {
  const [row] = await db
    .select()
    .from(shifts)
    .where(and(eq(shifts.organizationId, organizationId), eq(shifts.id, shiftId)))
    .limit(1);
  if (!row) return null;
  const rows = await db
    .select()
    .from(shiftBreaks)
    .where(and(eq(shiftBreaks.organizationId, organizationId), eq(shiftBreaks.shiftId, shiftId)));
  return { ...row, breaks: rows.length ? rows : legacyBreaksFromPolicy(row.breakPolicy) };
}

export type ShiftBreakInput = {
  category: "shift_break" | "casual_break";
  breakName?: string | null;
  payType: "paid" | "unpaid";
  ruleType: "interval" | "duration";
  durationMinutes?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  bufferStartTime?: string | null;
  bufferEndTime?: string | null;
};

function groupBreaksByShift(rows: (typeof shiftBreaks.$inferSelect)[]) {
  const map = new Map<number, (typeof shiftBreaks.$inferSelect)[]>();
  for (const row of rows) {
    const list = map.get(row.shiftId) ?? [];
    list.push(row);
    map.set(row.shiftId, list);
  }
  return map;
}

function legacyBreaksFromPolicy(breakPolicy: string | null) {
  if (!breakPolicy) return [];
  try {
    const parsed = JSON.parse(breakPolicy) as { breaks?: { start?: string; end?: string }[] };
    return (parsed.breaks ?? []).map((br, index) => ({
      id: 0 - index - 1,
      shiftId: 0,
      organizationId: 0,
      category: "shift_break" as const,
      breakName: `Break ${index + 1}`,
      payType: "unpaid" as const,
      ruleType: "interval" as const,
      durationMinutes: null,
      startTime: br.start ?? null,
      endTime: br.end ?? null,
      bufferStartTime: br.start ?? null,
      bufferEndTime: br.end ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  } catch {
    return [];
  }
}

async function replaceShiftBreaks(organizationId: number, shiftId: number, breaks: ShiftBreakInput[]) {
  await db.delete(shiftBreaks).where(and(eq(shiftBreaks.organizationId, organizationId), eq(shiftBreaks.shiftId, shiftId)));
  const values = breaks
    .map((br, index) => normalizeShiftBreakInput(organizationId, shiftId, br, index))
    .filter((br): br is NonNullable<ReturnType<typeof normalizeShiftBreakInput>> => Boolean(br));
  if (values.length) {
    await db.insert(shiftBreaks).values(values);
  }
}

function normalizeShiftBreakInput(organizationId: number, shiftId: number, br: ShiftBreakInput, index: number) {
  const ruleType: "interval" | "duration" = br.ruleType === "duration" ? "duration" : "interval";
  const category: "shift_break" | "casual_break" = br.category === "casual_break" ? "casual_break" : "shift_break";
  const payType: "paid" | "unpaid" = br.payType === "paid" ? "paid" : "unpaid";
  const durationMinutes =
    ruleType === "duration" ? Math.max(1, Math.min(24 * 60, Number(br.durationMinutes ?? 0))) : null;
  const startTime = ruleType === "interval" ? br.startTime ?? null : null;
  const endTime = ruleType === "interval" ? br.endTime ?? null : null;
  if (ruleType === "duration" && !durationMinutes) return null;
  if (ruleType === "interval" && (!startTime || !endTime)) return null;
  return {
    organizationId,
    shiftId,
    category,
    breakName: br.breakName?.trim() || (category === "casual_break" ? "Casual Break" : `Break ${index + 1}`),
    payType,
    ruleType,
    durationMinutes,
    startTime,
    endTime,
    bufferStartTime: ruleType === "interval" ? br.bufferStartTime ?? startTime : null,
    bufferEndTime: ruleType === "interval" ? br.bufferEndTime ?? endTime : null,
  };
}

export async function updateShift(input: {
  organizationId: number;
  shiftId: number;
  name: string;
  shiftCode?: string | null;
  shiftType?: "fixed" | "flexible" | "open" | "rotational";
  startTime: string;
  endTime: string;
  earliestPunchIn?: string | null;
  latestPunchOut?: string | null;
  branchId?: number;
  gracePeriodMinutes?: number;
  overtimeEnabled?: number;
  lateMarkEnabled?: number;
  weeklyOffPolicy?: string;
  breakPolicy?: string | null;
  breaks?: ShiftBreakInput[];
}) {
  const [existing] = await db
    .select()
    .from(shifts)
    .where(and(eq(shifts.organizationId, input.organizationId), eq(shifts.id, input.shiftId)))
    .limit(1);
  if (!existing) return null;
  await db
    .update(shifts)
    .set({
      name: input.name,
      shiftCode: input.shiftCode?.trim() || null,
      shiftType: input.shiftType ?? "fixed",
      startTime: input.startTime,
      endTime: input.endTime,
      earliestPunchIn: input.earliestPunchIn ?? null,
      latestPunchOut: input.latestPunchOut ?? null,
      branchId: input.branchId,
      gracePeriodMinutes: input.gracePeriodMinutes ?? 0,
      overtimeEnabled: input.overtimeEnabled ?? 0,
      lateMarkEnabled: input.lateMarkEnabled ?? 1,
      weeklyOffPolicy: input.weeklyOffPolicy,
      breakPolicy: input.breakPolicy ?? null,
    })
    .where(eq(shifts.id, input.shiftId));
  await replaceShiftBreaks(input.organizationId, input.shiftId, input.breaks ?? []);
  return getShift(input.organizationId, input.shiftId);
}

export async function assignShift(input: {
  organizationId: number;
  employeeId: number;
  shiftId: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isTemporary?: number;
}) {
  await db.insert(employeeShiftAssignments).values({
    organizationId: input.organizationId,
    employeeId: input.employeeId,
    shiftId: input.shiftId,
    effectiveFrom: new Date(input.effectiveFrom),
    effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : undefined,
    isTemporary: input.isTemporary ?? 0,
  });
  const [row] = await db
    .select()
    .from(employeeShiftAssignments)
    .where(
      and(
        eq(employeeShiftAssignments.organizationId, input.organizationId),
        eq(employeeShiftAssignments.employeeId, input.employeeId),
        eq(employeeShiftAssignments.shiftId, input.shiftId),
      ),
    )
    .limit(1);
  return row;
}

export async function createHoliday(input: { organizationId: number; name: string; holidayDate: string; branchId?: number }) {
  await db.insert(holidays).values({
    organizationId: input.organizationId,
    name: input.name,
    holidayDate: new Date(input.holidayDate),
    branchId: input.branchId,
  });
}

export async function listHolidays(organizationId: number) {
  return db.select().from(holidays).where(eq(holidays.organizationId, organizationId));
}

export type HolidayTemplateHolidayInput = {
  holidayName: string;
  holidayDate: string;
};

export async function listHolidayTemplates(organizationId: number) {
  const templates = await db.select().from(holidayTemplates).where(eq(holidayTemplates.organizationId, organizationId));
  const holidayRows = await db
    .select()
    .from(holidayTemplateHolidays)
    .where(eq(holidayTemplateHolidays.organizationId, organizationId));
  const byTemplate = new Map<number, (typeof holidayTemplateHolidays.$inferSelect)[]>();
  for (const row of holidayRows) {
    const rows = byTemplate.get(row.templateId) ?? [];
    rows.push(row);
    byTemplate.set(row.templateId, rows);
  }
  return templates.map((template) => ({
    ...template,
    holidays: byTemplate.get(template.id) ?? [],
    assignedTo: "Entire organization",
  }));
}

export async function createHolidayTemplate(input: {
  organizationId: number;
  name: string;
  startDate: string;
  endDate: string;
  holidays: HolidayTemplateHolidayInput[];
}) {
  await db.insert(holidayTemplates).values({
    organizationId: input.organizationId,
    name: input.name.trim(),
    startDate: new Date(input.startDate),
    endDate: new Date(input.endDate),
  });
  const [template] = await db
    .select()
    .from(holidayTemplates)
    .where(and(eq(holidayTemplates.organizationId, input.organizationId), eq(holidayTemplates.name, input.name.trim())))
    .orderBy(desc(holidayTemplates.id))
    .limit(1);
  if (!template) throw new Error("Holiday template could not be created");

  const cleaned = input.holidays
    .map((holiday) => ({
      organizationId: input.organizationId,
      templateId: template.id,
      holidayName: holiday.holidayName.trim(),
      holidayDate: new Date(holiday.holidayDate),
    }))
    .filter((holiday) => holiday.holidayName && !Number.isNaN(holiday.holidayDate.getTime()));

  if (cleaned.length) {
    await db.insert(holidayTemplateHolidays).values(cleaned);
    await db.insert(holidays).values(
      cleaned.map((holiday) => ({
        organizationId: holiday.organizationId,
        name: holiday.holidayName,
        holidayDate: holiday.holidayDate,
      })),
    );
  }

  await db.insert(holidayTemplateAssignments).values({
    organizationId: input.organizationId,
    templateId: template.id,
    assignmentType: "organization",
    assignmentId: null,
  });

  const [created] = (await listHolidayTemplates(input.organizationId)).filter((row) => row.id === template.id);
  return created;
}

export async function getHolidayTemplate(organizationId: number, templateId: number) {
  const [template] = await db
    .select()
    .from(holidayTemplates)
    .where(and(eq(holidayTemplates.organizationId, organizationId), eq(holidayTemplates.id, templateId)))
    .limit(1);
  if (!template) return null;

  const holidayRows = await db
    .select()
    .from(holidayTemplateHolidays)
    .where(
      and(eq(holidayTemplateHolidays.organizationId, organizationId), eq(holidayTemplateHolidays.templateId, templateId)),
    );

  return {
    ...template,
    holidays: holidayRows,
    assignedTo: "Entire organization",
  };
}

export async function updateHolidayTemplate(input: {
  organizationId: number;
  templateId: number;
  name: string;
  startDate: string;
  endDate: string;
  holidays: HolidayTemplateHolidayInput[];
}) {
  const existing = await getHolidayTemplate(input.organizationId, input.templateId);
  if (!existing) return null;

  await db
    .update(holidayTemplates)
    .set({
      name: input.name.trim(),
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
    })
    .where(
      and(eq(holidayTemplates.organizationId, input.organizationId), eq(holidayTemplates.id, input.templateId)),
    );

  await db
    .delete(holidayTemplateHolidays)
    .where(
      and(
        eq(holidayTemplateHolidays.organizationId, input.organizationId),
        eq(holidayTemplateHolidays.templateId, input.templateId),
      ),
    );

  const cleaned = input.holidays
    .map((holiday) => ({
      organizationId: input.organizationId,
      templateId: input.templateId,
      holidayName: holiday.holidayName.trim(),
      holidayDate: new Date(holiday.holidayDate),
    }))
    .filter((holiday) => holiday.holidayName && !Number.isNaN(holiday.holidayDate.getTime()));

  if (cleaned.length) {
    await db.insert(holidayTemplateHolidays).values(cleaned);
    await db.insert(holidays).values(
      cleaned.map((holiday) => ({
        organizationId: holiday.organizationId,
        name: holiday.holidayName,
        holidayDate: holiday.holidayDate,
      })),
    );
  }

  return getHolidayTemplate(input.organizationId, input.templateId);
}

export async function deleteHolidayTemplate(organizationId: number, templateId: number) {
  const existing = await getHolidayTemplate(organizationId, templateId);
  if (!existing) return false;

  await db
    .delete(holidayTemplates)
    .where(and(eq(holidayTemplates.organizationId, organizationId), eq(holidayTemplates.id, templateId)));

  return true;
}

export async function cloneHolidayTemplate(organizationId: number, templateId: number) {
  const source = await getHolidayTemplate(organizationId, templateId);
  if (!source) return null;

  const formatDate = (value: Date | string) => {
    const d = value instanceof Date ? value : new Date(value);
    return d.toISOString().slice(0, 10);
  };

  return createHolidayTemplate({
    organizationId,
    name: `${source.name} (Copy)`,
    startDate: formatDate(source.startDate),
    endDate: formatDate(source.endDate),
    holidays: source.holidays.map((h) => ({
      holidayName: h.holidayName,
      holidayDate: formatDate(h.holidayDate),
    })),
  });
}

export async function createAttendancePolicy(input: {
  organizationId: number;
  name: string;
  lateAfterMinutes?: number;
  halfDayAfterMinutes?: number;
  overtimeAfterMinutes?: number;
  weeklyOffDays?: string;
}) {
  await db.insert(attendancePolicies).values({
    organizationId: input.organizationId,
    name: input.name,
    lateAfterMinutes: input.lateAfterMinutes ?? 0,
    halfDayAfterMinutes: input.halfDayAfterMinutes ?? 240,
    overtimeAfterMinutes: input.overtimeAfterMinutes ?? 0,
    weeklyOffDays: input.weeklyOffDays ?? "sunday",
  });
}

export async function listAttendancePolicies(organizationId: number) {
  return db.select().from(attendancePolicies).where(eq(attendancePolicies.organizationId, organizationId));
}

export async function validateEmployeeShiftContext(input: {
  organizationId: number;
  employeeId: number;
  date: string;
}) {
  const targetDate = new Date(input.date);
  const [employee] = await db
    .select()
    .from(employees)
    .where(and(eq(employees.organizationId, input.organizationId), eq(employees.id, input.employeeId)))
    .limit(1);
  if (!employee || employee.status !== "active") {
    return { ok: false, reason: "Employee is inactive or not found" };
  }

  const [assignment] = await db
    .select()
    .from(employeeShiftAssignments)
    .where(
      and(
        eq(employeeShiftAssignments.organizationId, input.organizationId),
        eq(employeeShiftAssignments.employeeId, input.employeeId),
        lte(employeeShiftAssignments.effectiveFrom, targetDate),
        or(isNull(employeeShiftAssignments.effectiveTo), gte(employeeShiftAssignments.effectiveTo, targetDate)),
      ),
    )
    .limit(1);
  if (!assignment) {
    return { ok: false, reason: "No active shift assignment for date" };
  }

  const [holiday] = await db
    .select()
    .from(holidays)
    .where(and(eq(holidays.organizationId, input.organizationId), eq(holidays.holidayDate, targetDate)))
    .limit(1);
  if (holiday) {
    return { ok: false, reason: "Holiday. Attendance marking blocked by policy." };
  }

  return { ok: true, assignment };
}
