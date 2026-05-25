import { varchar } from "drizzle-orm/pg-core";

export const orgStatusEnum = (name: string) => varchar(name, { length: 60, enum: ["active", "suspended"] as ["active", "suspended"] });
export const userStatusEnum = (name: string) => varchar(name, { length: 60, enum: ["active", "invited", "disabled"] as ["active", "invited", "disabled"] });
export const employeeStatusEnum = (name: string) => varchar(name, { length: 60, enum: ["active", "invited", "inactive"] as ["active", "invited", "inactive"] });
export const genderEnum = (name: string) => varchar(name, { length: 60, enum: ["male", "female", "other"] as ["male", "female", "other"] });
export const employmentTypeEnum = (name: string) => varchar(name, { length: 60, enum: [
  "FULL_TIME",
  "PART_TIME",
  "INTERN",
  "PROBATION",
] as [ "FULL_TIME", "PART_TIME", "INTERN", "PROBATION", ] });
export const billingCycleEnum = (name: string) => varchar(name, { length: 60, enum: ["weekly", "monthly", "project", "milestone"] as ["weekly", "monthly", "project", "milestone"] });
export const workUnitEnum = (name: string) => varchar(name, { length: 60, enum: ["day", "hour", "piece"] as ["day", "hour", "piece"] });
export const addressTypeEnum = (name: string) => varchar(name, { length: 60, enum: ["current", "permanent"] as ["current", "permanent"] });
export const assignmentTypeEnum = (name: string) => varchar(name, { length: 60, enum: [
  "organization",
  "branch",
  "department",
  "employee",
  "shift",
] as [ "organization", "branch", "department", "employee", "shift", ] });
export const shiftTypeEnum = (name: string) => varchar(name, { length: 60, enum: ["fixed", "flexible", "open", "rotational"] as ["fixed", "flexible", "open", "rotational"] });
export const breakCategoryEnum = (name: string) => varchar(name, { length: 60, enum: ["shift_break", "casual_break"] as ["shift_break", "casual_break"] });
export const payTypeEnum = (name: string) => varchar(name, { length: 60, enum: ["paid", "unpaid"] as ["paid", "unpaid"] });
export const breakRuleTypeEnum = (name: string) => varchar(name, { length: 60, enum: ["interval", "duration"] as ["interval", "duration"] });
export const attendanceStatusEnum = (name: string) => varchar(name, { length: 60, enum: [
  "present",
  "absent",
  "late",
  "half_day",
  "on_leave",
] as [ "present", "absent", "late", "half_day", "on_leave", ] });
export const attendanceSourceEnum = (name: string) => varchar(name, { length: 60, enum: [
  "mobile",
  "biometric",
  "face",
  "qr",
  "manual",
] as [ "mobile", "biometric", "face", "qr", "manual", ] });
export const attendanceEventTypeEnum = (name: string) => varchar(name, { length: 60, enum: [
  "check_in",
  "check_out",
  "break_start",
  "break_end",
] as [ "check_in", "check_out", "break_start", "break_end", ] });
export const policyCycleEnum = (name: string) => varchar(name, { length: 60, enum: ["yearly", "monthly", "quarterly"] as ["yearly", "monthly", "quarterly"] });
export const accrualPeriodEnum = (name: string) => varchar(name, { length: 60, enum: [
  "all_at_once",
  "monthly",
  "quarterly",
  "na",
] as [ "all_at_once", "monthly", "quarterly", "na", ] });
export const approverTypeEnum = (name: string) => varchar(name, { length: 60, enum: [
  "owner",
  "admin",
  "restricted_admin",
  "attendance_supervisors",
  "reporting_manager",
] as [ "owner", "admin", "restricted_admin", "attendance_supervisors", "reporting_manager", ] });
export const leaveRequestStatusEnum = (name: string) => varchar(name, { length: 60, enum: [
  "pending",
  "approved",
  "rejected",
  "cancelled",
] as [ "pending", "approved", "rejected", "cancelled", ] });
export const leaveDecisionEnum = (name: string) => varchar(name, { length: 60, enum: ["approved", "rejected"] as ["approved", "rejected"] });
export const componentTypeEnum = (name: string) => varchar(name, { length: 60, enum: ["earning", "deduction"] as ["earning", "deduction"] });
export const payrollCycleStatusEnum = (name: string) => varchar(name, { length: 60, enum: ["draft", "processing", "completed"] as ["draft", "processing", "completed"] });
export const payrollRunStatusEnum = (name: string) => varchar(name, { length: 60, enum: ["started", "completed", "failed"] as ["started", "completed", "failed"] });
export const adjustmentTypeEnum = (name: string) => varchar(name, { length: 60, enum: ["bonus", "deduction"] as ["bonus", "deduction"] });
export const payslipStatusEnum = (name: string) => varchar(name, { length: 60, enum: ["draft", "final"] as ["draft", "final"] });
export const integrationStatusEnum = (name: string) => varchar(name, { length: 60, enum: ["active", "inactive"] as ["active", "inactive"] });
export const webhookStatusEnum = (name: string) => varchar(name, { length: 60, enum: ["pending", "success", "failed"] as ["pending", "success", "failed"] });
export const platformAdminStatusEnum = (name: string) => varchar(name, { length: 60, enum: ["active", "inactive"] as ["active", "inactive"] });
export const inviteStatusEnum = (name: string) => varchar(name, { length: 60, enum: ["pending", "accepted", "expired", "revoked"] as ["pending", "accepted", "expired", "revoked"] });
