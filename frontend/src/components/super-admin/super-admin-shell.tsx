"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  ChevronRight,
  Layers,
  LayoutGrid,
  LogOut,
  Settings,
  Shield,
} from "lucide-react";
import { clearPlatformAdminToken, platformAdminFetch } from "@/services/super-admin-http";

type AdminMe = { id: number; email: string; displayName: string };

const nav = [
  { href: "/super-admin", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/super-admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/super-admin/masters", label: "Masters", icon: Layers },
  { href: "/super-admin/platform", label: "Platform", icon: Settings },
];

export function SuperAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminMe | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await platformAdminFetch("/api/super-admin/auth/me");
    if (!res.ok) {
      router.replace("/super-admin/login");
      return;
    }
    const data = (await res.json()) as { admin: AdminMe };
    setAdmin(data.admin);
  }, [router]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const logout = () => {
    clearPlatformAdminToken();
    router.replace("/super-admin/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F7F5F0] text-[13px] font-medium text-[#6B6B80]">
        Loading…
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh bg-[#F7F5F0] text-[#0F0F1A]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#D4E4FF] via-[#EDE9FE] to-transparent opacity-50" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-[#FFF0D4] to-transparent opacity-40" />
      </div>

      <aside className="relative z-20 flex w-64 shrink-0 flex-col border-r border-black/[0.06] bg-[#F7F5F0]/90 backdrop-blur-sm">
        <div className="flex h-16 items-center gap-2.5 border-b border-black/[0.06] px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] text-white shadow-md shadow-blue-200">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[14px] font-black tracking-[-0.02em]">WorkforceOS</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B80]">Super Admin</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${
                  active
                    ? "bg-white text-[#4F7FFF] shadow-sm shadow-black/[0.04]"
                    : "text-[#6B6B80] hover:bg-white/60 hover:text-[#0F0F1A]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
                {active ? <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-50" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-black/[0.06] p-4">
          <p className="truncate text-[12px] font-bold text-[#0F0F1A]">{admin?.displayName}</p>
          <p className="truncate text-[11px] text-[#6B6B80]">{admin?.email}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#E8E5F0] bg-white py-2 text-[12px] font-bold text-[#6B6B80] hover:border-[#4F7FFF] hover:text-[#4F7FFF]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="relative z-10 flex-1 overflow-auto p-6 sm:p-8 lg:p-10">{children}</main>
    </div>
  );
}
