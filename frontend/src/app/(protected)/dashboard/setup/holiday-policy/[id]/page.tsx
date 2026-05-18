"use client";

import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { readSetupFlags, writeSetupFlag } from "@/lib/setup-progress";
import { apiBaseUrl, authenticatedFetch } from "@/services/http";

type HolidayRow = {
  id: string;
  holidayName: string;
  holidayDate: string;
};

type TemplateHoliday = {
  id: number;
  holidayName: string;
  holidayDate: string;
};

type HolidayTemplateDetail = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  holidays: TemplateHoliday[];
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toInputDate(value: string): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function dateToMonth(value: string): string {
  const date = toInputDate(value);
  return date.length >= 7 ? date.slice(0, 7) : "";
}

function monthToDate(value: string, end = false): string {
  if (!value) return "";
  const [year, month] = value.split("-").map((x) => Number(x));
  if (!year || !month) return "";
  if (!end) return `${year}-${String(month).padStart(2, "0")}-01`;
  const last = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

function EditHolidayTemplateContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const templateId = Number(params.id);

  const [activeTab, setActiveTab] = useState<"template" | "assign">(
    searchParams.get("tab") === "assign" ? "assign" : "template",
  );
  const [name, setName] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [holidays, setHolidays] = useState<HolidayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(templateId) || templateId <= 0) {
      setLoading(false);
      setError("Invalid template.");
      return;
    }

    const id = window.setTimeout(async () => {
      try {
        const res = await authenticatedFetch(`${apiBaseUrl}/api/shifts/holiday-templates/${templateId}`);
        if (!res.ok) {
          setError("Holiday template not found.");
          setLoading(false);
          return;
        }
        const data = (await res.json()) as HolidayTemplateDetail;
        setName(data.name ?? "");
        setStartMonth(dateToMonth(data.startDate));
        setEndMonth(dateToMonth(data.endDate));
        setHolidays(
          (data.holidays ?? []).map((h) => ({
            id: String(h.id),
            holidayName: h.holidayName,
            holidayDate: toInputDate(h.holidayDate),
          })),
        );
      } catch {
        setError("Could not load holiday template.");
      } finally {
        setLoading(false);
      }
    }, 0);

    return () => window.clearTimeout(id);
  }, [templateId]);

  const cleanedHolidays = useMemo(
    () => holidays.filter((holiday) => holiday.holidayName.trim() && holiday.holidayDate),
    [holidays],
  );

  const save = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Template name is required.");
      return;
    }
    if (!startMonth || !endMonth) {
      setError("Holiday period is required.");
      return;
    }
    if (cleanedHolidays.length === 0) {
      setError("Add at least one holiday.");
      return;
    }

    setSaving(true);
    try {
      const res = await authenticatedFetch(`${apiBaseUrl}/api/shifts/holiday-templates/${templateId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: name.trim(),
          startDate: monthToDate(startMonth),
          endDate: monthToDate(endMonth, true),
          holidays: cleanedHolidays.map((holiday) => ({
            holidayName: holiday.holidayName.trim(),
            holidayDate: holiday.holidayDate,
          })),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof body.error === "string" ? body.error : "Could not save holiday template.");
        return;
      }
      writeSetupFlag("holidayPolicyDone", true);
      readSetupFlags();
      router.push("/dashboard/setup/holiday-policy");
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#F8FAFC] text-[13px] font-medium text-[#98A2B3]">
        Loading template…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 text-[#0F0F1A]">
      <main className="px-4 pb-8 pt-6 sm:px-8">
        <button
          type="button"
          onClick={() => router.push("/dashboard/setup/holiday-policy")}
          className="text-[13px] font-semibold text-[#2563EB] hover:underline"
        >
          ← Back
        </button>

        <h1 className="mt-9 text-[18px] font-black text-[#0F0F1A]">Edit Holiday Template</h1>

        <section className="mt-6 min-h-[calc(100vh-230px)] rounded-xl border border-[#E5EAF2] bg-white shadow-md shadow-black/[0.04]">
          <div className="px-6 py-6">
            <div className="inline-flex rounded-lg bg-[#F1F3F7] p-1">
              <button
                type="button"
                onClick={() => setActiveTab("template")}
                className={`h-9 rounded-md px-5 text-[13px] font-bold ${
                  activeTab === "template" ? "bg-white text-[#0F0F1A] shadow-sm" : "text-[#344054]"
                }`}
              >
                Edit Template
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("assign")}
                className={`h-9 rounded-md px-5 text-[13px] font-bold ${
                  activeTab === "assign" ? "bg-white text-[#0F0F1A] shadow-sm" : "text-[#344054]"
                }`}
              >
                Assign
              </button>
            </div>

            {activeTab === "assign" ? (
              <div className="mt-8 max-w-[560px] rounded-lg border border-[#E5EAF2] bg-white px-6 py-8">
                <p className="text-[14px] font-medium text-[#667085]">Assigned to entire organization</p>
              </div>
            ) : (
              <div className="mt-8 max-w-[780px]">
                <h2 className="text-[16px] font-black text-[#0F0F1A]">Holiday list</h2>
                <p className="mt-1 text-[14px] font-medium text-[#475467]">
                  Add or update holidays in this template
                </p>

                <label className="mt-5 block max-w-[360px]">
                  <span className="mb-1.5 block text-[12px] font-medium text-[#475467]">
                    Name <span className="text-red-500">*</span>
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Template Name"
                    className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-white px-4 text-[14px] font-medium text-[#344054] outline-none focus:border-[#4F7FFF] focus:ring-2 focus:ring-[#4F7FFF]/10"
                  />
                </label>

                <div className="mt-7">
                  <h3 className="text-[14px] font-semibold text-[#0F0F1A]">Annual Holiday Period</h3>
                  <div className="mt-3 grid max-w-[760px] gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-[12px] font-medium text-[#475467]">Start Month</span>
                      <span className="relative block">
                        <input
                          type="month"
                          value={startMonth}
                          onChange={(e) => setStartMonth(e.target.value)}
                          className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-white px-4 pr-10 text-[14px] font-medium text-[#0F172A] outline-none focus:border-[#4F7FFF] focus:ring-2 focus:ring-[#4F7FFF]/10"
                        />
                        <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
                      </span>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[12px] font-medium text-[#475467]">End Month</span>
                      <span className="relative block">
                        <input
                          type="month"
                          value={endMonth}
                          onChange={(e) => setEndMonth(e.target.value)}
                          className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-[#F2F4F7] px-4 pr-10 text-[14px] font-medium text-[#667085] outline-none focus:border-[#4F7FFF] focus:ring-2 focus:ring-[#4F7FFF]/10"
                        />
                        <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
                      </span>
                    </label>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="flex max-w-[760px] items-center justify-between gap-4">
                    <h3 className="text-[16px] font-black text-[#0F0F1A]">List of Holidays</h3>
                    <button
                      type="button"
                      onClick={() =>
                        setHolidays((prev) => [...prev, { id: uid(), holidayName: "", holidayDate: "" }])
                      }
                      className="inline-flex h-8 items-center gap-2 rounded-lg border border-[#4F7FFF] px-5 text-[13px] font-bold text-[#2563EB]"
                    >
                      <Plus className="h-4 w-4" />
                      Add Holiday
                    </button>
                  </div>

                  <div className="mt-3 max-w-[760px] rounded-lg bg-[#F8FAFC] p-5">
                    <div className="space-y-6">
                      {holidays.map((holiday) => (
                        <div key={holiday.id} className="grid items-end gap-4 sm:grid-cols-[1fr_1fr_32px]">
                          <label className="block">
                            <span className="mb-1.5 block text-[12px] font-medium text-[#475467]">Holiday Name</span>
                            <input
                              value={holiday.holidayName}
                              onChange={(e) =>
                                setHolidays((prev) =>
                                  prev.map((row) =>
                                    row.id === holiday.id ? { ...row, holidayName: e.target.value } : row,
                                  ),
                                )
                              }
                              placeholder="Holiday Name"
                              className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-white px-4 text-[14px] font-medium text-[#0F172A] outline-none focus:border-[#4F7FFF] focus:ring-2 focus:ring-[#4F7FFF]/10"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1.5 block text-[12px] font-medium text-[#475467]">Holiday Date</span>
                            <span className="relative block">
                              <input
                                type="date"
                                value={holiday.holidayDate}
                                onChange={(e) =>
                                  setHolidays((prev) =>
                                    prev.map((row) =>
                                      row.id === holiday.id ? { ...row, holidayDate: e.target.value } : row,
                                    ),
                                  )
                                }
                                className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-white px-4 pr-10 text-[14px] font-medium text-[#0F172A] outline-none focus:border-[#4F7FFF] focus:ring-2 focus:ring-[#4F7FFF]/10"
                              />
                              <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setHolidays((prev) => prev.filter((row) => row.id !== holiday.id))}
                            className="mb-2 flex h-7 w-7 items-center justify-center text-[#EF4444]"
                            aria-label="Delete holiday"
                          >
                            <Trash2 className="h-5 w-5" strokeWidth={3} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {error ? (
                  <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-800">
                    {error}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </section>
      </main>

      {activeTab === "template" ? (
        <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-[#EEF2F6] bg-white/95 px-5 py-4 shadow-[0_-10px_30px_rgba(15,23,42,0.06)] backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[14px] font-black text-[#475467]">Holiday(s) Added: {cleanedHolidays.length}</p>
            <button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              className="h-11 min-w-[190px] rounded-lg bg-[#2563EB] px-8 text-[14px] font-bold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-[#CBD5E1]"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </footer>
      ) : null}
    </div>
  );
}

export default function EditHolidayTemplatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center bg-[#F8FAFC] text-[13px] font-medium text-[#98A2B3]">
          Loading…
        </div>
      }
    >
      <EditHolidayTemplateContent />
    </Suspense>
  );
}
