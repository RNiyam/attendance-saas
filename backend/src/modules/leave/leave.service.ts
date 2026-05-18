import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "../../database";
import {
  attendanceRecords,
  leaveApprovals,
  leaveBalances,
  leavePolicyApprovalApprovers,
  leavePolicyApprovalLevels,
  leavePolicyTemplateAssignments,
  leavePolicyTemplateItems,
  leavePolicyTemplates,
  leaveRequests,
  leaveTypes,
} from "../../database/schema";

function dateOnly(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function calcDays(startDate: Date, endDate: Date): number {
  const ms = dateOnly(endDate).getTime() - dateOnly(startDate).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
}

function dateRange(startDate: Date, endDate: Date): Date[] {
  const days: Date[] = [];
  const cur = dateOnly(startDate);
  const end = dateOnly(endDate);
  while (cur <= end) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export async function createLeaveType(input: {
  organizationId: number;
  name: string;
  code: string;
  annualQuota: string;
  isPaid?: number;
}) {
  await db.insert(leaveTypes).values({
    organizationId: input.organizationId,
    name: input.name,
    code: input.code,
    annualQuota: input.annualQuota,
    isPaid: input.isPaid ?? 1,
  });
}

export async function listLeaveTypes(organizationId: number) {
  return db.select().from(leaveTypes).where(eq(leaveTypes.organizationId, organizationId));
}

export async function upsertLeaveBalance(input: {
  organizationId: number;
  employeeId: number;
  leaveTypeId: number;
  allocated: string;
}) {
  const allocated = Number(input.allocated);
  await db
    .insert(leaveBalances)
    .values({
      organizationId: input.organizationId,
      employeeId: input.employeeId,
      leaveTypeId: input.leaveTypeId,
      allocated: input.allocated,
      used: "0",
      remaining: input.allocated,
    })
    .onDuplicateKeyUpdate({
      set: { allocated: input.allocated, remaining: String(allocated) },
    });
}

export async function requestLeave(input: {
  organizationId: number;
  employeeId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  reason?: string;
}) {
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  const days = calcDays(start, end);
  if (days <= 0) {
    const err = new Error("Invalid leave range");
    (err as { status?: number }).status = 400;
    throw err;
  }

  const [balance] = await db
    .select()
    .from(leaveBalances)
    .where(
      and(
        eq(leaveBalances.organizationId, input.organizationId),
        eq(leaveBalances.employeeId, input.employeeId),
        eq(leaveBalances.leaveTypeId, input.leaveTypeId),
      ),
    )
    .limit(1);
  if (!balance || Number(balance.remaining) < days) {
    const err = new Error("Insufficient leave balance");
    (err as { status?: number }).status = 400;
    throw err;
  }

  await db.insert(leaveRequests).values({
    organizationId: input.organizationId,
    employeeId: input.employeeId,
    leaveTypeId: input.leaveTypeId,
    startDate: start,
    endDate: end,
    days: String(days),
    reason: input.reason,
  });
}

export async function listLeaveRequests(organizationId: number) {
  return db.select().from(leaveRequests).where(eq(leaveRequests.organizationId, organizationId));
}

export async function decideLeave(input: {
  organizationId: number;
  leaveRequestId: number;
  approverUserId: number;
  decision: "approved" | "rejected";
  comment?: string;
}) {
  const [request] = await db
    .select()
    .from(leaveRequests)
    .where(and(eq(leaveRequests.organizationId, input.organizationId), eq(leaveRequests.id, input.leaveRequestId)))
    .limit(1);
  if (!request || request.status !== "pending") {
    const err = new Error("Leave request is not pending");
    (err as { status?: number }).status = 400;
    throw err;
  }

  await db.insert(leaveApprovals).values({
    organizationId: input.organizationId,
    leaveRequestId: input.leaveRequestId,
    approverUserId: input.approverUserId,
    decision: input.decision,
    comment: input.comment,
  });
  await db
    .update(leaveRequests)
    .set({ status: input.decision, approverUserId: input.approverUserId })
    .where(eq(leaveRequests.id, input.leaveRequestId));

  if (input.decision === "approved") {
    const [balance] = await db
      .select()
      .from(leaveBalances)
      .where(
        and(
          eq(leaveBalances.organizationId, input.organizationId),
          eq(leaveBalances.employeeId, request.employeeId),
          eq(leaveBalances.leaveTypeId, request.leaveTypeId),
        ),
      )
      .limit(1);
    if (balance) {
      const days = Number(request.days);
      const used = Number(balance.used) + days;
      const remaining = Math.max(0, Number(balance.remaining) - days);
      await db
        .update(leaveBalances)
        .set({ used: String(used), remaining: String(remaining) })
        .where(eq(leaveBalances.id, balance.id));
    }

    const dates = dateRange(new Date(request.startDate), new Date(request.endDate));
    for (const d of dates) {
      const [existing] = await db
        .select()
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.organizationId, input.organizationId),
            eq(attendanceRecords.employeeId, request.employeeId),
            eq(attendanceRecords.attendanceDate, d),
          ),
        )
        .limit(1);
      if (existing) {
        await db
          .update(attendanceRecords)
          .set({ attendanceStatus: "on_leave", checkInTime: null, checkOutTime: null, workDurationMinutes: 0 })
          .where(eq(attendanceRecords.id, existing.id));
      } else {
        await db.insert(attendanceRecords).values({
          organizationId: input.organizationId,
          employeeId: request.employeeId,
          attendanceDate: d,
          attendanceStatus: "on_leave",
          attendanceSource: "manual",
        });
      }
    }
  }
}

