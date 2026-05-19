import { integer, numeric, pgTable, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import {
  accrualPeriodEnum,
  approverTypeEnum,
  assignmentTypeEnum,
  leaveDecisionEnum,
  leaveRequestStatusEnum,
  policyCycleEnum,
} from "./pg-enums";
import { createdAtCol, dateCol, tableId, updatedAtCol } from "../pg-columns";
import { employees } from "./employees";
import { organizations } from "./organizations";
import { users } from "./users";

export const leavePolicyTemplates = pgTable("leave_policy_templates", {
  id: tableId(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 150 }).notNull(),
  startDate: dateCol("start_date").notNull(),
  endDate: dateCol("end_date").notNull(),
  policyCycle: policyCycleEnum("policy_cycle").notNull().default("yearly"),
  unpaidLeaveEnabled: integer("unpaid_leave_enabled").notNull().default(1),
  countSandwichLeaves: integer("count_sandwich_leaves").notNull().default(0),
  approvalLevelsJson: varchar("approval_levels_json", { length: 4000 }),
  createdAt: createdAtCol(),
  updatedAt: updatedAtCol(),
});

export const leavePolicyTemplateItems = pgTable("leave_policy_template_items", {
  id: tableId(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  templateId: integer("template_id")
    .notNull()
    .references(() => leavePolicyTemplates.id, { onDelete: "cascade" }),
  leaveName: varchar("leave_name", { length: 100 }).notNull(),
  leaveCode: varchar("leave_code", { length: 30 }).notNull(),
  annualQuota: numeric("annual_quota", { precision: 8, scale: 2 }).notNull().default("0"),
  isPaid: integer("is_paid").notNull().default(1),
  accrualPeriod: accrualPeriodEnum("accrual_period").notNull().default("all_at_once"),
  isSystem: integer("is_system").notNull().default(0),
  customFieldsCount: integer("custom_fields_count").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAtCol(),
  updatedAt: updatedAtCol(),
});

export const leavePolicyApprovalLevels = pgTable("leave_policy_approval_levels", {
  id: tableId(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  templateId: integer("template_id")
    .notNull()
    .references(() => leavePolicyTemplates.id, { onDelete: "cascade" }),
  levelOrder: integer("level_order").notNull().default(1),
  minApproversRequired: integer("min_approvers_required").notNull().default(0),
  createdAt: createdAtCol(),
  updatedAt: updatedAtCol(),
});

export const leavePolicyApprovalApprovers = pgTable("leave_policy_approval_approvers", {
  id: tableId(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  levelId: integer("level_id")
    .notNull()
    .references(() => leavePolicyApprovalLevels.id, { onDelete: "cascade" }),
  approverType: approverTypeEnum("approver_type").notNull(),
  approverName: varchar("approver_name", { length: 150 }).notNull().default("Any Admin"),
  substituteEnabled: integer("substitute_enabled").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAtCol(),
});

export const leavePolicyTemplateAssignments = pgTable("leave_policy_template_assignments", {
  id: tableId(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  templateId: integer("template_id")
    .notNull()
    .references(() => leavePolicyTemplates.id, { onDelete: "cascade" }),
  assignmentType: assignmentTypeEnum("assignment_type").notNull().default("organization"),
  assignmentId: integer("assignment_id"),
  createdAt: createdAtCol(),
});

export const leaveTypes = pgTable(
  "leave_types",
  {
    id: tableId(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 30 }).notNull(),
    isPaid: integer("is_paid").notNull().default(1),
    annualQuota: numeric("annual_quota", { precision: 8, scale: 2 }).notNull().default("0"),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (t) => [uniqueIndex("leave_types_org_code_uidx").on(t.organizationId, t.code)],
);

export const leaveBalances = pgTable(
  "leave_balances",
  {
    id: tableId(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    leaveTypeId: integer("leave_type_id")
      .notNull()
      .references(() => leaveTypes.id, { onDelete: "cascade" }),
    allocated: numeric("allocated", { precision: 8, scale: 2 }).notNull().default("0"),
    used: numeric("used", { precision: 8, scale: 2 }).notNull().default("0"),
    remaining: numeric("remaining", { precision: 8, scale: 2 }).notNull().default("0"),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (t) => [uniqueIndex("leave_balances_unique").on(t.organizationId, t.employeeId, t.leaveTypeId)],
);

export const leaveRequests = pgTable("leave_requests", {
  id: tableId(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  leaveTypeId: integer("leave_type_id")
    .notNull()
    .references(() => leaveTypes.id, { onDelete: "restrict" }),
  approverUserId: integer("approver_user_id").references(() => users.id, { onDelete: "set null" }),
  startDate: dateCol("start_date").notNull(),
  endDate: dateCol("end_date").notNull(),
  days: numeric("days", { precision: 8, scale: 2 }).notNull(),
  reason: varchar("reason", { length: 300 }),
  status: leaveRequestStatusEnum("status").notNull().default("pending"),
  createdAt: createdAtCol(),
  updatedAt: updatedAtCol(),
});

export const leaveApprovals = pgTable("leave_approvals", {
  id: tableId(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  leaveRequestId: integer("leave_request_id")
    .notNull()
    .references(() => leaveRequests.id, { onDelete: "cascade" }),
  approverUserId: integer("approver_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  decision: leaveDecisionEnum("decision").notNull(),
  comment: varchar("comment", { length: 300 }),
  createdAt: createdAtCol(),
});
