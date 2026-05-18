"use client";

import { Check, MoreVertical, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  attendanceStripTabState,
  readSetupFlags,
  setupHubHref,
  writeSetupFlag,
  type AttendanceStripStep,
} from "@/lib/setup-progress";
import { apiBaseUrl, authenticatedFetch } from "@/services/http";

type ShiftRow = {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  shiftType: string;
};

type ShiftTypeMaster = {
  code: string;
  label: string;
  description: string | null;
  sortOrder: number;
};

const setupTabs: { label: string; key: AttendanceStripStep; href?: string }[] = [
  { label: "Attendance", key: "attendance", href: "/dashboard/setup/attendance" },
  { label: "Shifts", key: "shifts" },
  { label: "Holiday Policy", key: "holiday", href: "/dashboard/setup/holiday-policy" },
  { label: "Leave Policy", key: "leave", href: "/dashboard/setup/leave-policy" },
];
const menuItems = ["Edit", "Assign Staff", "Clone", "Manage Rules", "Delete"];

const TYPE_SECTION_HINT: Record<string, string> = {
  fixed:
    "When your staff always work the same shift every day. Can also be used in roster management",
  open: "When staff can punch in within a flexible window without fixed clock times.",
  rotational: "When teams rotate across different shift patterns on a schedule.",
  flexible: "When daily hours are flexible with optional core time requirements.",
};

