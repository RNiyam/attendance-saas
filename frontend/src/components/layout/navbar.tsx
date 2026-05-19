import { Bell, Search } from "lucide-react";
import { LogoutControl } from "@/components/layout/logout-control";
import { Badge } from "@/components/ui/badge";

type NavbarProps = {
  userName: string;
  role: string | null;
};

export function Navbar({ userName, role }: NavbarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-white px-4 md:px-6">
      <div className="flex items-center gap-2 rounded-md border border-border bg-slate-50 px-3 py-2 text-sm text-slate-500">
        <Search className="h-4 w-4" />
        Search employees, attendance, payroll
      </div>
      <div className="flex items-center gap-3">
        <button className="rounded-md border border-border p-2 hover:bg-slate-50" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </button>
        {role ? <Badge>{role}</Badge> : null}
        <span className="hidden text-sm font-medium sm:inline">{userName}</span>
        <LogoutControl variant="compact" />
      </div>
    </header>
  );
}
