import { integer, numeric, pgTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import {
  adjustmentTypeEnum,
  componentTypeEnum,
  payrollCycleStatusEnum,
  payrollRunStatusEnum,
  payslipStatusEnum,
} from "./pg-enums";
import { createdAtCol, dateCol, tableId, updatedAtCol } from "../pg-columns";
import { employees } from "./employees";
import { organizations } from "./organizations";

export const salaryComponents = pgTable(
  "salary_components",
  {
    id: tableId(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 30 }).notNull(),
    componentType: componentTypeEnum("component_type").notNull(),
    isTaxable: integer("is_taxable").notNull().default(0),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (t) => [uniqueIndex("salary_components_org_code_uidx").on(t.organizationId, t.code)],
);

export const salaryTemplates = pgTable(
  "salary_templates",
  {
    id: tableId(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 150 }).notNull(),
    description: varchar("description", { length: 500 }),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (t) => [uniqueIndex("salary_templates_org_name_uidx").on(t.organizationId, t.name)],
);

export const employeeSalaryTemplateAssignments = pgTable(
  "employee_salary_template_assignments",
  {
    id: tableId(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    salaryTemplateId: integer("salary_template_id")
      .notNull()
      .references(() => salaryTemplates.id, { onDelete: "cascade" }),
    effectiveFrom: dateCol("effective_from").notNull(),
    effectiveTo: dateCol("effective_to"),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (t) => [
    uniqueIndex("employee_salary_template_unique").on(
      t.organizationId,
      t.employeeId,
      t.salaryTemplateId,
      t.effectiveFrom,
    ),
  ],
);

export const payrollCycles = pgTable(
  "payroll_cycles",
  {
    id: tableId(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    startDate: dateCol("start_date").notNull(),
    endDate: dateCol("end_date").notNull(),
    status: payrollCycleStatusEnum("status").notNull().default("draft"),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (t) => [uniqueIndex("payroll_cycles_org_name_uidx").on(t.organizationId, t.name)],
);

export const payrollRuns = pgTable("payroll_runs", {
  id: tableId(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  payrollCycleId: integer("payroll_cycle_id")
    .notNull()
    .references(() => payrollCycles.id, { onDelete: "cascade" }),
  status: payrollRunStatusEnum("status").notNull().default("started"),
  totalEmployees: integer("total_employees").notNull().default(0),
  totalGross: numeric("total_gross", { precision: 12, scale: 2 }).notNull().default("0"),
  totalNet: numeric("total_net", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: createdAtCol(),
});

export const payrollAdjustments = pgTable("payroll_adjustments", {
  id: tableId(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  payrollCycleId: integer("payroll_cycle_id")
    .notNull()
    .references(() => payrollCycles.id, { onDelete: "cascade" }),
  adjustmentType: adjustmentTypeEnum("adjustment_type").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  reason: varchar("reason", { length: 255 }),
  createdAt: createdAtCol(),
});

export const payslips = pgTable(
  "payslips",
  {
    id: tableId(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    payrollCycleId: integer("payroll_cycle_id")
      .notNull()
      .references(() => payrollCycles.id, { onDelete: "cascade" }),
    grossAmount: numeric("gross_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    deductionAmount: numeric("deduction_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    netAmount: numeric("net_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    status: payslipStatusEnum("status").notNull().default("draft"),
    generatedAt: timestamp("generated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("payslips_org_employee_cycle_uidx").on(t.organizationId, t.employeeId, t.payrollCycleId)],
);
