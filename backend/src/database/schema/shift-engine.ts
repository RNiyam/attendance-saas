import { date, int, mysqlEnum, mysqlTable, text, time, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { branches } from "./org-structure";
import { employees } from "./employees";
import { organizations } from "./organizations";
import { users } from "./users";

/** Global catalog for shift type dropdowns (seeded via migration). */
export const shiftTypeMasters = mysqlTable("shift_type_masters", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  label: varchar("label", { length: 120 }).notNull(),
  description: varchar("description", { length: 255 }),
  sortOrder: int("sort_order").notNull().default(0),
});

export const shifts = mysqlTable(
  "shifts",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    branchId: int("branch_id").references(() => branches.id, { onDelete: "set null" }),
    name: varchar("name", { length: 120 }).notNull(),
    shiftCode: varchar("shift_code", { length: 40 }),
    shiftType: mysqlEnum("shift_type", ["fixed", "flexible", "open", "rotational"]).notNull().default("fixed"),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    earliestPunchIn: time("earliest_punch_in"),
    latestPunchOut: time("latest_punch_out"),
    gracePeriodMinutes: int("grace_period_minutes").notNull().default(0),
    overtimeEnabled: int("overtime_enabled").notNull().default(0),
    lateMarkEnabled: int("late_mark_enabled").notNull().default(1),
    breakPolicy: text("break_policy"),
    weeklyOffPolicy: varchar("weekly_off_policy", { length: 120 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [uniqueIndex("shifts_org_name_uidx").on(t.organizationId, t.name)],
);

export const shiftBreaks = mysqlTable("shift_breaks", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  shiftId: int("shift_id")
    .notNull()
    .references(() => shifts.id, { onDelete: "cascade" }),
  category: mysqlEnum("category", ["shift_break", "casual_break"]).notNull().default("shift_break"),
  breakName: varchar("break_name", { length: 120 }).notNull(),
  payType: mysqlEnum("pay_type", ["paid", "unpaid"]).notNull().default("unpaid"),
  ruleType: mysqlEnum("rule_type", ["interval", "duration"]).notNull().default("interval"),
  durationMinutes: int("duration_minutes"),
  startTime: time("start_time"),
  endTime: time("end_time"),
  bufferStartTime: time("buffer_start_time"),
  bufferEndTime: time("buffer_end_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const employeeShiftAssignments = mysqlTable("shift_assignments", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  employeeId: int("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  shiftId: int("shift_id")
    .notNull()
    .references(() => shifts.id, { onDelete: "cascade" }),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  isTemporary: int("is_temporary").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const employeeAttendancePolicyAssignments = mysqlTable(
  "employee_attendance_policy_assignments",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: int("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    attendancePolicyId: int("attendance_policy_id")
      .notNull()
      .references(() => attendancePolicies.id, { onDelete: "cascade" }),
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [uniqueIndex("employee_attendance_policy_unique").on(t.organizationId, t.employeeId, t.attendancePolicyId, t.effectiveFrom)],
);

export const holidays = mysqlTable("holidays", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  branchId: int("branch_id").references(() => branches.id, { onDelete: "set null" }),
  name: varchar("name", { length: 150 }).notNull(),
  holidayDate: date("holiday_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const holidayTemplates = mysqlTable("holiday_templates", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 150 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const holidayTemplateHolidays = mysqlTable("holiday_template_holidays", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  templateId: int("template_id")
    .notNull()
    .references(() => holidayTemplates.id, { onDelete: "cascade" }),
  holidayName: varchar("holiday_name", { length: 150 }).notNull(),
  holidayDate: date("holiday_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const holidayTemplateAssignments = mysqlTable("holiday_template_assignments", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  templateId: int("template_id")
    .notNull()
    .references(() => holidayTemplates.id, { onDelete: "cascade" }),
  assignmentType: mysqlEnum("assignment_type", ["organization", "branch", "department", "employee", "shift"])
    .notNull()
    .default("organization"),
  assignmentId: int("assignment_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attendancePolicies = mysqlTable(
  "attendance_policies",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    lateAfterMinutes: int("late_after_minutes").notNull().default(0),
    halfDayAfterMinutes: int("half_day_after_minutes").notNull().default(240),
    overtimeAfterMinutes: int("overtime_after_minutes").notNull().default(0),
    weeklyOffDays: varchar("weekly_off_days", { length: 64 }).notNull().default("sunday"),
    templateSettings: text("template_settings"),
    createdByUserId: int("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
    updatedByUserId: int("updated_by_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [uniqueIndex("attendance_policies_org_name_uidx").on(t.organizationId, t.name)],
);
