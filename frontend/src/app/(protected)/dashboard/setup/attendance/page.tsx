"use client";

import { Check, MoreVertical } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import {
  attendanceStripTabState,
  readSetupFlags,
  writeSetupFlag,
  type AttendanceStripStep,
} from "@/lib/setup-progress";
import { apiBaseUrl, authenticatedFetch } from "@/services/http";

type AttendanceTemplate = {
  id: string;
  name: string;
  createdBy: string;
  updatedBy: string;
  assignedStaffCount: number;
};

const setupTabs: { label: string; key: AttendanceStripStep; href?: string }[] = [
  { label: "Attendance", key: "attendance" },
  { label: "Shifts", key: "shifts", href: "/dashboard/setup/shifts" },
  { label: "Holiday Policy", key: "holiday", href: "/dashboard/setup/holiday-policy" },
  { label: "Leave Policy", key: "leave", href: "/dashboard/setup/leave-policy" },
];
const menuItems = ["Edit", "Assign Staff", "Clone", "Manage Rules", "Delete"];
const defaultTemplate: AttendanceTemplate = {
  id: "default",
  name: "Default Template",
  createdBy: "Niyam",
  updatedBy: "—",
  assignedStaffCount: 0,
};

function AttendanceSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [templates, setTemplates] = useState<AttendanceTemplate[]>([defaultTemplate]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedToast, setSavedToast] = useState(false);
  const [setupFlags, setSetupFlags] = useState(() => readSetupFlags());

  const load = useCallback(async () => {
    const res = await authenticatedFetch(`${apiBaseUrl}/api/attendance/templates`);
    if (!res.ok) {
      setTemplates([defaultTemplate]);
      return;
    }
    const data = (await res.json()) as Partial<AttendanceTemplate>[];
    const normalized: AttendanceTemplate[] = Array.isArray(data)
      ? data.map((t) => ({
          ...defaultTemplate,
          ...t,
          id: t.id ?? defaultTemplate.id,
          name: t.name ?? defaultTemplate.name,
          createdBy: t.createdBy ?? defaultTemplate.createdBy,
          updatedBy: typeof t.updatedBy === "string" ? t.updatedBy : "—",
          assignedStaffCount: typeof t.assignedStaffCount === "number" ? t.assignedStaffCount : 0,
        }))
      : [defaultTemplate];
    setTemplates(normalized.length > 0 ? normalized : [defaultTemplate]);
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
    if (searchParams.get("templateSaved") !== "1") return;
    writeSetupFlag("attendanceTemplatesDone", true);
    setSetupFlags(readSetupFlags());
    setSavedToast(true);
    router.replace("/dashboard/setup/attendance", { scroll: false });
    const hide = window.setTimeout(() => setSavedToast(false), 4200);
    return () => window.clearTimeout(hide);
  }, [searchParams, router]);

  const openTemplate = (templateId: string) => {
    router.push(`/dashboard/setup/attendance/${templateId === "default" ? "default-template" : templateId}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 pl-0 text-[#0F0F1A] md:pl-0">
      {savedToast ? (
        <div
          role="status"
          className="fixed right-3 top-3 z-50 flex max-w-[min(260px,calc(100vw-1.5rem))] items-center gap-2 rounded-lg border border-emerald-200/90 bg-white/95 px-2.5 py-2 text-[12px] font-semibold text-emerald-900 shadow-lg shadow-black/10 backdrop-blur-sm sm:right-4 sm:top-4"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="h-3.5 w-3.5 stroke-[3]" aria-hidden />
          </span>
          <span className="min-w-0 leading-snug">Template saved</span>
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
              {index < setupTabs.length - 1 ? <span className="hidden h-px w-6 bg-[#E2E8F0] sm:block" /> : null}
            </div>
            );
          })}
        </div>

        <section className="mt-5 min-h-[calc(100vh-210px)] rounded-xl border border-[#D6DEE9] bg-white shadow-md shadow-black/[0.05]">
          <div className="px-6 py-7">
            <div className="flex max-w-[980px] items-start justify-between gap-6">
              <div>
                <h2 className="text-[16px] font-black text-[#0F0F1A]">Attendance Templates</h2>
                <p className="mt-1 text-[14px] font-medium text-[#667085]">
                  Configure attendance modes, attendance on holidays, and more
                </p>
              </div>
            </div>

            <div className="mt-6 max-w-[980px] space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openTemplate(template.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openTemplate(template.id);
                    }
                  }}
                  className={`relative flex min-h-[74px] cursor-pointer items-center justify-between rounded-lg border bg-white px-6 transition ${
                    openMenuId === template.id ? "border-[#4F7FFF]" : "border-[#E5EAF2] hover:border-[#AFC4FF]"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-[14px] font-bold text-[#1F2937]">{template.name}</p>
                    <p className="mt-2 text-[12px] font-medium text-[#667085]">
                      Created by: {template.createdBy}
                      <span className="mx-2 text-[#CBD5E1]">|</span>
                      Updated by: {template.updatedBy}
                      <span className="mx-2 text-[#CBD5E1]">|</span>
                      Assigned Staff:{" "}
                      <span className="font-black text-[#2563EB]">{template.assignedStaffCount} Staffs</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Template actions"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === template.id ? null : template.id);
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#334155] hover:bg-[#F4F7FB]"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {openMenuId === template.id ? (
                    <div
                      className="absolute right-6 top-[64px] z-10 w-[110px] rounded-md bg-white py-2 shadow-xl shadow-black/10 ring-1 ring-black/[0.04]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {menuItems.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            if (item === "Edit" || item === "Manage Rules") openTemplate(template.id);
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
              {loading ? (
                <p className="px-1 text-[12px] font-medium text-[#98A2B3]">Refreshing template details...</p>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-[#EEF2F6] bg-white/95 px-5 py-5 shadow-[0_-10px_30px_rgba(15,23,42,0.06)] backdrop-blur">
        <div className="ml-auto flex max-w-[360px] gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard/setup")}
            className="h-10 flex-1 rounded-lg border border-[#4F7FFF] bg-white text-[13px] font-bold text-[#2563EB]"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              writeSetupFlag("attendanceTemplatesDone", true);
              setSetupFlags(readSetupFlags());
              router.push("/dashboard/setup/shifts");
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

export default function AttendanceSetupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center bg-[#F8FAFC] text-[13px] font-medium text-[#98A2B3]">
          Loading…
        </div>
      }
    >
      <AttendanceSetupContent />
    </Suspense>
  );
}