export type LeavePolicyCycle = "yearly" | "monthly" | "quarterly";
export type LeaveAccrualPeriod = "all_at_once" | "monthly" | "quarterly" | "na";

export type LeavePolicyItemInput = {
  leaveName: string;
  leaveCode?: string;
  annualQuota?: string;
  isPaid?: number;
  accrualPeriod?: LeaveAccrualPeriod;
  isSystem?: number;
  customFieldsCount?: number;
  sortOrder?: number;
};

export type ApproverType =
  | "owner"
  | "admin"
  | "restricted_admin"
  | "attendance_supervisors"
  | "reporting_manager";

export type LeavePolicyApproverInput = {
  approverType: ApproverType;
  approverName: string;
  substituteEnabled?: number;
  sortOrder?: number;
};

export type LeavePolicyApprovalLevelInput = {
  levelOrder: number;
  minApproversRequired: number;
  approvers: LeavePolicyApproverInput[];
};

export type LeavePolicyTemplateInput = {
  organizationId: number;
  name: string;
  startDate: string;
  endDate: string;
  policyCycle?: LeavePolicyCycle;
  unpaidLeaveEnabled?: number;
  countSandwichLeaves?: number;
  approvalLevels?: LeavePolicyApprovalLevelInput[];
  leaves: LeavePolicyItemInput[];
};

function slugLeaveCode(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "LV";
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  return words
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 8);
}

function normalizeItem(
  leave: LeavePolicyItemInput,
  policyCycle: LeavePolicyCycle,
  index: number,
  organizationId: number,
  templateId: number,
) {
  const isSystem = leave.isSystem ? 1 : 0;
  const accrualPeriod: LeaveAccrualPeriod =
    isSystem || policyCycle === "monthly"
      ? "na"
      : (leave.accrualPeriod ?? "all_at_once");
  const code = (leave.leaveCode?.trim() || slugLeaveCode(leave.leaveName)).toUpperCase();
  return {
    organizationId,
    templateId,
    leaveName: leave.leaveName.trim(),
    leaveCode: code,
    annualQuota: leave.annualQuota?.trim() ? leave.annualQuota : "0",
    isPaid: leave.isPaid ?? 1,
    accrualPeriod,
    isSystem,
    customFieldsCount: leave.customFieldsCount ?? 0,
    sortOrder: leave.sortOrder ?? index,
  };
}