function formatTime12(value: string): string {
  const raw = String(value).slice(0, 5);
  const [hStr, mStr] = raw.split(":");
  let h = parseInt(hStr ?? "0", 10);
  const m = parseInt(mStr ?? "0", 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

function sectionTitle(master: ShiftTypeMaster | undefined, code: string): string {
  if (!master) return code.charAt(0).toUpperCase() + code.slice(1) + " Shifts";
  const label = master.label.trim();
  if (label.toLowerCase().endsWith("shift")) return `${label}s`;
  return `${label}s`;
}

function ShiftsSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [typeMasters, setTypeMasters] = useState<ShiftTypeMaster[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedToast, setSavedToast] = useState(false);
  const [setupFlags, setSetupFlags] = useState(() => readSetupFlags());

  const load = useCallback(async () => {
    const [shiftsRes, typesRes] = await Promise.all([
      authenticatedFetch(`${apiBaseUrl}/api/shifts`),
      authenticatedFetch(`${apiBaseUrl}/api/shifts/shift-types`),
    ]);
    if (shiftsRes.ok) {
      const data = (await shiftsRes.json()) as ShiftRow[];
      setShifts(Array.isArray(data) ? data : []);
    } else {
      setShifts([]);
    }
    if (typesRes.ok) {
      const types = (await typesRes.json()) as ShiftTypeMaster[];
      setTypeMasters(Array.isArray(types) ? types : []);
    }
  }, []);

  const grouped = useMemo(() => {
    const masterByCode = new Map(typeMasters.map((t) => [t.code, t]));
    const order = typeMasters.length
      ? [...typeMasters].sort((a, b) => a.sortOrder - b.sortOrder).map((t) => t.code)
      : ["fixed", "flexible", "open", "rotational"];

    const byType = new Map<string, ShiftRow[]>();
    for (const s of shifts) {
      const key = s.shiftType || "fixed";
      if (!byType.has(key)) byType.set(key, []);
      byType.get(key)!.push(s);
    }

    const sections: { code: string; master?: ShiftTypeMaster; items: ShiftRow[] }[] = [];
    const seen = new Set<string>();
    for (const code of order) {
      const items = byType.get(code);
      if (items?.length) {
        sections.push({ code, master: masterByCode.get(code), items });
        seen.add(code);
      }
    }
    for (const [code, items] of byType) {
      if (!seen.has(code) && items.length) {
        sections.push({ code, master: masterByCode.get(code), items });
      }
    }
    return sections;
  }, [shifts, typeMasters]);

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
    if (searchParams.get("saved") !== "1") return;
    writeSetupFlag("shiftsDone", true);
    setSetupFlags(readSetupFlags());
    setSavedToast(true);
    void load();
    router.replace("/dashboard/setup/shifts", { scroll: false });
    const hide = window.setTimeout(() => setSavedToast(false), 4200);
    return () => window.clearTimeout(hide);
  }, [searchParams, router, load]);

  const openConfigure = (shiftId?: number) => {
    router.push(
      shiftId != null ? `/dashboard/setup/shifts/configure?id=${shiftId}` : "/dashboard/setup/shifts/configure",
    );
  };

  const continueToSetupStatus = () => {
    writeSetupFlag("shiftsDone", true);
    setSetupFlags(readSetupFlags());
    router.push(setupHubHref("shiftsDone"));
  };

  const hasShifts = shifts.length > 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-[#0F0F1A]">
      {savedToast ? (
        <div
          role="status"
          className="fixed right-3 top-3 z-50 flex max-w-[min(260px,calc(100vw-1.5rem))] items-center gap-2 rounded-lg border border-emerald-200/90 bg-white/95 px-2.5 py-2 text-[12px] font-semibold text-emerald-900 shadow-lg shadow-black/10 backdrop-blur-sm sm:right-4 sm:top-4"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="h-3.5 w-3.5 stroke-[3]" aria-hidden />
          </span>
          <span className="min-w-0 leading-snug">Shift saved</span>
        </div>
      ) : null}

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
                {index < setupTabs.length - 1 ? (
                  <span className="hidden h-px w-6 bg-[#E2E8F0] sm:block" />
                ) : null}
              </div>
            );
          })}
        </div>

        <section className="mt-5 min-h-[calc(100vh-210px)] rounded-xl border border-[#D6DEE9] bg-white shadow-md shadow-black/[0.05]">
          <div className="px-6 py-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-[16px] font-black text-[#0F0F1A]">Shift Templates</h2>
                <p className="mt-1 text-[14px] font-medium text-[#667085]">
                  Add relevant Shift Templates in your business
                </p>
              </div>
              <button
                type="button"
                onClick={() => openConfigure()}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#2563EB] px-4 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#1d4ed8]"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                New Shift
              </button>
            </div>

            <div className="mt-8 max-w-[980px]">
              {loading ? (
                <p className="text-[13px] font-medium text-[#98A2B3]">Loading shifts…</p>
              ) : !hasShifts ? (
                <p className="py-8 text-center text-[14px] font-medium text-[#667085]">No shifts added</p>
              ) : (
                <div className="space-y-8">
                  {grouped.map(({ code, master, items }) => (
                    <div key={code}>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15px] font-black text-[#0F0F1A]">{sectionTitle(master, code)}</h3>
                        <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-md bg-[#F2F4F7] px-2 text-[12px] font-bold text-[#475467]">
                          {items.length}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] font-medium text-[#667085]">
                        {master?.description?.trim() || TYPE_SECTION_HINT[code] || ""}
                      </p>

                      <div className="mt-4 space-y-3">
                        {items.map((shift) => (
                          <div
                            key={shift.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => openConfigure(shift.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                openConfigure(shift.id);
                              }
                            }}
                            className={`relative flex min-h-[72px] cursor-pointer items-center justify-between rounded-lg border bg-white px-5 py-4 transition ${
                              openMenuId === shift.id
                                ? "border-[#4F7FFF]"
                                : "border-[#E5EAF2] hover:border-[#AFC4FF]"
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-[14px] font-bold text-[#1F2937]">{shift.name}</p>
                              <p className="mt-2 text-[12px] font-medium text-[#667085]">
                                Time: {formatTime12(shift.startTime)} - {formatTime12(shift.endTime)}
                                <span className="mx-2 text-[#CBD5E1]">|</span>
                                Assigned Staff:{" "}
                                <span className="font-black text-[#2563EB]">0 Staffs</span>
                              </p>
                            </div>
                            <button
                              type="button"
                              aria-label="Shift actions"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === shift.id ? null : shift.id);
                              }}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#334155] hover:bg-[#F4F7FB]"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {openMenuId === shift.id ? (
                              <div
                                className="absolute right-5 top-[60px] z-10 w-[110px] rounded-md bg-white py-2 shadow-xl shadow-black/10 ring-1 ring-black/[0.04]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {menuItems.map((item) => (
                                  <button
                                    key={item}
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      if (item === "Edit" || item === "Manage Rules") openConfigure(shift.id);
                                    }}
                                    className="block w-full px-3 py-2 text-left text-[13px] font-medium text-[#344054] hover:bg-[#F8FAFC]"
                                  >
                                    {item}
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-[#EEF2F6] bg-white/95 px-5 py-5 shadow-[0_-10px_30px_rgba(15,23,42,0.06)] backdrop-blur">
        <div className="ml-auto flex max-w-[360px] gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard/setup/attendance")}
            className="h-10 flex-1 rounded-lg border border-[#4F7FFF] bg-white text-[13px] font-bold text-[#2563EB]"
          >
            Back
          </button>
          <button
            type="button"
            onClick={continueToSetupStatus}
            className="h-10 flex-1 rounded-lg bg-[#2F67E8] text-[13px] font-bold text-white"
          >
            Continue
          </button>
        </div>
      </footer>
    </div>
  );
}

export default function ShiftSetupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center bg-[#F8FAFC] text-[13px] font-medium text-[#98A2B3]">
          Loading…
        </div>
      }
    >
      <ShiftsSetupContent />
    </Suspense>
  );
}
