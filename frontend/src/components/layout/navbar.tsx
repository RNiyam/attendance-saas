import { Bell, Search } from "lucide-react";
import { LogoutControl } from "@/components/layout/logout-control";
import { Badge } from "@/components/ui/badge";

type NavbarProps = {
  userName: string;
  role: string | null;
  avatar?: string | null;
};

export function Navbar({ userName, role, avatar }: NavbarProps) {
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

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
        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-sm font-medium">{userName}</span>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt={userName}
              className="h-8 w-8 shrink-0 rounded-full object-cover shadow-sm ring-2 ring-[#4F7FFF]/20"
            />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] text-[11px] font-bold text-white shadow-md shadow-blue-200">
              {initials}
            </span>
          )}
        </div>
        <LogoutControl variant="compact" />
      </div>
    </header>
  );
}