export async function listLeavePolicyTemplates(organizationId: number) {
  const templates = await db
    .select()
    .from(leavePolicyTemplates)
    .where(eq(leavePolicyTemplates.organizationId, organizationId));
  const itemRows = await db
    .select()
    .from(leavePolicyTemplateItems)
    .where(eq(leavePolicyTemplateItems.organizationId, organizationId));
  const byTemplate = new Map<number, (typeof leavePolicyTemplateItems.$inferSelect)[]>();
  for (const row of itemRows) {
    const rows = byTemplate.get(row.templateId) ?? [];
    rows.push(row);
    byTemplate.set(row.templateId, rows);
  }
  return templates.map((template) => ({
    ...template,
    leaves: byTemplate.get(template.id) ?? [],
    assignedTo: "Entire organization",
  }));
}

export async function getLeavePolicyTemplate(organizationId: number, templateId: number) {
  const [template] = await db
    .select()
    .from(leavePolicyTemplates)
    .where(and(eq(leavePolicyTemplates.organizationId, organizationId), eq(leavePolicyTemplates.id, templateId)))
    .limit(1);
  if (!template) return null;

  const leaves = await db
    .select()
    .from(leavePolicyTemplateItems)
    .where(
      and(eq(leavePolicyTemplateItems.organizationId, organizationId), eq(leavePolicyTemplateItems.templateId, templateId)),
    );

  const approvalLevels = await getLeavePolicyApprovalLevels(organizationId, templateId);
  return { ...template, leaves, approvalLevels, assignedTo: "Entire organization" };
}

export async function getLeavePolicyApprovalLevels(organizationId: number, templateId: number) {
  const levels = await db
    .select()
    .from(leavePolicyApprovalLevels)
    .where(
      and(
        eq(leavePolicyApprovalLevels.organizationId, organizationId),
        eq(leavePolicyApprovalLevels.templateId, templateId),
      ),
    )
    .orderBy(asc(leavePolicyApprovalLevels.levelOrder));

  if (levels.length === 0) return [];

  const levelIds = levels.map((l) => l.id);
  const approvers = await db
    .select()
    .from(leavePolicyApprovalApprovers)
    .where(
      and(
        eq(leavePolicyApprovalApprovers.organizationId, organizationId),
        inArray(leavePolicyApprovalApprovers.levelId, levelIds),
      ),
    )
    .orderBy(asc(leavePolicyApprovalApprovers.sortOrder));

  const byLevel = new Map<number, (typeof leavePolicyApprovalApprovers.$inferSelect)[]>();
  for (const row of approvers) {
    const list = byLevel.get(row.levelId) ?? [];
    list.push(row);
    byLevel.set(row.levelId, list);
  }

  return levels.map((level) => ({
    id: level.id,
    levelOrder: level.levelOrder,
    minApproversRequired: level.minApproversRequired,
    approvers: (byLevel.get(level.id) ?? []).map((a) => ({
      id: a.id,
      approverType: a.approverType,
      approverName: a.approverName,
      substituteEnabled: a.substituteEnabled,
      sortOrder: a.sortOrder,
    })),
  }));
}

