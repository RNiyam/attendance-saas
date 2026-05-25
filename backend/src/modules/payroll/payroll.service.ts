import { and, eq, sql } from "drizzle-orm";
import { db } from "../../database";
import {
  attendanceRecords,
  employees,
  payrollAdjustments,
  payrollCycles,
  payrollRuns,
  payslips,
} from "../../database/schema";

const DEFAULT_DAILY_BASE = 1000;

export async function createPayrollCycle(input: {
  organizationId: number;
  name: string;
  startDate: string;
  endDate: string;
}) {
  await db.insert(payrollCycles).values({
    organizationId: input.organizationId,
    name: input.name,
    startDate: new Date(input.startDate),
    endDate: new Date(input.endDate),
  });
}

export async function listPayrollCycles(organizationId: number) {
  return db.select().from(payrollCycles).where(eq(payrollCycles.organizationId, organizationId));
}

export async function addPayrollAdjustment(input: {
  organizationId: number;
  employeeId: number;
  payrollCycleId: number;
  adjustmentType: "bonus" | "deduction";
  amount: string;
  reason?: string;
}) {
  await db.insert(payrollAdjustments).values({
    organizationId: input.organizationId,
    employeeId: input.employeeId,
    payrollCycleId: input.payrollCycleId,
    adjustmentType: input.adjustmentType,
    amount: input.amount,
    reason: input.reason,
  });
}

export async function runPayroll(input: { organizationId: number; payrollCycleId: number }) {
  const [cycle] = await db
    .select()
    .from(payrollCycles)
    .where(and(eq(payrollCycles.organizationId, input.organizationId), eq(payrollCycles.id, input.payrollCycleId)))
    .limit(1);
  if (!cycle) {
    const err = new Error("Payroll cycle not found");
    (err as { status?: number }).status = 404;
    throw err;
  }

  await db
    .update(payrollCycles)
    .set({ status: "processing" })
    .where(eq(payrollCycles.id, input.payrollCycleId));

  await db.insert(payrollRuns).values({
    organizationId: input.organizationId,
    payrollCycleId: input.payrollCycleId,
    status: "started",
  });

  const employeeRows = await db
    .select({ id: employees.id })
    .from(employees)
    .where(and(eq(employees.organizationId, input.organizationId), eq(employees.status, "active")));

  let totalGross = 0;
  let totalNet = 0;
  for (const e of employeeRows) {
    const attRows = await db
      .select({
        count: sql<number>`count(*)`,
        overtime: sql<number>`coalesce(sum(${attendanceRecords.overtimeMinutes}), 0)`,
      })
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.organizationId, input.organizationId),
          eq(attendanceRecords.employeeId, e.id),
          sql`${attendanceRecords.attendanceDate} >= ${cycle.startDate}`,
          sql`${attendanceRecords.attendanceDate} <= ${cycle.endDate}`,
          sql`${attendanceRecords.attendanceStatus} in ('present','late')`,
        ),
      );

    const attendanceCount = Number(attRows[0]?.count ?? 0);
    const overtimeMinutes = Number(attRows[0]?.overtime ?? 0);
    const gross = attendanceCount * DEFAULT_DAILY_BASE + overtimeMinutes * 2;

    const adjRows = await db
      .select({
        bonus: sql<number>`coalesce(sum(case when ${payrollAdjustments.adjustmentType}='bonus' then ${payrollAdjustments.amount} else 0 end), 0)`,
        deduction: sql<number>`coalesce(sum(case when ${payrollAdjustments.adjustmentType}='deduction' then ${payrollAdjustments.amount} else 0 end), 0)`,
      })
      .from(payrollAdjustments)
      .where(
        and(
          eq(payrollAdjustments.organizationId, input.organizationId),
          eq(payrollAdjustments.employeeId, e.id),
          eq(payrollAdjustments.payrollCycleId, input.payrollCycleId),
        ),
      );

    const bonus = Number(adjRows[0]?.bonus ?? 0);
    const deduction = Number(adjRows[0]?.deduction ?? 0);
    const finalGross = gross + bonus;
    const net = Math.max(0, finalGross - deduction);
    totalGross += finalGross;
    totalNet += net;

    await db
      .insert(payslips)
      .values({
        organizationId: input.organizationId,
        employeeId: e.id,
        payrollCycleId: input.payrollCycleId,
        grossAmount: String(finalGross.toFixed(2)),
        deductionAmount: String(deduction.toFixed(2)),
        netAmount: String(net.toFixed(2)),
        status: "draft",
      })
      .onConflictDoUpdate({
        target: [payslips.organizationId, payslips.employeeId, payslips.payrollCycleId],
        set: {
          grossAmount: String(finalGross.toFixed(2)),
          deductionAmount: String(deduction.toFixed(2)),
          netAmount: String(net.toFixed(2)),
        },
      });
  }

  await db
    .update(payrollRuns)
    .set({
      status: "completed",
      totalEmployees: employeeRows.length,
      totalGross: String(totalGross.toFixed(2)),
      totalNet: String(totalNet.toFixed(2)),
    })
    .where(and(eq(payrollRuns.organizationId, input.organizationId), eq(payrollRuns.payrollCycleId, input.payrollCycleId)));

  await db
    .update(payrollCycles)
    .set({ status: "completed" })
    .where(eq(payrollCycles.id, input.payrollCycleId));
  return { ok: true, totalEmployees: employeeRows.length, totalGross, totalNet };
}

export async function listPayslips(input: { organizationId: number; payrollCycleId?: number }) {
  if (input.payrollCycleId) {
    return db
      .select()
      .from(payslips)
      .where(and(eq(payslips.organizationId, input.organizationId), eq(payslips.payrollCycleId, input.payrollCycleId)));
  }
  return db.select().from(payslips).where(eq(payslips.organizationId, input.organizationId));
}
