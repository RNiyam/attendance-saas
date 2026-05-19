import { pgEnum } from "drizzle-orm/pg-core";

export const orgStatusEnum = pgEnum("org_status", ["active", "suspended"]);
export const userStatusEnum = pgEnum("user_status", ["active", "invited", "disabled"]);
export const employeeStatusEnum = pgEnum("employee_status", ["active", "invited", "inactive"]);
export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const employmentTypeEnum = pgEnum("employment_type", [
  "FULL_TIME",
  "PART_TIME",
  "INTERN",
  "PROBATION",
]);
export const billingCycleEnum = pgEnum("billing_cycle", ["weekly", "monthly", "project", "milestone"]);
export const workUnitEnum = pgEnum("work_unit", ["day", "hour", "piece"]);
export const addressTypeEnum = pgEnum("address_type", ["current", "permanent"]);
export const assignmentTypeEnum = pgEnum("assignment_type", [
  "organization",
  "branch",
  "department",
  "employee",
  "shift",
]);
export const shiftTypeEnum = pgEnum("shift_type", ["fixed", "flexible", "open", "rotational"]);
export const breakCategoryEnum = pgEnum("break_category", ["shift_break", "casual_break"]);
export const payTypeEnum = pgEnum("pay_type", ["paid", "unpaid"]);
export const breakRuleTypeEnum = pgEnum("break_rule_type", ["interval", "duration"]);
export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "late",
  "half_day",
  "on_leave",
]);
export const attendanceSourceEnum = pgEnum("attendance_source", [
  "mobile",
  "biometric",
  "face",
  "qr",
  "manual",
]);
export const attendanceEventTypeEnum = pgEnum("attendance_event_type", [
  "check_in",
  "check_out",
  "break_start",
  "break_end",
]);
export const policyCycleEnum = pgEnum("policy_cycle", ["yearly", "monthly", "quarterly"]);
export const accrualPeriodEnum = pgEnum("accrual_period", [
  "all_at_once",
  "monthly",
  "quarterly",
  "na",
]);
export const approverTypeEnum = pgEnum("approver_type", [
  "owner",
  "admin",
  "restricted_admin",
  "attendance_supervisors",
  "reporting_manager",
]);
export const leaveRequestStatusEnum = pgEnum("leave_request_status", [
  "pending",
  "approved",
  "rejected",
  "cancelled",
]);
export const leaveDecisionEnum = pgEnum("leave_decision", ["approved", "rejected"]);
export const componentTypeEnum = pgEnum("component_type", ["earning", "deduction"]);
export const payrollCycleStatusEnum = pgEnum("payroll_cycle_status", ["draft", "processing", "completed"]);
export const payrollRunStatusEnum = pgEnum("payroll_run_status", ["started", "completed", "failed"]);
export const adjustmentTypeEnum = pgEnum("adjustment_type", ["bonus", "deduction"]);
export const payslipStatusEnum = pgEnum("payslip_status", ["draft", "final"]);
export const integrationStatusEnum = pgEnum("integration_status", ["active", "inactive"]);
export const webhookStatusEnum = pgEnum("webhook_status", ["pending", "success", "failed"]);
export const platformAdminStatusEnum = pgEnum("platform_admin_status", ["active", "inactive"]);
export const inviteStatusEnum = pgEnum("invite_status", ["pending", "accepted", "expired", "revoked"]);