export async function saveLeavePolicyApprovalLevels(
  organizationId: number,
  templateId: number,
  levels: LeavePolicyApprovalLevelInput[],
) {
  const [template] = await db
    .select({ id: leavePolicyTemplates.id })
    .from(leavePolicyTemplates)
    .where(and(eq(leavePolicyTemplates.organizationId, organizationId), eq(leavePolicyTemplates.id, templateId)))
    .limit(1);
  if (!template) return null;

  const existingLevels = await db
    .select({ id: leavePolicyApprovalLevels.id })
    .from(leavePolicyApprovalLevels)
    .where(
      and(
        eq(leavePolicyApprovalLevels.organizationId, organizationId),
        eq(leavePolicyApprovalLevels.templateId, templateId),
      ),
    );

  if (existingLevels.length) {
    const existingIds = existingLevels.map((l) => l.id);
    await db
      .delete(leavePolicyApprovalApprovers)
      .where(
        and(
          eq(leavePolicyApprovalApprovers.organizationId, organizationId),
          inArray(leavePolicyApprovalApprovers.levelId, existingIds),
        ),
      );
    await db
      .delete(leavePolicyApprovalLevels)
      .where(
        and(
          eq(leavePolicyApprovalLevels.organizationId, organizationId),
          eq(leavePolicyApprovalLevels.templateId, templateId),
        ),
      );
  }

  for (const level of levels) {
    const [inserted] = await db
      .insert(leavePolicyApprovalLevels)
      .values({
        organizationId,
        templateId,
        levelOrder: level.levelOrder,
        minApproversRequired: level.minApproversRequired,
      })
      .$returningId();
    const levelId = inserted?.id;
    if (!levelId || !level.approvers.length) continue;

    await db.insert(leavePolicyApprovalApprovers).values(
      level.approvers.map((approver, index) => ({
        organizationId,
        levelId,
        approverType: approver.approverType,
        approverName: approver.approverName.trim() || "Any Admin",
        substituteEnabled: approver.substituteEnabled ?? 0,
        sortOrder: approver.sortOrder ?? index,
      })),
    );
  }

  const summary = levels.map((l) => ({
    levelOrder: l.levelOrder,
    approverCount: l.approvers.length,
    minApproversRequired: l.minApproversRequired,
  }));
  await db
    .update(leavePolicyTemplates)
    .set({ approvalLevelsJson: JSON.stringify(summary) })
    .where(and(eq(leavePolicyTemplates.organizationId, organizationId), eq(leavePolicyTemplates.id, templateId)));

  return getLeavePolicyApprovalLevels(organizationId, templateId);
}

async function syncLeaveTypesFromItems(
  organizationId: number,
  items: { leaveName: string; leaveCode: string; annualQuota: string; isPaid: number }[],
) {
  for (const item of items) {
    const code = item.leaveCode.trim().toUpperCase();
    const [existing] = await db
      .select()
      .from(leaveTypes)
      .where(and(eq(leaveTypes.organizationId, organizationId), eq(leaveTypes.code, code)))
      .limit(1);
    if (existing) {
      await db
        .update(leaveTypes)
        .set({
          name: item.leaveName.trim(),
          annualQuota: item.annualQuota,
          isPaid: item.isPaid,
        })
        .where(eq(leaveTypes.id, existing.id));
    } else {
      await db.insert(leaveTypes).values({
        organizationId,
        name: item.leaveName.trim(),
        code,
        annualQuota: item.annualQuota,
        isPaid: item.isPaid,
      });
    }
  }
}

export async function createLeavePolicyTemplate(input: LeavePolicyTemplateInput) {
  const policyCycle = input.policyCycle ?? "yearly";

  await db.insert(leavePolicyTemplates).values({
    organizationId: input.organizationId,
    name: input.name.trim(),
    startDate: new Date(input.startDate),
    endDate: new Date(input.endDate),
    policyCycle,
    unpaidLeaveEnabled: input.unpaidLeaveEnabled ?? 1,
    countSandwichLeaves: input.countSandwichLeaves ?? 0,
    approvalLevelsJson: null,
  });
  const [template] = await db
    .select()
    .from(leavePolicyTemplates)
    .where(
      and(eq(leavePolicyTemplates.organizationId, input.organizationId), eq(leavePolicyTemplates.name, input.name.trim())),
    )
    .orderBy(desc(leavePolicyTemplates.id))
    .limit(1);
  if (!template) throw new Error("Leave policy template could not be created");

  const cleaned = input.leaves
    .map((leave, index) => normalizeItem(leave, policyCycle, index, input.organizationId, template.id))
    .filter((leave) => leave.leaveName);

  if (cleaned.length) {
    await db.insert(leavePolicyTemplateItems).values(cleaned);
    await syncLeaveTypesFromItems(
      input.organizationId,
      cleaned.filter((c) => !c.isSystem),
    );
  }

  await db.insert(leavePolicyTemplateAssignments).values({
    organizationId: input.organizationId,
    templateId: template.id,
    assignmentType: "organization",
    assignmentId: null,
  });

  if (input.approvalLevels?.length) {
    await saveLeavePolicyApprovalLevels(input.organizationId, template.id, input.approvalLevels);
  }

  return getLeavePolicyTemplate(input.organizationId, template.id);
}

