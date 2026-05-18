"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarCheck,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { dashboardNavItems } from "@/lib/navigation";
import type { UserRole } from "@/types/rbac";

type SidebarProps = {
  role: UserRole | null;
  permissions?: string[];
  variant?: "default" | "hover";
};

const iconByHref = {
  "/dashboard": LayoutDashboard,
  "/dashboard/setup": ClipboardList,
  "/dashboard/setup/shifts": CalendarCheck,
  "/dashboard/employees": Users,
  "/dashboard/attendance": CalendarCheck,
  "/dashboard/leaves": ClipboardList,
  "/dashboard/payroll": CircleDollarSign,
  "/dashboard/settings": Settings,
} as const;

function canSeeItem(item: (typeof dashboardNavItems)[number], role: UserRole | null, permissionSet: Set<string>) {
  if (item.href === "/dashboard") return true;
  if (!role || !item.roles.includes(role)) return false;
  if (!item.permissions?.length) return true;
  return item.permissions.some((permission) => permissionSet.has(permission));
}

export function Sidebar({ role, permissions = [], variant = "default" }: SidebarProps) {
  const pathname = usePathname();
  const permissionSet = new Set(permissions);
  const items = dashboardNavItems.filter((item) => canSeeItem(item, role, permissionSet));

  if (variant === "hover") {
    return (
      <aside className="group fixed inset-y-0 left-0 z-30 hidden w-16 border-r border-[#E8E5F0] bg-white/95 shadow-sm backdrop-blur transition-[width] duration-200 hover:w-60 md:block">
        <div className="flex h-16 items-center gap-3 border-b border-[#E8E5F0] px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] text-white shadow-md shadow-blue-200">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="whitespace-nowrap text-[15px] font-black text-[#0F0F1A] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            WorkforceOS
          </span>
        </div>
        <nav className="space-y-2 px-3 py-5">
          {items.map((item) => {
            const Icon = iconByHref[item.href as keyof typeof iconByHref] ?? LayoutDashboard;
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "flex h-10 items-center gap-3 overflow-hidden rounded-lg px-2.5 text-sm font-semibold transition",
                  active
                    ? "bg-[#EFF6FF] text-[#4F7FFF]"
                    : "text-[#6B7280] hover:bg-[#F7F8FC] hover:text-[#0F0F1A]",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
    );
  }

  return (
    <aside className="w-full border-r border-border bg-white md:w-64">
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <Building2 className="h-5 w-5" />
        <span className="font-semibold">WorkforceOS</span>
      </div>
      <nav className="space-y-1 p-3">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = iconByHref[item.href as keyof typeof iconByHref] ?? LayoutDashboard;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
                active ? "bg-slate-100 font-medium" : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
