import { integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import {
  attendanceEventTypeEnum,
  attendanceSourceEnum,
  attendanceStatusEnum,
} from "./pg-enums";
import { createdAtCol, dateCol, tableId, updatedAtCol } from "../pg-columns";
import { employees } from "./employees";
import { organizations } from "./organizations";
import { employeeShiftAssignments, shiftBreaks } from "./shift-engine";

export const attendanceRecords = pgTable("attendance_records", {
  id: tableId(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  shiftAssignmentId: integer("shift_assign_id").references(() => employeeShiftAssignments.id, {
    onDelete: "set null",
  }),
  attendanceDate: dateCol("attendance_date").notNull(),
  checkInTime: timestamp("check_in_time", { mode: "date" }),
  checkOutTime: timestamp("check_out_time", { mode: "date" }),
  workDurationMinutes: integer("work_duration_minutes"),
  payableDurationMinutes: integer("payable_duration_minutes"),
  unpaidBreakMinutes: integer("unpaid_break_minutes").notNull().default(0),
  overtimeMinutes: integer("overtime_minutes").notNull().default(0),
  lateMinutes: integer("late_minutes").notNull().default(0),
  earlyExitMinutes: integer("early_exit_minutes").notNull().default(0),
  attendanceStatus: attendanceStatusEnum("attendance_status").notNull().default("present"),
  attendanceSource: attendanceSourceEnum("attendance_source").notNull().default("mobile"),
  createdAt: createdAtCol(),
  updatedAt: updatedAtCol(),
});

export const attendanceEvents = pgTable("attendance_events", {
  id: tableId(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  recordId: integer("record_id").references(() => attendanceRecords.id, { onDelete: "set null" }),
  eventType: attendanceEventTypeEnum("event_type").notNull(),
  eventTime: timestamp("event_time", { mode: "date" }).notNull(),
  source: varchar("source", { length: 30 }).notNull().default("mobile"),
  metadata: text("metadata"),
  createdAt: createdAtCol(),
});

export const attendanceBreaks = pgTable("attendance_breaks", {
  id: tableId(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  recordId: integer("record_id")
    .notNull()
    .references(() => attendanceRecords.id, { onDelete: "cascade" }),
  shiftBreakId: integer("shift_break_id").references(() => shiftBreaks.id, { onDelete: "set null" }),
  category: varchar("category", { length: 40 }),
  payType: varchar("pay_type", { length: 20 }),
  ruleType: varchar("rule_type", { length: 20 }),
  breakStart: timestamp("break_start", { mode: "date" }).notNull(),
  breakEnd: timestamp("break_end", { mode: "date" }),
  durationMinutes: integer("duration_minutes"),
  createdAt: createdAtCol(),
});

export const attendanceAdjustments = pgTable("attendance_adjustments", {
  id: tableId(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  recordId: integer("record_id")
    .notNull()
    .references(() => attendanceRecords.id, { onDelete: "cascade" }),
  adjustedByUserId: integer("adjusted_by_user_id").notNull(),
  reason: varchar("reason", { length: 300 }).notNull(),
  previousCheckIn: timestamp("previous_check_in", { mode: "date" }),
  previousCheckOut: timestamp("previous_check_out", { mode: "date" }),
  newCheckIn: timestamp("new_check_in", { mode: "date" }),
  newCheckOut: timestamp("new_check_out", { mode: "date" }),
  createdAt: createdAtCol(),
});