export async function updateLeavePolicyTemplate(
  input: LeavePolicyTemplateInput & { templateId: number },
) {
  const existing = await getLeavePolicyTemplate(input.organizationId, input.templateId);
  if (!existing) return null;

  const policyCycle = input.policyCycle ?? "yearly";

  await db
    .update(leavePolicyTemplates)
    .set({
      name: input.name.trim(),
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      policyCycle,
      unpaidLeaveEnabled: input.unpaidLeaveEnabled ?? 1,
      countSandwichLeaves: input.countSandwichLeaves ?? 0,
    })
    .where(
      and(eq(leavePolicyTemplates.organizationId, input.organizationId), eq(leavePolicyTemplates.id, input.templateId)),
    );

  await db
    .delete(leavePolicyTemplateItems)
    .where(
      and(
        eq(leavePolicyTemplateItems.organizationId, input.organizationId),
        eq(leavePolicyTemplateItems.templateId, input.templateId),
      ),
    );

  const cleaned = input.leaves
    .map((leave, index) =>
      normalizeItem(leave, policyCycle, index, input.organizationId, input.templateId),
    )
    .filter((leave) => leave.leaveName);

  if (cleaned.length) {
    await db.insert(leavePolicyTemplateItems).values(cleaned);
    await syncLeaveTypesFromItems(
      input.organizationId,
      cleaned.filter((c) => !c.isSystem),
    );
  }

  if (input.approvalLevels !== undefined) {
    await saveLeavePolicyApprovalLevels(input.organizationId, input.templateId, input.approvalLevels);
  }

  return getLeavePolicyTemplate(input.organizationId, input.templateId);
}

export async function deleteLeavePolicyTemplate(organizationId: number, templateId: number) {
  const existing = await getLeavePolicyTemplate(organizationId, templateId);
  if (!existing) return false;

  await db
    .delete(leavePolicyTemplates)
    .where(and(eq(leavePolicyTemplates.organizationId, organizationId), eq(leavePolicyTemplates.id, templateId)));

  return true;
}

export async function cloneLeavePolicyTemplate(organizationId: number, templateId: number) {
  const source = await getLeavePolicyTemplate(organizationId, templateId);
  if (!source) return null;

  const formatDate = (value: Date | string) => {
    const d = value instanceof Date ? value : new Date(value);
    return d.toISOString().slice(0, 10);
  };

  const approvalLevels = (source.approvalLevels ?? []).map((level) => ({
    levelOrder: level.levelOrder,
    minApproversRequired: level.minApproversRequired,
    approvers: level.approvers.map((a, index) => ({
      approverType: a.approverType as ApproverType,
      approverName: a.approverName,
      substituteEnabled: a.substituteEnabled,
      sortOrder: index,
    })),
  }));

  return createLeavePolicyTemplate({
    organizationId,
    name: `${source.name} (Copy)`,
    startDate: formatDate(source.startDate),
    endDate: formatDate(source.endDate),
    policyCycle: source.policyCycle ?? "yearly",
    unpaidLeaveEnabled: source.unpaidLeaveEnabled,
    countSandwichLeaves: source.countSandwichLeaves,
    approvalLevels,
    leaves: source.leaves.map((l, index) => ({
      leaveName: l.leaveName,
      leaveCode: `${l.leaveCode}_COPY`,
      annualQuota: String(l.annualQuota),
      isPaid: l.isPaid,
      accrualPeriod: l.accrualPeriod,
      isSystem: l.isSystem,
      customFieldsCount: l.customFieldsCount,
      sortOrder: index,
    })),
  });
}
