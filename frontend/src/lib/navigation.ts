import type { NavItem } from "@/types/rbac";

export const dashboardNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", roles: ["OWNER", "ADMIN", "HR", "MANAGER", "EMPLOYEE", "OTHERS"] },
  {
    label: "Setup",
    href: "/dashboard/setup",
    roles: ["OWNER", "ADMIN", "HR"],
    permissions: ["MANAGE_SHIFTS", "MANAGE_LEAVE_TYPES", "INVITE_EMPLOYEE"],
  },
  { label: "Shift setup", href: "/dashboard/setup/shifts", roles: ["OWNER", "ADMIN", "HR"], permissions: ["MANAGE_SHIFTS"] },
  { label: "Employees", href: "/dashboard/employees", roles: ["OWNER", "ADMIN", "HR", "MANAGER"], permissions: ["VIEW_EMPLOYEE"] },
  {
    label: "Attendance",
    href: "/dashboard/attendance",
    roles: ["OWNER", "ADMIN", "HR", "MANAGER", "EMPLOYEE", "OTHERS"],
    permissions: ["VIEW_ATTENDANCE"],
  },
  {
    label: "Leaves",
    href: "/dashboard/leaves",
    roles: ["OWNER", "ADMIN", "HR", "MANAGER", "EMPLOYEE", "OTHERS"],
    permissions: ["REQUEST_LEAVE", "APPROVE_LEAVE"],
  },
  { label: "Payroll", href: "/dashboard/payroll", roles: ["OWNER", "ADMIN"], permissions: ["RUN_PAYROLL"] },
  {
    label: "Settings",
    href: "/dashboard/settings",
    roles: ["OWNER", "ADMIN"],
    permissions: ["MANAGE_BRANCHES", "MANAGE_DEPARTMENTS", "MANAGE_DESIGNATIONS", "MANAGE_INTEGRATIONS"],
  },
];
