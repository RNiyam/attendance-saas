import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";

export default function SuperAdminConsoleLayout({ children }: { children: React.ReactNode }) {
  return <SuperAdminShell>{children}</SuperAdminShell>;
}
