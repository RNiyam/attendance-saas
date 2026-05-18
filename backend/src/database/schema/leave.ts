import { date, decimal, int, mysqlEnum, mysqlTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { employees } from "./employees";
import { organizations } from "./organizations";
import { users } from "./users";

export const leavePolicyTemplates = mysqlTable("leave_policy_templates", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 150 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  policyCycle: mysqlEnum("policy_cycle", ["yearly", "monthly", "quarterly"]).notNull().default("yearly"),
  unpaidLeaveEnabled: int("unpaid_leave_enabled").notNull().default(1),
  countSandwichLeaves: int("count_sandwich_leaves").notNull().default(0),
  approvalLevelsJson: varchar("approval_levels_json", { length: 4000 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const leavePolicyTemplateItems = mysqlTable("leave_policy_template_items", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  templateId: int("template_id")
    .notNull()
    .references(() => leavePolicyTemplates.id, { onDelete: "cascade" }),
  leaveName: varchar("leave_name", { length: 100 }).notNull(),
  leaveCode: varchar("leave_code", { length: 30 }).notNull(),
  annualQuota: decimal("annual_quota", { precision: 8, scale: 2 }).notNull().default("0"),
  isPaid: int("is_paid").notNull().default(1),
  accrualPeriod: mysqlEnum("accrual_period", ["all_at_once", "monthly", "quarterly", "na"])
    .notNull()
    .default("all_at_once"),
  isSystem: int("is_system").notNull().default(0),
  customFieldsCount: int("custom_fields_count").notNull().default(0),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const leavePolicyApprovalLevels = mysqlTable("leave_policy_approval_levels", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  templateId: int("template_id")
    .notNull()
    .references(() => leavePolicyTemplates.id, { onDelete: "cascade" }),
  levelOrder: int("level_order").notNull().default(1),
  minApproversRequired: int("min_approvers_required").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const leavePolicyApprovalApprovers = mysqlTable("leave_policy_approval_approvers", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  levelId: int("level_id")
    .notNull()
    .references(() => leavePolicyApprovalLevels.id, { onDelete: "cascade" }),
  approverType: mysqlEnum("approver_type", [
    "owner",
    "admin",
    "restricted_admin",
    "attendance_supervisors",
    "reporting_manager",
  ]).notNull(),
  approverName: varchar("approver_name", { length: 150 }).notNull().default("Any Admin"),
  substituteEnabled: int("substitute_enabled").notNull().default(0),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leavePolicyTemplateAssignments = mysqlTable("leave_policy_template_assignments", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  templateId: int("template_id")
    .notNull()
    .references(() => leavePolicyTemplates.id, { onDelete: "cascade" }),
  assignmentType: mysqlEnum("assignment_type", ["organization", "branch", "department", "employee", "shift"])
    .notNull()
    .default("organization"),
  assignmentId: int("assignment_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leaveTypes = mysqlTable(
  "leave_types",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 30 }).notNull(),
    isPaid: int("is_paid").notNull().default(1),
    annualQuota: decimal("annual_quota", { precision: 8, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [uniqueIndex("leave_types_org_code_uidx").on(t.organizationId, t.code)],
);

export const leaveBalances = mysqlTable(
  "leave_balances",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: int("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    leaveTypeId: int("leave_type_id")
      .notNull()
      .references(() => leaveTypes.id, { onDelete: "cascade" }),
    allocated: decimal("allocated", { precision: 8, scale: 2 }).notNull().default("0"),
    used: decimal("used", { precision: 8, scale: 2 }).notNull().default("0"),
    remaining: decimal("remaining", { precision: 8, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [uniqueIndex("leave_balances_unique").on(t.organizationId, t.employeeId, t.leaveTypeId)],
);

export const leaveRequests = mysqlTable("leave_requests", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  employeeId: int("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  leaveTypeId: int("leave_type_id")
    .notNull()
    .references(() => leaveTypes.id, { onDelete: "restrict" }),
  approverUserId: int("approver_user_id").references(() => users.id, { onDelete: "set null" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  days: decimal("days", { precision: 8, scale: 2 }).notNull(),
  reason: varchar("reason", { length: 300 }),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "cancelled"]).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const leaveApprovals = mysqlTable("leave_approvals", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  leaveRequestId: int("leave_request_id")
    .notNull()
    .references(() => leaveRequests.id, { onDelete: "cascade" }),
  approverUserId: int("approver_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  decision: mysqlEnum("decision", ["approved", "rejected"]).notNull(),
  comment: varchar("comment", { length: 300 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
