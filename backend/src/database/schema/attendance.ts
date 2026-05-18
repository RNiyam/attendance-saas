import { date, datetime, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { employees } from "./employees";
import { organizations } from "./organizations";
import { employeeShiftAssignments, shiftBreaks } from "./shift-engine";

export const attendanceRecords = mysqlTable("attendance_records", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  employeeId: int("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  shiftAssignmentId: int("shift_assign_id").references(() => employeeShiftAssignments.id, { onDelete: "set null" }),
  attendanceDate: date("attendance_date").notNull(),
  checkInTime: datetime("check_in_time"),
  checkOutTime: datetime("check_out_time"),
  workDurationMinutes: int("work_duration_minutes"),
  payableDurationMinutes: int("payable_duration_minutes"),
  unpaidBreakMinutes: int("unpaid_break_minutes").notNull().default(0),
  overtimeMinutes: int("overtime_minutes").notNull().default(0),
  lateMinutes: int("late_minutes").notNull().default(0),
  earlyExitMinutes: int("early_exit_minutes").notNull().default(0),
  attendanceStatus: mysqlEnum("attendance_status", ["present", "absent", "late", "half_day", "on_leave"])
    .notNull()
    .default("present"),
  attendanceSource: mysqlEnum("attendance_source", ["mobile", "biometric", "face", "qr", "manual"])
    .notNull()
    .default("mobile"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const attendanceEvents = mysqlTable("attendance_events", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  employeeId: int("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  recordId: int("record_id").references(() => attendanceRecords.id, { onDelete: "set null" }),
  eventType: mysqlEnum("event_type", ["check_in", "check_out", "break_start", "break_end"]).notNull(),
  eventTime: datetime("event_time").notNull(),
  source: varchar("source", { length: 30 }).notNull().default("mobile"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attendanceBreaks = mysqlTable("attendance_breaks", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  recordId: int("record_id")
    .notNull()
    .references(() => attendanceRecords.id, { onDelete: "cascade" }),
  shiftBreakId: int("shift_break_id").references(() => shiftBreaks.id, { onDelete: "set null" }),
  category: varchar("category", { length: 40 }),
  payType: varchar("pay_type", { length: 20 }),
  ruleType: varchar("rule_type", { length: 20 }),
  breakStart: datetime("break_start").notNull(),
  breakEnd: datetime("break_end"),
  durationMinutes: int("duration_minutes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attendanceAdjustments = mysqlTable("attendance_adjustments", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  recordId: int("record_id")
    .notNull()
    .references(() => attendanceRecords.id, { onDelete: "cascade" }),
  adjustedByUserId: int("adjusted_by_user_id").notNull(),
  reason: varchar("reason", { length: 300 }).notNull(),
  previousCheckIn: datetime("previous_check_in"),
  previousCheckOut: datetime("previous_check_out"),
  newCheckIn: datetime("new_check_in"),
  newCheckOut: datetime("new_check_out"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
