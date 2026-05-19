import { integer, numeric, pgTable, text, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import {
  addressTypeEnum,
  billingCycleEnum,
  employeeStatusEnum,
  employmentTypeEnum,
  genderEnum,
  workUnitEnum,
} from "./pg-enums";
import { tableId, createdAtCol, updatedAtCol, dateCol } from "../pg-columns";
import { branches, departments, designations } from "./org-structure";
import { organizations } from "./organizations";
import { users } from "./users";

export const employees = pgTable(
  "employees",
  {
    id: tableId(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    branchId: integer("branch_id").references(() => branches.id, { onDelete: "set null" }),
    departmentId: integer("department_id").references(() => departments.id, { onDelete: "set null" }),
    designationId: integer("designation_id").references(() => designations.id, { onDelete: "set null" }),
    managerEmployeeId: integer("manager_employee_id"),
    employeeCode: varchar("employee_code", { length: 64 }).notNull(),
    workEmail: varchar("work_email", { length: 255 }),
    phone: varchar("phone", { length: 32 }),
    firstName: varchar("first_name", { length: 120 }).notNull(),
    lastName: varchar("last_name", { length: 120 }),
    gender: genderEnum("gender"),
    dob: dateCol("dob"),
    joiningDate: dateCol("joining_date").notNull(),
    employmentType: employmentTypeEnum("employment_type").notNull().default("FULL_TIME"),
    workLocation: varchar("work_location", { length: 120 }),
    managerName: varchar("manager_name", { length: 150 }),
    weeklyOffPolicy: varchar("weekly_off_policy", { length: 120 }),
    ctc: numeric("ctc", { precision: 12, scale: 2 }),
    salaryStructure: varchar("salary_structure", { length: 120 }),
    bankAccountNumber: varchar("bank_account_number", { length: 64 }),
    bankIfsc: varchar("bank_ifsc", { length: 20 }),
    pan: varchar("pan", { length: 20 }),
    aadhaar: varchar("aadhaar", { length: 20 }),
    pfNumber: varchar("pf_number", { length: 64 }),
    esiNumber: varchar("esi_number", { length: 64 }),
    workHoursPerWeek: numeric("work_hours_per_week", { precision: 6, scale: 2 }),
    hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
    proratedSalaryPercent: numeric("prorated_salary_percent", { precision: 5, scale: 2 }),
    contractStart: dateCol("contract_start"),
    contractEnd: dateCol("contract_end"),
    vendorCompany: varchar("vendor_company", { length: 150 }),
    billingCycle: billingCycleEnum("billing_cycle"),
    invoiceAmount: numeric("invoice_amount", { precision: 12, scale: 2 }),
    dailyWage: numeric("daily_wage", { precision: 10, scale: 2 }),
    workUnit: workUnitEnum("work_unit"),
    supervisor: varchar("supervisor", { length: 150 }),
    internshipStart: dateCol("internship_start"),
    internshipEnd: dateCol("internship_end"),
    mentor: varchar("mentor", { length: 150 }),
    stipend: numeric("stipend", { precision: 10, scale: 2 }),
    college: varchar("college", { length: 180 }),
    probationStart: dateCol("probation_start"),
    probationEnd: dateCol("probation_end"),
    confirmationDate: dateCol("confirmation_date"),
    onboardingNotes: text("onboarding_notes"),
    profileImageUrl: varchar("profile_image_url", { length: 1024 }),
    biometricId: varchar("biometric_id", { length: 120 }),
    faceRecognitionId: varchar("face_recognition_id", { length: 120 }),
    status: employeeStatusEnum("status").notNull().default("invited"),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (t) => [
    uniqueIndex("employees_org_code_uidx").on(t.organizationId, t.employeeCode),
    uniqueIndex("employees_org_user_uidx").on(t.organizationId, t.userId),
  ],
);

export const employeeContacts = pgTable("employee_contacts", {
  id: tableId(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 150 }).notNull(),
  relation: varchar("relation", { length: 80 }),
  phone: varchar("phone", { length: 32 }).notNull(),
  email: varchar("email", { length: 255 }),
  isPrimary: integer("is_primary").notNull().default(0),
  createdAt: createdAtCol(),
  updatedAt: updatedAtCol(),
});

export const employeeAddresses = pgTable("employee_addresses", {
  id: tableId(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  addressType: addressTypeEnum("address_type").notNull().default("current"),
  line1: varchar("line1", { length: 255 }).notNull(),
  line2: varchar("line2", { length: 255 }),
  city: varchar("city", { length: 120 }),
  state: varchar("state", { length: 120 }),
  country: varchar("country", { length: 2 }),
  postalCode: varchar("postal_code", { length: 20 }),
  createdAt: createdAtCol(),
  updatedAt: updatedAtCol(),
});
