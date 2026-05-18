import { and, eq } from "drizzle-orm";
import { db } from "../../database";
import { branches, departments, designations, organizations, shifts } from "../../database/schema";

export const PAYABLE_DAYS_POLICIES = [
  "calendar_month",
  "fixed_30",
  "fixed_28",
  "fixed_26",
  "exclude_weekly_offs",
] as const;

export type PayableDaysPolicy = (typeof PAYABLE_DAYS_POLICIES)[number];

export function isPayableDaysPolicy(value: string): value is PayableDaysPolicy {
  return (PAYABLE_DAYS_POLICIES as readonly string[]).includes(value);
}

export async function updateOrganizationPayrollDefaults(
  organizationId: number,
  input: { payableDaysPolicy: PayableDaysPolicy; standardWorkdayMinutes: number },
) {
  await db
    .update(organizations)
    .set({
      payableDaysPolicy: input.payableDaysPolicy,
      standardWorkdayMinutes: input.standardWorkdayMinutes,
    })
    .where(eq(organizations.id, organizationId));
}

type OrgScoped = { organizationId: number };

export async function createBranch(input: OrgScoped & { name: string; address?: string; timezone?: string }) {
  const name = input.name.trim();
  const [existing] = await db
    .select()
    .from(branches)
    .where(and(eq(branches.organizationId, input.organizationId), eq(branches.name, name)))
    .limit(1);
  if (existing) return existing;

  await db.insert(branches).values({
    organizationId: input.organizationId,
    name,
    address: input.address,
    timezone: input.timezone,
  });
  const [row] = await db
    .select()
    .from(branches)
    .where(and(eq(branches.organizationId, input.organizationId), eq(branches.name, name)))
    .limit(1);
  return row;
}

export async function listBranches(organizationId: number) {
  return db.select().from(branches).where(eq(branches.organizationId, organizationId));
}

export async function createDepartment(input: OrgScoped & { name: string; branchId?: number; description?: string }) {
  const name = input.name.trim();
  const [existing] = await db
    .select()
    .from(departments)
    .where(and(eq(departments.organizationId, input.organizationId), eq(departments.name, name)))
    .limit(1);
  if (existing) return existing;

  await db.insert(departments).values({
    organizationId: input.organizationId,
    name,
    branchId: input.branchId,
    description: input.description,
  });
  const [row] = await db
    .select()
    .from(departments)
    .where(and(eq(departments.organizationId, input.organizationId), eq(departments.name, name)))
    .limit(1);
  return row;
}

export async function listDepartments(organizationId: number) {
  return db.select().from(departments).where(eq(departments.organizationId, organizationId));
}

export async function createDesignation(input: OrgScoped & { title: string; level?: string }) {
  const title = input.title.trim();
  const [existing] = await db
    .select()
    .from(designations)
    .where(and(eq(designations.organizationId, input.organizationId), eq(designations.title, title)))
    .limit(1);
  if (existing) return existing;

  await db.insert(designations).values({
    organizationId: input.organizationId,
    title,
    level: input.level,
  });
  const [row] = await db
    .select()
    .from(designations)
    .where(and(eq(designations.organizationId, input.organizationId), eq(designations.title, title)))
    .limit(1);
  return row;
}

export async function listDesignations(organizationId: number) {
  return db.select().from(designations).where(eq(designations.organizationId, organizationId));
}

export type BusinessFunctionType = "departments" | "designations" | "shifts";

export async function ensureOrganizationOnlyDepartment(organizationId: number) {
  const existingDepartments = await listDepartments(organizationId);
  if (existingDepartments.length > 0) return existingDepartments[0];

  const [organization] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  return createDepartment({
    organizationId,
    name: organization?.name?.trim() || "Organization",
  });
}

export async function listBusinessFunctions(organizationId: number) {
  const [departmentRows, designationRows, shiftRows] = await Promise.all([
    listDepartments(organizationId),
    listDesignations(organizationId),
    db.select().from(shifts).where(eq(shifts.organizationId, organizationId)),
  ]);

  return {
    departments: departmentRows.map((row) => ({ id: row.id, name: row.name })),
    designations: designationRows.map((row) => ({ id: row.id, name: row.title })),
    shifts: shiftRows.map((row) => ({
      id: row.id,
      name: row.name,
      startTime: String(row.startTime).slice(0, 5),
      endTime: String(row.endTime).slice(0, 5),
    })),
  };
}

export async function createBusinessFunctionValue(
  organizationId: number,
  type: BusinessFunctionType,
  input: { name: string; startTime?: string; endTime?: string },
) {
  const name = input.name.trim();
  if (type === "departments") return createDepartment({ organizationId, name });
  if (type === "designations") return createDesignation({ organizationId, title: name });

  const [existing] = await db
    .select()
    .from(shifts)
    .where(and(eq(shifts.organizationId, organizationId), eq(shifts.name, name)))
    .limit(1);
  if (existing) return existing;

  await db.insert(shifts).values({
    organizationId,
    name,
    shiftType: "fixed",
    startTime: input.startTime ?? "09:00:00",
    endTime: input.endTime ?? "18:00:00",
  });
  const [row] = await db
    .select()
    .from(shifts)
    .where(and(eq(shifts.organizationId, organizationId), eq(shifts.name, name)))
    .limit(1);
  return row;
}

export async function deleteBusinessFunctionValue(organizationId: number, type: BusinessFunctionType, id: number) {
  if (type === "departments") {
    const [row] = await db
      .select()
      .from(departments)
      .where(and(eq(departments.organizationId, organizationId), eq(departments.id, id)))
      .limit(1);
    if (!row) return null;
    await db.delete(departments).where(and(eq(departments.organizationId, organizationId), eq(departments.id, id)));
    return row;
  }

  if (type === "designations") {
    const [row] = await db
      .select()
      .from(designations)
      .where(and(eq(designations.organizationId, organizationId), eq(designations.id, id)))
      .limit(1);
    if (!row) return null;
    await db.delete(designations).where(and(eq(designations.organizationId, organizationId), eq(designations.id, id)));
    return row;
  }

  const [row] = await db
    .select()
    .from(shifts)
    .where(and(eq(shifts.organizationId, organizationId), eq(shifts.id, id)))
    .limit(1);
  if (!row) return null;
  await db.delete(shifts).where(and(eq(shifts.organizationId, organizationId), eq(shifts.id, id)));
  return row;
}
