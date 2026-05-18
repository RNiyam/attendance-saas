"use client";

import { Check, MoreVertical, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  attendanceStripTabState,
  readSetupFlags,
  writeSetupFlag,
  type AttendanceStripStep,
} from "@/lib/setup-progress";
import { apiBaseUrl, authenticatedFetch } from "@/services/http";

type HolidayTemplate = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  holidays?: { id: number; holidayName: string; holidayDate: string }[];
};

const setupTabs: { label: string; key: AttendanceStripStep; href?: string }[] = [
  { label: "Attendance", key: "attendance", href: "/dashboard/setup/attendance" },
  { label: "Shifts", key: "shifts", href: "/dashboard/setup/shifts" },
  { label: "Holiday Policy", key: "holiday" },
  { label: "Leave Policy", key: "leave", href: "/dashboard/setup/leave-policy" },
];

const menuItems = ["Edit", "Clone", "Delete", "Manage Rules"] as const;

export default function HolidayPolicySetupPage() {
  const router = useRouter();
  const [setupFlags, setSetupFlags] = useState(() => readSetupFlags());
  const [templates, setTemplates] = useState<HolidayTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await authenticatedFetch(`${apiBaseUrl}/api/shifts/holiday-templates`);
    if (res.ok) {
      const data = (await res.json()) as HolidayTemplate[];
      setTemplates(Array.isArray(data) ? data : []);
    } else {
      setTemplates([]);
    }
  }, []);

  useEffect(() => {
    setSetupFlags(readSetupFlags());
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load().finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  useEffect(() => {
    if (openMenuId == null) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("[data-holiday-menu]")) return;
      setOpenMenuId(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [openMenuId]);

  const handleMenuAction = async (action: (typeof menuItems)[number], template: HolidayTemplate) => {
    setOpenMenuId(null);

    if (action === "Edit") {
      router.push(`/dashboard/setup/holiday-policy/${template.id}`);
      return;
    }

    if (action === "Manage Rules") {
      router.push(`/dashboard/setup/holiday-policy/${template.id}?tab=assign`);
      return;
    }

    if (action === "Clone") {
      const res = await authenticatedFetch(`${apiBaseUrl}/api/shifts/holiday-templates/${template.id}/clone`, {
        method: "POST",
      });
      if (res.ok) {
        await load();
        writeSetupFlag("holidayPolicyDone", true);
        setSetupFlags(readSetupFlags());
      }
      return;
    }

    if (action === "Delete") {
      if (!window.confirm(`Delete "${template.name}"? This cannot be undone.`)) return;
      const res = await authenticatedFetch(`${apiBaseUrl}/api/shifts/holiday-templates/${template.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await load();
        if (templates.length <= 1) {
          writeSetupFlag("holidayPolicyDone", false);
          setSetupFlags(readSetupFlags());
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-[#0F0F1A]">
      <main className="px-4 pb-8 pt-8 sm:px-8">
        <h1 className="text-[18px] font-black tracking-[-0.01em] text-[#0F0F1A]">Basic Details</h1>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {setupTabs.map((tab, index) => {
            const state = attendanceStripTabState(tab.key, setupFlags);
            const isDone = state === "completed";
            const isActive = state === "active";
            const isLocked = state === "locked";
            return (
              <div key={tab.label} className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => {
                    if (tab.href && !isLocked) router.push(tab.href);
                  }}
                  className={`flex h-8 items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold ${
                    isDone
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : isActive
                        ? "border-[#4F7FFF] bg-[#EFF6FF] text-[#2563EB]"
                        : "border-[#E2E8F0] bg-white text-[#9CA3AF]"
                  } ${isLocked ? "cursor-not-allowed opacity-70" : ""}`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black ${
                      isDone
                        ? "bg-emerald-500 text-white"
                        : isActive
                          ? "bg-white text-[#4F7FFF]"
                          : "bg-[#F8FAFC] text-[#A7B0C0]"
                    }`}
                  >
                    {isDone ? <Check className="h-3 w-3 stroke-[3]" aria-hidden /> : index + 1}
                  </span>
                  {tab.label}
                </button>
                {index < setupTabs.length - 1 ? <span className="hidden h-px w-6 bg-[#E2E8F0] sm:block" /> : null}
              </div>
            );
          })}
        </div>

        <section className="mt-5 min-h-[calc(100vh-210px)] rounded-xl border border-[#D6DEE9] bg-white shadow-md shadow-black/[0.05]">
          <div className="px-6 py-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-[16px] font-black text-[#0F0F1A]">Holiday Policy</h2>
                <p className="mt-1 text-[14px] font-medium text-[#667085]">
                  Create Holidays to auto-assign paid leave on public holidays
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/dashboard/setup/holiday-policy/add")}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#2563EB] px-4 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#1d4ed8]"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Add Holiday
              </button>
            </div>

            {loading ? (
              <p className="mt-8 text-[13px] font-medium text-[#98A2B3]">Loading holidays...</p>
            ) : templates.length === 0 ? (
              <div className="mt-8 max-w-[980px] rounded-lg border border-[#E5EAF2] bg-white px-6 py-10 text-center">
                <p className="text-[14px] font-medium text-[#667085]">No holidays added</p>
              </div>
            ) : (
              <div className="mt-8 max-w-[980px] space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    data-holiday-menu
                    className={`relative flex min-h-[74px] items-center justify-between rounded-lg border bg-white px-5 py-4 transition ${
                      openMenuId === template.id ? "border-[#4F7FFF]" : "border-[#E5EAF2]"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-[14px] font-bold text-[#1F2937]">{template.name}</p>
                      <p className="mt-2 text-[12px] font-medium text-[#667085]">
                        Holidays Added: {template.holidays?.length ?? 0}
                        <span className="mx-2 text-[#CBD5E1]">|</span>
                        Assigned to: Entire organization
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Template actions"
                      onClick={() => setOpenMenuId(openMenuId === template.id ? null : template.id)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#334155] hover:bg-[#F4F7FB]"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {openMenuId === template.id ? (
                      <div
                        className="absolute right-5 top-[58px] z-20 min-w-[140px] rounded-lg bg-white py-2 shadow-xl shadow-black/10 ring-1 ring-black/[0.06]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {menuItems.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => void handleMenuAction(item, template)}
                            className={`block w-full px-4 py-2.5 text-left text-[13px] font-medium hover:bg-[#F8FAFC] ${
                              item === "Delete" ? "text-red-600" : "text-[#344054]"
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-[#EEF2F6] bg-white/95 px-5 py-5 shadow-[0_-10px_30px_rgba(15,23,42,0.06)] backdrop-blur">
        <div className="ml-auto flex max-w-[360px] gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard/setup/shifts")}
            className="h-10 flex-1 rounded-lg border border-[#4F7FFF] bg-white text-[13px] font-bold text-[#2563EB]"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              if (templates.length > 0) {
                writeSetupFlag("holidayPolicyDone", true);
                setSetupFlags(readSetupFlags());
              }
              router.push("/dashboard/setup/leave-policy");
            }}
            className="h-10 flex-1 rounded-lg bg-[#2F67E8] text-[13px] font-bold text-white"
          >
            Continue
          </button>
        </div>
      </footer>
    </div>
  );
}
