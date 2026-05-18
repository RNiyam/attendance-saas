"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarCheck,
  CircleDollarSign,
  ClipboardList,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { apiBaseUrl, authenticatedFetch } from "@/services/http";

type MeResponse = {
  displayName: string;
  role: string | null;
  permissions: string[];
  organization: { name: string; legalName: string | null } | null;
};

const roleLabels: Record<string, string> = {
  OWNER: "Owner workspace",
  ADMIN: "Admin workspace",
  HR: "HR workspace",
  MANAGER: "Manager workspace",
  EMPLOYEE: "Employee workspace",
  OTHERS: "Employee workspace",
};

const modules = [
  {
    title: "Organization Setup",
    description: "Finish business defaults, attendance setup, shifts, holidays, leave policies, and staff onboarding.",
    href: "/dashboard/setup",
    icon: ClipboardList,
    permissions: ["MANAGE_SHIFTS", "MANAGE_LEAVE_TYPES", "INVITE_EMPLOYEE"],
    accent: "text-blue-700",
    bg: "bg-blue-50",
  },
  {
    title: "Employees",
    description: "Manage employee records, invite staff, and keep onboarding moving.",
    href: "/dashboard/employees",
    icon: Users,
    permissions: ["VIEW_EMPLOYEE"],
    accent: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  {
    title: "Attendance",
    description: "Track check-ins, attendance status, adjustments, and shift coverage.",
    href: "/dashboard/attendance",
    icon: CalendarCheck,
    permissions: ["VIEW_ATTENDANCE"],
    accent: "text-indigo-700",
    bg: "bg-indigo-50",
  },
  {
    title: "Leave",
    description: "Request leave, review approvals, and maintain leave policy rules.",
    href: "/dashboard/leaves",
    icon: ClipboardList,
    permissions: ["REQUEST_LEAVE", "APPROVE_LEAVE"],
    accent: "text-violet-700",
    bg: "bg-violet-50",
  },
  {
    title: "Payroll",
    description: "Run payroll cycles and review salary structures.",
    href: "/dashboard/payroll",
    icon: CircleDollarSign,
    permissions: ["RUN_PAYROLL"],
    accent: "text-amber-700",
    bg: "bg-amber-50",
  },
  {
    title: "Settings",
    description: "Manage organization structure, integrations, and administrative configuration.",
    href: "/dashboard/settings",
    icon: Settings,
    permissions: ["MANAGE_BRANCHES", "MANAGE_DEPARTMENTS", "MANAGE_DESIGNATIONS", "MANAGE_INTEGRATIONS"],
    accent: "text-slate-700",
    bg: "bg-slate-100",
  },
];

export default function DashboardPage() {
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    const id = window.setTimeout(async () => {
      const res = await authenticatedFetch(`${apiBaseUrl}/api/auth/me`);
      if (!res.ok) return;
      setMe((await res.json()) as MeResponse);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const permissionSet = useMemo(() => new Set(me?.permissions ?? []), [me?.permissions]);
  const visibleModules = modules.filter((module) =>
    module.permissions.some((permission) => permissionSet.has(permission)),
  );
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const role = me?.role?.toUpperCase() ?? "";
  const roleLabel = roleLabels[role] ?? "Workspace";
  const displayName = me?.displayName?.trim() || "there";
  const orgName = me?.organization?.legalName?.trim() || me?.organization?.name || "your organization";
  const canContinueSetup = ["MANAGE_SHIFTS", "MANAGE_LEAVE_TYPES", "INVITE_EMPLOYEE"].some((permission) =>
    permissionSet.has(permission),
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-8 text-[#0F172A] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-5 shadow-sm sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#DBEAFE] bg-[#EFF6FF] px-3 py-1 text-[12px] font-bold text-[#2563EB]">
                <ShieldCheck className="h-3.5 w-3.5" />
                {roleLabel}
              </div>
              <h1 className="mt-4 text-[24px] font-black tracking-[-0.02em] text-[#0F172A] sm:text-[30px]">
                Welcome, {displayName}
              </h1>
              <p className="mt-1 text-[14px] font-medium text-[#64748B]">
                {orgName} - {today}
              </p>
            </div>
            {canContinueSetup ? (
              <Link
                href="/dashboard/setup"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2563EB] px-4 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#1D4ED8]"
              >
                <UserPlus className="h-4 w-4" />
                Continue Setup
              </Link>
            ) : null}
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">Role</p>
            <p className="mt-2 text-[22px] font-black text-[#0F172A]">{role || "Pending"}</p>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">Permissions</p>
            <p className="mt-2 text-[22px] font-black text-[#0F172A]">{permissionSet.size}</p>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">Modules</p>
            <p className="mt-2 text-[22px] font-black text-[#0F172A]">{visibleModules.length}</p>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#64748B]" />
            <h2 className="text-[15px] font-black text-[#0F172A]">Your Modules</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleModules.map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.href}
                  href={module.href}
                  className="group rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#BFDBFE] hover:shadow-md"
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${module.bg} ${module.accent}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-[15px] font-black text-[#0F172A]">{module.title}</h3>
                  <p className="mt-2 min-h-[44px] text-[13px] font-medium leading-relaxed text-[#64748B]">
                    {module.description}
                  </p>
                  <p className="mt-4 text-[12px] font-bold text-[#2563EB] group-hover:text-[#1D4ED8]">Open module</p>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
