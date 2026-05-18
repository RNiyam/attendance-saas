"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { MastersPanel } from "@/components/super-admin/masters-panel";

function MastersContent() {
  const params = useSearchParams();
  const tab = (params.get("tab") ?? "shift-types") as
    | "shift-types"
    | "states"
    | "cities"
    | "sectors"
    | "sub-sectors"
    | "enums"
    | "permissions";
  const valid = ["shift-types", "states", "cities", "sectors", "sub-sectors", "enums", "permissions"].includes(tab)
    ? tab
    : "shift-types";

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#4F7FFF]">Reference data</p>
      <h1 className="mt-1 text-[24px] font-black tracking-[-0.02em]">Masters</h1>
      <p className="mt-2 text-[14px] font-medium text-[#6B6B80]">
        Control global catalogs used in onboarding, shifts, and org setup.
      </p>
      <div className="mt-6">
        <MastersPanel initialTab={valid} />
      </div>
    </div>
  );
}

export default function SuperAdminMastersPage() {
  return (
    <Suspense fallback={<p className="text-[13px] text-[#6B6B80]">Loading masters…</p>}>
      <MastersContent />
    </Suspense>
  );
}
