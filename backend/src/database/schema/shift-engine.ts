import { integer, pgTable, text, time, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import {
  assignmentTypeEnum,
  breakCategoryEnum,
  breakRuleTypeEnum,
  payTypeEnum,
  shiftTypeEnum,
} from "./pg-enums";
import { createdAtCol, dateCol, tableId, updatedAtCol } from "../pg-columns";
import { branches } from "./org-structure";
import { employees } from "./employees";
import { organizations } from "./organizations";
import { users } from "./users";

/** Global catalog for shift type dropdowns (seeded via migration). */
export const shiftTypeMasters = pgTable("shift_type_masters", {
  id: tableId(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  label: varchar("label", { length: 120 }).notNull(),
  description: varchar("description", { length: 255 }),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const shifts = pgTable(
  "shifts",
  {
    id: tableId(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    branchId: integer("branch_id").references(() => branches.id, { onDelete: "set null" }),
    name: varchar("name", { length: 120 }).notNull(),
    shiftCode: varchar("shift_code", { length: 40 }),
    shiftType: shiftTypeEnum("shift_type").notNull().default("fixed"),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    earliestPunchIn: time("earliest_punch_in"),
    latestPunchOut: time("latest_punch_out"),
    gracePeriodMinutes: integer("grace_period_minutes").notNull().default(0),
    overtimeEnabled: integer("overtime_enabled").notNull().default(0),
    lateMarkEnabled: integer("late_mark_enabled").notNull().default(1),
    breakPolicy: text("break_policy"),
    weeklyOffPolicy: varchar("weekly_off_policy", { length: 120 }),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (t) => [uniqueIndex("shifts_org_name_uidx").on(t.organizationId, t.name)],
);

export const shiftBreaks = pgTable("shift_breaks", {
  id: tableId(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  shiftId: integer("shift_id")
    .notNull()
    .references(() => shifts.id, { onDelete: "cascade" }),
  category: breakCategoryEnum("category").notNull().default("shift_break"),
  breakName: varchar("break_name", { length: 120 }).notNull(),
  payType: payTypeEnum("pay_type").notNull().default("unpaid"),
  ruleType: breakRuleTypeEnum("rule_type").notNull().default("interval"),
  durationMinutes: integer("duration_minutes"),
  startTime: time("start_time"),
  endTime: time("end_time"),
  bufferStartTime: time("buffer_start_time"),
  bufferEndTime: time("buffer_end_time"),
  createdAt: createdAtCol(),
  updatedAt: updatedAtCol(),
});

export const employeeShiftAssignments = pgTable("shift_assignments", {
  id: tableId(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  shiftId: integer("shift_id")
    .notNull()
    .references(() => shifts.id, { onDelete: "cascade" }),
  effectiveFrom: dateCol("effective_from").notNull(),
  effectiveTo: dateCol("effective_to"),
  isTemporary: integer("is_temporary").notNull().default(0),
  createdAt: createdAtCol(),
  updatedAt: updatedAtCol(),
});

export const employeeAttendancePolicyAssignments = pgTable(
  "employee_attendance_policy_assignments",
  {
    id: tableId(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    attendancePolicyId: integer("attendance_policy_id")
      .notNull()
      .references(() => attendancePolicies.id, { onDelete: "cascade" }),
    effectiveFrom: dateCol("effective_from").notNull(),
    effectiveTo: dateCol("effective_to"),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (t) => [
    uniqueIndex("employee_attendance_policy_unique").on(
      t.organizationId,
      t.employeeId,
      t.attendancePolicyId,
      t.effectiveFrom,
    ),
  ],
);

export const holidays = pgTable("holidays", {
  id: tableId(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  branchId: integer("branch_id").references(() => branches.id, { onDelete: "set null" }),
  name: varchar("name", { length: 150 }).notNull(),
  holidayDate: dateCol("holiday_date").notNull(),
  createdAt: createdAtCol(),
  updatedAt: updatedAtCol(),
});

export const holidayTemplates = pgTable("holiday_templates", {
  id: tableId(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 150 }).notNull(),
  startDate: dateCol("start_date").notNull(),
  endDate: dateCol("end_date").notNull(),
  createdAt: createdAtCol(),
  updatedAt: updatedAtCol(),
});

export const holidayTemplateHolidays = pgTable("holiday_template_holidays", {
  id: tableId(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  templateId: integer("template_id")
    .notNull()
    .references(() => holidayTemplates.id, { onDelete: "cascade" }),
  holidayName: varchar("holiday_name", { length: 150 }).notNull(),
  holidayDate: dateCol("holiday_date").notNull(),
  createdAt: createdAtCol(),
  updatedAt: updatedAtCol(),
});

export const holidayTemplateAssignments = pgTable("holiday_template_assignments", {
  id: tableId(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  templateId: integer("template_id")
    .notNull()
    .references(() => holidayTemplates.id, { onDelete: "cascade" }),
  assignmentType: assignmentTypeEnum("assignment_type").notNull().default("organization"),
  assignmentId: integer("assignment_id"),
  createdAt: createdAtCol(),
});

export const attendancePolicies = pgTable(
  "attendance_policies",
  {
    id: tableId(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    lateAfterMinutes: integer("late_after_minutes").notNull().default(0),
    halfDayAfterMinutes: integer("half_day_after_minutes").notNull().default(240),
    overtimeAfterMinutes: integer("overtime_after_minutes").notNull().default(0),
    weeklyOffDays: varchar("weekly_off_days", { length: 64 }).notNull().default("sunday"),
    templateSettings: text("template_settings"),
    createdByUserId: integer("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
    updatedByUserId: integer("updated_by_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (t) => [uniqueIndex("attendance_policies_org_name_uidx").on(t.organizationId, t.name)],
);
