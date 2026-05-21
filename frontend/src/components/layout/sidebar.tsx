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
import { LogoutControl } from "@/components/layout/logout-control";
import type { UserRole } from "@/types/rbac";

type SidebarProps = {
  role: UserRole | null;
  permissions?: string[];
  variant?: "default" | "hover";
};

const iconByHref = {
  "/dashboard": LayoutDashboard,
  "/dashboard/setup": ClipboardList,
  "/dashboard/setup/kyb": ClipboardList,
  "/dashboard/setup/business-functions": ClipboardList,
  "/dashboard/setup/taxes-compliance": ClipboardList,
  "/dashboard/setup/attendance": CalendarCheck,
  "/dashboard/setup/shifts": CalendarCheck,
  "/dashboard/employees": Users,
  "/dashboard/leaves": ClipboardList,
  "/dashboard/payroll": CircleDollarSign,
  "/dashboard/settings/permissions": Users,
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
  return (
    <aside className="group fixed inset-y-0 left-0 z-30 hidden w-16 flex-col border-r border-[#E8E5F0] bg-white/95 shadow-sm backdrop-blur transition-[width] duration-200 hover:w-60 md:flex">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-[#E8E5F0] px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] text-white shadow-md shadow-blue-200">
          <Building2 className="h-5 w-5" />
        </div>
        <span className="whitespace-nowrap text-[15px] font-black text-[#0F0F1A] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          WorkforceOS
        </span>
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-5">
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
      <div className="shrink-0 border-t border-[#E8E5F0] p-3">
        <LogoutControl variant="sidebar-hover" />
      </div>
    </aside>
  );

}
