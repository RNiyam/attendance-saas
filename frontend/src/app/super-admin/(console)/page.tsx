"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, Layers, MapPin, Settings, Shield } from "lucide-react";
import { platformAdminFetch } from "@/services/super-admin-http";

const cards = [
  { href: "/super-admin/organizations", label: "Organizations", desc: "All tenant workspaces", icon: Building2 },
  { href: "/super-admin/masters?tab=shift-types", label: "Shift types", desc: "Global shift catalog", icon: Layers },
  { href: "/super-admin/masters?tab=states", label: "States & cities", desc: "Geo reference data", icon: MapPin },
  { href: "/super-admin/masters?tab=sectors", label: "Sectors", desc: "Industry catalog", icon: Layers },
  { href: "/super-admin/masters?tab=enums", label: "Platform enums", desc: "Bands, policies, roles", icon: Shield },
  { href: "/super-admin/platform", label: "Platform settings", desc: "SMTP & infrastructure", icon: Settings },
];

export default function SuperAdminHomePage() {
  const [counts, setCounts] = useState({ orgs: 0, shiftTypes: 0, states: 0 });

  useEffect(() => {
    void (async () => {
      const [orgs, shifts, states] = await Promise.all([
        platformAdminFetch("/api/super-admin/organizations"),
        platformAdminFetch("/api/super-admin/masters/shift-types"),
        platformAdminFetch("/api/super-admin/masters/states"),
      ]);
      const [orgRows, shiftRows, stateRows] = await Promise.all([
        orgs.ok ? orgs.json() : [],
        shifts.ok ? shifts.json() : [],
        states.ok ? states.json() : [],
      ]);
      setCounts({
        orgs: Array.isArray(orgRows) ? orgRows.length : 0,
        shiftTypes: Array.isArray(shiftRows) ? shiftRows.length : 0,
        states: Array.isArray(stateRows) ? stateRows.length : 0,
      });
    })();
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#4F7FFF]">Platform</p>
      <h1 className="mt-1 text-[28px] font-black tracking-[-0.03em]">Super Admin</h1>
      <p className="mt-2 text-[14px] font-medium text-[#6B6B80]">
        Manage global masters and monitor organizations. Changes apply to all tenants.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E8E5F0] bg-white px-4 py-3 shadow-sm">
          <p className="text-[24px] font-black text-[#0F0F1A]">{counts.orgs}</p>
          <p className="text-[12px] font-semibold text-[#6B6B80]">Organizations</p>
        </div>
        <div className="rounded-xl border border-[#E8E5F0] bg-white px-4 py-3 shadow-sm">
          <p className="text-[24px] font-black text-[#0F0F1A]">{counts.shiftTypes}</p>
          <p className="text-[12px] font-semibold text-[#6B6B80]">Shift types</p>
        </div>
        <div className="rounded-xl border border-[#E8E5F0] bg-white px-4 py-3 shadow-sm">
          <p className="text-[24px] font-black text-[#0F0F1A]">{counts.states}</p>
          <p className="text-[12px] font-semibold text-[#6B6B80]">States</p>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="flex items-start gap-4 rounded-2xl border border-[#E8E5F0] bg-white p-5 shadow-sm transition hover:border-[#C7D7FE] hover:shadow-md"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#4F7FFF]">
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <p className="text-[14px] font-black text-[#0F0F1A]">{card.label}</p>
                <p className="mt-0.5 text-[12px] font-medium text-[#6B6B80]">{card.desc}</p>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
