export type UserRole = "OWNER" | "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE" | "OTHERS";

export type NavItem = {
  label: string;
  href: string;
  roles: UserRole[];
  permissions?: string[];
};
