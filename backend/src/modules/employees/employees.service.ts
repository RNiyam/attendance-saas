import { createHash, randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../../database";
import {
  attendancePolicies,
  branches,
  departments,
  designations,
  employeeAttendancePolicyAssignments,
  employeeOnboardingInvites,
  employeeSalaryTemplateAssignments,
  employeeShiftAssignments,
  employeeFaces,
  employees,
  holidayTemplateAssignments,
  holidayTemplates,
  leavePolicyTemplateAssignments,
  leavePolicyTemplates,
  organizations,
  roles,
  salaryTemplates,
  shifts,
  userRoles,
  users,
} from "../../database/schema";
import { sendEmployeeInviteEmail } from "../email/email.service";

const BCRYPT_ROUNDS = 12;
export type EmployeeType = "FULL_TIME" | "PART_TIME" | "INTERN" | "PROBATION";
export type BillingCycle = "weekly" | "monthly" | "project" | "milestone";
export type WorkUnit = "day" | "hour" | "piece";

function sha(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export type InviteEmployeeInput = {
  organizationId: number;
  invitedByName: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  employeeCode: string;
  joiningDate: string;
  employeeType?: EmployeeType;
  gender?: "male" | "female" | "other";
  dob?: string;
  workLocation?: string;
  managerName?: string;
  managerEmployeeId?: number;
  branchId?: number;
  departmentId?: number;
  designationId?: number;
  shiftId?: number;
  attendancePolicyId?: number;
  holidayTemplateId?: number;
  leavePolicyTemplateId?: number;
  salaryTemplateId?: number;
  weeklyOffPolicy?: string;
  ctc?: string;
  salaryStructure?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  pan?: string;
  aadhaar?: string;
  pfNumber?: string;
  esiNumber?: string;
  workHoursPerWeek?: string;
  hourlyRate?: string;
  proratedSalaryPercent?: string;
  contractStart?: string;
  contractEnd?: string;
  vendorCompany?: string;
  billingCycle?: BillingCycle;
  invoiceAmount?: string;
  dailyWage?: string;
  workUnit?: WorkUnit;
  supervisor?: string;
  internshipStart?: string;
  internshipEnd?: string;
  mentor?: string;
  stipend?: string;
  college?: string;
  probationStart?: string;
  probationEnd?: string;
  confirmationDate?: string;
  onboardingNotes?: string;
  sendInvite?: boolean;
  appInviteBaseUrl?: string;
};

function dateOrUndefined(value?: string) {
  return value ? new Date(value) : undefined;
}

function emptyToUndefined(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

async function assertOrgRow(
  organizationId: number,
  label: string,
  id: number | undefined,
  table: typeof employees | typeof branches | typeof departments | typeof designations | typeof shifts | typeof attendancePolicies | typeof holidayTemplates | typeof leavePolicyTemplates | typeof salaryTemplates,
) {
  if (!id) return;
  const [row] = await db
    .select({ id: table.id })
    .from(table)
    .where(and(eq(table.organizationId, organizationId), eq(table.id, id)))
    .limit(1);
  if (!row) {
    const err = new Error(`${label} not found for this organization`);
    (err as { status?: number }).status = 400;
    throw err;
  }
}

async function insertEmployeeTemplateAssignments(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: InviteEmployeeInput,
  employeeId: number,
) {
  const effectiveFrom = new Date(input.joiningDate);

  if (input.shiftId) {
    await tx.insert(employeeShiftAssignments).values({
      organizationId: input.organizationId,
      employeeId,
      shiftId: input.shiftId,
      effectiveFrom,
    });
  }

  if (input.attendancePolicyId) {
    await tx.insert(employeeAttendancePolicyAssignments).values({
      organizationId: input.organizationId,
      employeeId,
      attendancePolicyId: input.attendancePolicyId,
      effectiveFrom,
    });
  }

  if (input.holidayTemplateId) {
    await tx.insert(holidayTemplateAssignments).values({
      organizationId: input.organizationId,
      templateId: input.holidayTemplateId,
      assignmentType: "employee",
      assignmentId: employeeId,
    });
  }

  if (input.leavePolicyTemplateId) {
    await tx.insert(leavePolicyTemplateAssignments).values({
      organizationId: input.organizationId,
      templateId: input.leavePolicyTemplateId,
      assignmentType: "employee",
      assignmentId: employeeId,
    });
  }

  if (input.salaryTemplateId) {
    await tx.insert(employeeSalaryTemplateAssignments).values({
      organizationId: input.organizationId,
      employeeId,
      salaryTemplateId: input.salaryTemplateId,
      effectiveFrom,
    });
  }
}

export async function inviteEmployee(input: InviteEmployeeInput) {
  const tokenRaw = randomBytes(32).toString("hex");
  const token = sha(tokenRaw);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  const shouldInvite = input.sendInvite ?? true;

  await Promise.all([
    assertOrgRow(input.organizationId, "Branch", input.branchId, branches),
    assertOrgRow(input.organizationId, "Department", input.departmentId, departments),
    assertOrgRow(input.organizationId, "Designation", input.designationId, designations),
    assertOrgRow(input.organizationId, "Manager", input.managerEmployeeId, employees),
    assertOrgRow(input.organizationId, "Shift", input.shiftId, shifts),
    assertOrgRow(input.organizationId, "Attendance template", input.attendancePolicyId, attendancePolicies),
    assertOrgRow(input.organizationId, "Holiday template", input.holidayTemplateId, holidayTemplates),
    assertOrgRow(input.organizationId, "Leave policy", input.leavePolicyTemplateId, leavePolicyTemplates),
    assertOrgRow(input.organizationId, "Salary template", input.salaryTemplateId, salaryTemplates),
  ]);

  const created = await db.transaction(async (tx) => {
    await tx.insert(employees).values({
      organizationId: input.organizationId,
      firstName: input.firstName,
      lastName: input.lastName,
      workEmail: input.email.toLowerCase(),
      phone: emptyToUndefined(input.phone),
      employeeCode: input.employeeCode,
      joiningDate: new Date(input.joiningDate),
      employmentType: input.employeeType ?? "FULL_TIME",
      gender: input.gender,
      dob: dateOrUndefined(input.dob),
      workLocation: emptyToUndefined(input.workLocation),
      managerName: emptyToUndefined(input.managerName),
      managerEmployeeId: input.managerEmployeeId,
      branchId: input.branchId,
      departmentId: input.departmentId,
      designationId: input.designationId,
      weeklyOffPolicy: emptyToUndefined(input.weeklyOffPolicy),
      ctc: emptyToUndefined(input.ctc),
      salaryStructure: emptyToUndefined(input.salaryStructure),
      bankAccountNumber: emptyToUndefined(input.bankAccountNumber),
      bankIfsc: emptyToUndefined(input.bankIfsc),
      pan: emptyToUndefined(input.pan),
      aadhaar: emptyToUndefined(input.aadhaar),
      pfNumber: emptyToUndefined(input.pfNumber),
      esiNumber: emptyToUndefined(input.esiNumber),
      workHoursPerWeek: emptyToUndefined(input.workHoursPerWeek),
      hourlyRate: emptyToUndefined(input.hourlyRate),
      proratedSalaryPercent: emptyToUndefined(input.proratedSalaryPercent),
      contractStart: dateOrUndefined(input.contractStart),
      contractEnd: dateOrUndefined(input.contractEnd),
      vendorCompany: emptyToUndefined(input.vendorCompany),
      billingCycle: input.billingCycle,
      invoiceAmount: emptyToUndefined(input.invoiceAmount),
      dailyWage: emptyToUndefined(input.dailyWage),
      workUnit: input.workUnit,
      supervisor: emptyToUndefined(input.supervisor),
      internshipStart: dateOrUndefined(input.internshipStart),
      internshipEnd: dateOrUndefined(input.internshipEnd),
      mentor: emptyToUndefined(input.mentor),
      stipend: emptyToUndefined(input.stipend),
      college: emptyToUndefined(input.college),
      probationStart: dateOrUndefined(input.probationStart),
      probationEnd: dateOrUndefined(input.probationEnd),
      confirmationDate: dateOrUndefined(input.confirmationDate),
      onboardingNotes: emptyToUndefined(input.onboardingNotes),
      status: shouldInvite ? "invited" : "inactive",
    });
    const [employee] = await tx
      .select()
      .from(employees)
      .where(and(eq(employees.organizationId, input.organizationId), eq(employees.employeeCode, input.employeeCode)))
      .limit(1);
    if (!employee) throw new Error("Failed to create employee");

    await insertEmployeeTemplateAssignments(tx, input, employee.id);

    let invite: typeof employeeOnboardingInvites.$inferSelect | null = null;
    if (shouldInvite) {
      await tx.insert(employeeOnboardingInvites).values({
        organizationId: input.organizationId,
        employeeId: employee.id,
        email: input.email.toLowerCase(),
        token,
        expiresAt,
      });

      const [inviteRow] = await tx
        .select()
        .from(employeeOnboardingInvites)
        .where(and(eq(employeeOnboardingInvites.employeeId, employee.id), eq(employeeOnboardingInvites.token, token)))
        .limit(1);
      if (!inviteRow) throw new Error("Failed to create invite");
      invite = inviteRow;
    }
    return { employee, invite };
  });

  const [org] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, input.organizationId))
    .limit(1);

  if (shouldInvite) {
    const inviteBase = input.appInviteBaseUrl ?? "https://app.example.com/activate";
    const inviteUrl = `${inviteBase}?token=${tokenRaw}`;
    await sendEmployeeInviteEmail({
      organizationId: input.organizationId,
      to: input.email,
      employeeName: `${input.firstName} ${input.lastName ?? ""}`.trim(),
      organizationName: org?.name ?? "Your Organization",
      inviteUrl,
      invitedByName: input.invitedByName,
    }).catch((e) => console.error("[employees] invite email failed:", e));
  }

  return created;
}

export async function getEmployeeOnboardingOptions(organizationId: number) {
  const [
    branchRows,
    departmentRows,
    designationRows,
    managerRows,
    shiftRows,
    attendancePolicyRows,
    holidayTemplateRows,
    leavePolicyRows,
    salaryTemplateRows,
  ] = await Promise.all([
    db.select().from(branches).where(eq(branches.organizationId, organizationId)).orderBy(asc(branches.name)),
    db.select().from(departments).where(eq(departments.organizationId, organizationId)).orderBy(asc(departments.name)),
    db.select().from(designations).where(eq(designations.organizationId, organizationId)).orderBy(asc(designations.title)),
    db
      .select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName, employeeCode: employees.employeeCode })
      .from(employees)
      .where(eq(employees.organizationId, organizationId))
      .orderBy(asc(employees.firstName)),
    db.select().from(shifts).where(eq(shifts.organizationId, organizationId)).orderBy(asc(shifts.name)),
    db.select().from(attendancePolicies).where(eq(attendancePolicies.organizationId, organizationId)).orderBy(asc(attendancePolicies.name)),
    db.select().from(holidayTemplates).where(eq(holidayTemplates.organizationId, organizationId)).orderBy(asc(holidayTemplates.name)),
    db.select().from(leavePolicyTemplates).where(eq(leavePolicyTemplates.organizationId, organizationId)).orderBy(asc(leavePolicyTemplates.name)),
    db.select().from(salaryTemplates).where(eq(salaryTemplates.organizationId, organizationId)).orderBy(asc(salaryTemplates.name)),
  ]);

  return {
    branches: branchRows,
    departments: departmentRows,
    designations: designationRows,
    managers: managerRows.map((row) => ({
      ...row,
      name: `${row.firstName} ${row.lastName ?? ""}`.trim(),
    })),
    shifts: shiftRows,
    attendancePolicies: attendancePolicyRows,
    holidayTemplates: holidayTemplateRows,
    leavePolicyTemplates: leavePolicyRows,
    salaryTemplates: salaryTemplateRows,
  };
}

