import {
  date,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { branches, departments, designations } from "./org-structure";
import { organizations } from "./organizations";
import { users } from "./users";

export const employees = mysqlTable(
  "employees",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: int("user_id").references(() => users.id, { onDelete: "set null" }),
    branchId: int("branch_id").references(() => branches.id, { onDelete: "set null" }),
    departmentId: int("department_id").references(() => departments.id, { onDelete: "set null" }),
    designationId: int("designation_id").references(() => designations.id, { onDelete: "set null" }),
    managerEmployeeId: int("manager_employee_id"),
    employeeCode: varchar("employee_code", { length: 64 }).notNull(),
    workEmail: varchar("work_email", { length: 255 }),
    phone: varchar("phone", { length: 32 }),
    firstName: varchar("first_name", { length: 120 }).notNull(),
    lastName: varchar("last_name", { length: 120 }),
    gender: mysqlEnum("gender", ["male", "female", "other"]),
    dob: date("dob"),
    joiningDate: date("joining_date").notNull(),
    employmentType: mysqlEnum("employment_type", [
      "FULL_TIME",
      "PART_TIME",
      "INTERN",
      "PROBATION",
    ])
      .notNull()
      .default("FULL_TIME"),
    workLocation: varchar("work_location", { length: 120 }),
    managerName: varchar("manager_name", { length: 150 }),
    weeklyOffPolicy: varchar("weekly_off_policy", { length: 120 }),
    ctc: decimal("ctc", { precision: 12, scale: 2 }),
    salaryStructure: varchar("salary_structure", { length: 120 }),
    bankAccountNumber: varchar("bank_account_number", { length: 64 }),
    bankIfsc: varchar("bank_ifsc", { length: 20 }),
    pan: varchar("pan", { length: 20 }),
    aadhaar: varchar("aadhaar", { length: 20 }),
    pfNumber: varchar("pf_number", { length: 64 }),
    esiNumber: varchar("esi_number", { length: 64 }),
    workHoursPerWeek: decimal("work_hours_per_week", { precision: 6, scale: 2 }),
    hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
    proratedSalaryPercent: decimal("prorated_salary_percent", { precision: 5, scale: 2 }),
    contractStart: date("contract_start"),
    contractEnd: date("contract_end"),
    vendorCompany: varchar("vendor_company", { length: 150 }),
    billingCycle: mysqlEnum("billing_cycle", ["weekly", "monthly", "project", "milestone"]),
    invoiceAmount: decimal("invoice_amount", { precision: 12, scale: 2 }),
    dailyWage: decimal("daily_wage", { precision: 10, scale: 2 }),
    workUnit: mysqlEnum("work_unit", ["day", "hour", "piece"]),
    supervisor: varchar("supervisor", { length: 150 }),
    internshipStart: date("internship_start"),
    internshipEnd: date("internship_end"),
    mentor: varchar("mentor", { length: 150 }),
    stipend: decimal("stipend", { precision: 10, scale: 2 }),
    college: varchar("college", { length: 180 }),
    probationStart: date("probation_start"),
    probationEnd: date("probation_end"),
    confirmationDate: date("confirmation_date"),
    onboardingNotes: text("onboarding_notes"),
    profileImageUrl: varchar("profile_image_url", { length: 1024 }),
    biometricId: varchar("biometric_id", { length: 120 }),
    faceRecognitionId: varchar("face_recognition_id", { length: 120 }),
    status: mysqlEnum("status", ["active", "invited", "inactive"]).notNull().default("invited"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    uniqueIndex("employees_org_code_uidx").on(t.organizationId, t.employeeCode),
    uniqueIndex("employees_org_user_uidx").on(t.organizationId, t.userId),
  ],
);

export const employeeContacts = mysqlTable("employee_contacts", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  employeeId: int("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 150 }).notNull(),
  relation: varchar("relation", { length: 80 }),
  phone: varchar("phone", { length: 32 }).notNull(),
  email: varchar("email", { length: 255 }),
  isPrimary: int("is_primary").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const employeeAddresses = mysqlTable("employee_addresses", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  employeeId: int("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  addressType: mysqlEnum("address_type", ["current", "permanent"]).notNull().default("current"),
  line1: varchar("line1", { length: 255 }).notNull(),
  line2: varchar("line2", { length: 255 }),
  city: varchar("city", { length: 120 }),
  state: varchar("state", { length: 120 }),
  country: varchar("country", { length: 2 }),
  postalCode: varchar("postal_code", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
