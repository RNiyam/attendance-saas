import { date, decimal, int, mysqlEnum, mysqlTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { employees } from "./employees";
import { organizations } from "./organizations";

export const salaryComponents = mysqlTable(
  "salary_components",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 30 }).notNull(),
    componentType: mysqlEnum("component_type", ["earning", "deduction"]).notNull(),
    isTaxable: int("is_taxable").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [uniqueIndex("salary_components_org_code_uidx").on(t.organizationId, t.code)],
);

export const salaryTemplates = mysqlTable(
  "salary_templates",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 150 }).notNull(),
    description: varchar("description", { length: 500 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [uniqueIndex("salary_templates_org_name_uidx").on(t.organizationId, t.name)],
);

export const employeeSalaryTemplateAssignments = mysqlTable(
  "employee_salary_template_assignments",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: int("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    salaryTemplateId: int("salary_template_id")
      .notNull()
      .references(() => salaryTemplates.id, { onDelete: "cascade" }),
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [uniqueIndex("employee_salary_template_unique").on(t.organizationId, t.employeeId, t.salaryTemplateId, t.effectiveFrom)],
);

export const payrollCycles = mysqlTable(
  "payroll_cycles",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    status: mysqlEnum("status", ["draft", "processing", "completed"]).notNull().default("draft"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [uniqueIndex("payroll_cycles_org_name_uidx").on(t.organizationId, t.name)],
);

export const payrollRuns = mysqlTable("payroll_runs", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  payrollCycleId: int("payroll_cycle_id")
    .notNull()
    .references(() => payrollCycles.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", ["started", "completed", "failed"]).notNull().default("started"),
  totalEmployees: int("total_employees").notNull().default(0),
  totalGross: decimal("total_gross", { precision: 12, scale: 2 }).notNull().default("0"),
  totalNet: decimal("total_net", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payrollAdjustments = mysqlTable("payroll_adjustments", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  employeeId: int("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  payrollCycleId: int("payroll_cycle_id")
    .notNull()
    .references(() => payrollCycles.id, { onDelete: "cascade" }),
  adjustmentType: mysqlEnum("adjustment_type", ["bonus", "deduction"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: varchar("reason", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payslips = mysqlTable(
  "payslips",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: int("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    payrollCycleId: int("payroll_cycle_id")
      .notNull()
      .references(() => payrollCycles.id, { onDelete: "cascade" }),
    grossAmount: decimal("gross_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    deductionAmount: decimal("deduction_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    netAmount: decimal("net_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    status: mysqlEnum("status", ["draft", "final"]).notNull().default("draft"),
    generatedAt: timestamp("generated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("payslips_org_employee_cycle_uidx").on(t.organizationId, t.employeeId, t.payrollCycleId)],
);
