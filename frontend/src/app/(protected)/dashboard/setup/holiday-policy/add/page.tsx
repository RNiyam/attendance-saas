"use client";

import { CalendarDays, ChevronDown, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { readSetupFlags, writeSetupFlag } from "@/lib/setup-progress";
import { apiBaseUrl, authenticatedFetch } from "@/services/http";

type HolidayRow = {
  id: string;
  holidayName: string;
  holidayDate: string;
};

const INDIAN_HOLIDAYS_2026: HolidayRow[] = [
  { id: "new-year", holidayName: "New Year's Day", holidayDate: "2026-01-01" },
  { id: "makar-sankranti", holidayName: "Makar Sankranti / Pongal", holidayDate: "2026-01-14" },
  { id: "republic-day", holidayName: "Republic Day", holidayDate: "2026-01-26" },
  { id: "maha-shivaratri", holidayName: "Maha Shivaratri", holidayDate: "2026-02-15" },
  { id: "holi", holidayName: "Holi", holidayDate: "2026-03-04" },
  { id: "ram-navami", holidayName: "Ram Navami", holidayDate: "2026-03-26" },
  { id: "mahavir-jayanti", holidayName: "Mahavir Jayanti", holidayDate: "2026-03-31" },
  { id: "good-friday", holidayName: "Good Friday", holidayDate: "2026-04-03" },
  { id: "buddha-purnima", holidayName: "Buddha Purnima", holidayDate: "2026-05-01" },
  { id: "bakrid", holidayName: "Id-ul-Zuha (Bakrid)", holidayDate: "2026-05-27" },
  { id: "muharram", holidayName: "Muharram", holidayDate: "2026-06-26" },
  { id: "independence-day", holidayName: "Independence Day", holidayDate: "2026-08-15" },
  { id: "milad-un-nabi", holidayName: "Milad-un-Nabi", holidayDate: "2026-09-04" },
  { id: "gandhi-jayanti", holidayName: "Gandhi Jayanti", holidayDate: "2026-10-02" },
  { id: "dussehra", holidayName: "Dussehra", holidayDate: "2026-10-20" },
  { id: "diwali", holidayName: "Diwali", holidayDate: "2026-11-08" },
  { id: "guru-nanak-jayanti", holidayName: "Guru Nanak Jayanti", holidayDate: "2026-11-24" },
  { id: "christmas", holidayName: "Christmas", holidayDate: "2026-12-25" },
];

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function monthToDate(value: string, end = false): string {
  if (!value) return "";
  const [year, month] = value.split("-").map((x) => Number(x));
  if (!year || !month) return "";
  if (!end) return `${year}-${String(month).padStart(2, "0")}-01`;
  const last = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

export default function AddHolidayTemplatePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"template" | "assign">("template");
  const [name, setName] = useState("Default Holiday Calendar 2026");
  const [startMonth, setStartMonth] = useState("2026-01");
  const [endMonth, setEndMonth] = useState("2026-12");
  const [holidays, setHolidays] = useState<HolidayRow[]>(INDIAN_HOLIDAYS_2026);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const res = await authenticatedFetch(`${apiBaseUrl}/api/shifts/holiday-templates`, {
        method: "POST",
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

        <h1 className="mt-9 text-[18px] font-black text-[#0F0F1A]">Holiday Templates</h1>

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
                Add Template
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
                <p className="text-[14px] font-medium text-[#667085]">Assign to entire organization</p>
              </div>
            ) : (
              <div className="mt-8 max-w-[780px]">
                <h2 className="text-[16px] font-black text-[#0F0F1A]">Add Template</h2>
                <p className="mt-1 text-[14px] font-medium text-[#475467]">
                  Curate holiday lists for specific employee groups
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

      <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-[#EEF2F6] bg-white/95 px-5 py-4 shadow-[0_-10px_30px_rgba(15,23,42,0.06)] backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[14px] font-black text-[#475467]">Holiday(s) Added: {cleanedHolidays.length}</p>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="h-11 min-w-[190px] rounded-lg bg-[#2563EB] px-8 text-[14px] font-bold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-[#CBD5E1]"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </footer>
    </div>
  );
}