export async function activateEmployeeInvite(tokenRaw: string, password: string) {
  const token = sha(tokenRaw);
  const [invite] = await db
    .select()
    .from(employeeOnboardingInvites)
    .where(eq(employeeOnboardingInvites.token, token))
    .limit(1);
  if (!invite || invite.status !== "pending") {
    const err = new Error("Invalid or expired invite token");
    (err as { status?: number }).status = 400;
    throw err;
  }
  if (new Date(invite.expiresAt) < new Date()) {
    await db
      .update(employeeOnboardingInvites)
      .set({ status: "expired" })
      .where(eq(employeeOnboardingInvites.id, invite.id));
    const err = new Error("Invite token expired");
    (err as { status?: number }).status = 400;
    throw err;
  }

  return db.transaction(async (tx) => {
    const [existingUser] = await tx
      .select()
      .from(users)
      .where(and(eq(users.organizationId, invite.organizationId), eq(users.email, invite.email)))
      .limit(1);

    let userId = existingUser?.id;
    if (!userId) {
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      await tx.insert(users).values({
        organizationId: invite.organizationId,
        uuid: randomUUID(),
        email: invite.email,
        passwordHash,
        status: "active",
      });
      const [createdUser] = await tx
        .select()
        .from(users)
        .where(and(eq(users.organizationId, invite.organizationId), eq(users.email, invite.email)))
        .limit(1);
      if (!createdUser) throw new Error("Failed to create user from invite");
      userId = createdUser.id;
    }

    await tx.update(employees).set({ userId, status: "active" }).where(eq(employees.id, invite.employeeId));
    await tx
      .update(employeeOnboardingInvites)
      .set({ status: "accepted", acceptedAt: new Date() })
      .where(eq(employeeOnboardingInvites.id, invite.id));

    const [employeeRole] = await tx
      .select()
      .from(roles)
      .where(and(eq(roles.organizationId, invite.organizationId), eq(roles.name, "EMPLOYEE")))
      .limit(1);
    if (employeeRole && userId) {
      await tx
        .insert(userRoles)
        .values({ userId, roleId: employeeRole.id })
        .onConflictDoUpdate({
          target: [userRoles.userId, userRoles.roleId],
          set: { roleId: employeeRole.id },
        });
    }
    return { ok: true };
  });
}

export async function listEmployees(organizationId: number) {
  return db.select().from(employees).where(eq(employees.organizationId, organizationId));
}

export async function getEmployeeById(organizationId: number, employeeId: number) {
  const [row] = await db
    .select()
    .from(employees)
    .where(and(eq(employees.organizationId, organizationId), eq(employees.id, employeeId)))
    .limit(1);
  return row ?? null;
}

export async function registerEmployeeFace(organizationId: number, employeeId: number, embedding: number[], imageUrl?: string) {
  // Check if employee exists
  const employee = await getEmployeeById(organizationId, employeeId);
  if (!employee) {
    throw new Error("Employee not found");
  }

  await db.transaction(async (tx) => {
    // Insert or update face
    await tx.insert(employeeFaces).values({
      organizationId,
      employeeId,
      embedding,
      imageUrl,
    });

    if (imageUrl) {
      await tx
        .update(employees)
        .set({ profileImageUrl: imageUrl })
        .where(eq(employees.id, employeeId));
    }
  });

  return { success: true };
}
