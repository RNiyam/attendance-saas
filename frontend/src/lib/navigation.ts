import type { NavItem } from "@/types/rbac";

export const dashboardNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", roles: ["OWNER", "ADMIN", "HR", "MANAGER", "EMPLOYEE", "OTHERS"] },
  { label: "KYB", href: "/dashboard/setup/kyb", roles: ["OWNER"] },
  { label: "Business Functions", href: "/dashboard/setup/business-functions", roles: ["OWNER", "ADMIN"] },
  { label: "Taxes & Compliance", href: "/dashboard/setup/taxes-compliance", roles: ["OWNER"] },
  { label: "Attendance Settings", href: "/dashboard/setup/attendance", roles: ["OWNER", "ADMIN", "HR"] },
  { label: "Salary Settings", href: "/dashboard/payroll", roles: ["OWNER", "ADMIN"] },
  { label: "Add & Invite Staff", href: "/dashboard/employees", roles: ["OWNER", "ADMIN", "HR"] },
  { label: "Manage Permissions", href: "/dashboard/settings/permissions", roles: ["OWNER"] },
  {
    label: "Settings",
    href: "/dashboard/settings",
    roles: ["OWNER", "ADMIN"],
    permissions: ["MANAGE_BRANCHES", "MANAGE_DEPARTMENTS", "MANAGE_DESIGNATIONS", "MANAGE_INTEGRATIONS"],
  },
];
