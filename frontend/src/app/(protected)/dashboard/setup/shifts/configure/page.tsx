"use client";

import { ChevronDown, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ShiftDayTimeline, type TimelineBreak } from "@/components/shifts/shift-day-timeline";
import TimeDropdown from "@/components/shifts/time-dropdown";
import { apiBaseUrl, authenticatedFetch } from "@/services/http";

type ShiftTypeMaster = {
  id: number;
  code: string;
  label: string;
  description: string | null;
};

type ShiftBreakRule = {
  id: string;
  category: "shift_break" | "casual_break";
  breakName: string;
  payType: "paid" | "unpaid";
  ruleType: "interval" | "duration";
  durationMinutes: number;
  startTime: string;
  endTime: string;
  bufferStartTime: string;
  bufferEndTime: string;
  /** UI-only: whether the interval fields are expanded for a shift_break */
  intervalOpen?: boolean;
};

type RotationalShiftRow = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  unpaidBreakMinutes: number;
};

type ShiftPayload = {
  name?: string;
  shiftType?: string;
  startTime?: string | null;
  endTime?: string | null;
  earliestPunchIn?: string | null;
  latestPunchOut?: string | null;
  breaks?: Array<{
    id?: number;
    category?: "shift_break" | "casual_break";
    breakName?: string | null;
    payType?: "paid" | "unpaid";
    ruleType?: "interval" | "duration";
    durationMinutes?: number | null;
    startTime?: string | null;
    endTime?: string | null;
    bufferStartTime?: string | null;
    bufferEndTime?: string | null;
  }>;
};

const FALLBACK_SHIFT_TYPES: ShiftTypeMaster[] = [
  { id: 1, code: "fixed", label: "Fixed Shift", description: null },
  { id: 2, code: "open", label: "Open Shift", description: null },
  { id: 3, code: "rotational", label: "Rotational Shift", description: null },
];

function toMysqlTime(html: string): string {
  if (!html) return "00:00:00";
  const parts = html.split(":");
  const h = (parts[0] ?? "0").padStart(2, "0");
  const m = (parts[1] ?? "0").padStart(2, "0");
  return `${h}:${m}:00`;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function fromMysqlTime(value?: string | null): string {
  return value ? value.slice(0, 5) : "";
}

function newBreakRule(): ShiftBreakRule {
  return {
    id: uid(),
    category: "shift_break",
    breakName: "Lunch Break",
    payType: "unpaid",
    ruleType: "interval",
    durationMinutes: 15,
    startTime: "13:00",
    endTime: "13:30",
    bufferStartTime: "13:00",
    bufferEndTime: "13:30",
    intervalOpen: false,
  };
}

function breakDuration(rule: ShiftBreakRule): number {
  if (rule.ruleType === "duration") return Math.max(0, Number(rule.durationMinutes || 0));
  const startMin = rule.startTime ? parseInt(rule.startTime.slice(0, 2), 10) * 60 + parseInt(rule.startTime.slice(3, 5), 10) : 0;
  const endMin = rule.endTime ? parseInt(rule.endTime.slice(0, 2), 10) * 60 + parseInt(rule.endTime.slice(3, 5), 10) : 0;
  return endMin >= startMin ? endMin - startMin : 24 * 60 - startMin + endMin;
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m} mins`;
}

function minutesToTime(total: number): string {
  const safeTotal = Math.max(0, Math.min(23 * 60 + 59, total));
  const h = Math.floor(safeTotal / 60);
  const m = safeTotal % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function timeToMinutes(value: string): number {
  if (!value) return 0;
  const [h, m] = value.split(":").map((x) => Number(x));
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

function rangeMinutes(startTime: string, endTime: string): number {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  if (!startTime || !endTime) return 0;
  return endMin >= startMin ? endMin - startMin : 24 * 60 - startMin + endMin;
}

function DurationSelect({
  value,
  onChange,
  maxHours = 23,
}: {
  value: number;
  onChange: (value: number) => void;
  maxHours?: number;
}) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  const hourOptions = Array.from({ length: maxHours + 1 }, (_, i) => i);
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative block">
        <select
          value={hours}
          onChange={(e) => onChange(Number(e.target.value) * 60 + minutes)}
          className="h-11 w-[92px] appearance-none rounded-lg border border-[#E2E8F0] bg-white px-4 pr-8 text-[15px] font-semibold text-[#344054] outline-none focus:border-[#4F7FFF] focus:ring-2 focus:ring-[#4F7FFF]/10"
        >
          {hourOptions.map((h) => (
            <option key={h} value={h}>
              {String(h).padStart(2, "0")}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
      </span>
      <span className="text-[14px] font-semibold text-[#667085]">:</span>
      <span className="relative block">
        <select
          value={minutes}
          onChange={(e) => onChange(hours * 60 + Number(e.target.value))}
          className="h-11 w-[92px] appearance-none rounded-lg border border-[#E2E8F0] bg-white px-4 pr-8 text-[15px] font-semibold text-[#344054] outline-none focus:border-[#4F7FFF] focus:ring-2 focus:ring-[#4F7FFF]/10"
        >
          {minuteOptions.map((m) => (
            <option key={m} value={m}>
              {String(m).padStart(2, "0")}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
      </span>
      <span className="text-[13px] font-medium text-[#475467]">hh:mm</span>
    </span>
  );
}

function normalizedBreak(rule: ShiftBreakRule): ShiftBreakRule {
  if (rule.category !== "shift_break") return rule;
  return {
    ...rule,
    breakName: rule.breakName || "Shift Break",
    payType: "unpaid",
    ruleType: "interval",
  };
}

export default function ShiftConfigurePage() {
  const router = useRouter();
  const [shiftId, setShiftId] = useState<string | null>(null);
  const [urlReady, setUrlReady] = useState(false);
  const [topTab, setTopTab] = useState<"add" | "assign">("add");
  const [types, setTypes] = useState<ShiftTypeMaster[]>(FALLBACK_SHIFT_TYPES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);

  const [shiftType, setShiftType] = useState("fixed");
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [earliest, setEarliest] = useState("");
  const [latest, setLatest] = useState("");
  const [bufferOpen, setBufferOpen] = useState(false);
  const [breaks, setBreaks] = useState<ShiftBreakRule[]>([]);
  const [openWorkMinutes, setOpenWorkMinutes] = useState(0);
  const [showActionButtons, setShowActionButtons] = useState(false);
  const [rotationalRows, setRotationalRows] = useState<RotationalShiftRow[]>([
    { id: uid(), name: "", startTime: "", endTime: "", unpaidBreakMinutes: 0 },
    { id: uid(), name: "", startTime: "", endTime: "", unpaidBreakMinutes: 0 },
  ]);

  const breaksForTimeline: TimelineBreak[] = useMemo(
    () =>
      breaks.map((rule) => {
        const b = normalizedBreak(rule);
        // Only include interval data in timeline if the interval is actually set (for shift_break: only if intervalOpen or times are set)
        const hasInterval = b.ruleType === "interval" && b.startTime && b.endTime;
        return {
          start: hasInterval ? b.startTime : null,
          end: hasInterval ? b.endTime : null,
          bufferStart: hasInterval ? b.bufferStartTime : null,
          bufferEnd: hasInterval ? b.bufferEndTime : null,
          durationMinutes: b.durationMinutes,
          ruleType: b.ruleType,
          payType: b.payType,
        };
      }),
    [breaks],
  );

  const canSave =
    canManage &&
    name.trim().length >= 2 &&
    (shiftType === "open"
      ? openWorkMinutes > 0
      : shiftType === "rotational"
        ? rotationalRows.some((row) => row.name.trim() && row.startTime && row.endTime)
        : Boolean(start && end));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setShiftId(params.get("id"));
    setUrlReady(true);
  }, []);

  const load = useCallback(async () => {
    if (!urlReady) return;
    const [meRes, typesRes, shiftRes] = await Promise.all([
      authenticatedFetch(`${apiBaseUrl}/api/auth/me`),
      authenticatedFetch(`${apiBaseUrl}/api/shifts/shift-types`),
      shiftId ? authenticatedFetch(`${apiBaseUrl}/api/shifts/${shiftId}`) : Promise.resolve(null),
    ]);
    if (meRes.ok) {
      const me = (await meRes.json()) as { permissions?: string[] };
      setCanManage((me.permissions ?? []).includes("MANAGE_SHIFTS"));
    }
    if (typesRes.ok) {
      const data = (await typesRes.json()) as ShiftTypeMaster[];
      const list = Array.isArray(data) ? data : [];
      const byCode = new Map(list.map((t) => [t.code, t]));
      const merged = FALLBACK_SHIFT_TYPES.map((f) => byCode.get(f.code) ?? f);
      setTypes(merged);
    }
    if (shiftRes?.ok) {
      const data = (await shiftRes.json()) as ShiftPayload;
      setName(data.name ?? "");
      setShiftType(data.shiftType ?? "fixed");
      setStart(fromMysqlTime(data.startTime));
      setEnd(fromMysqlTime(data.endTime));
      setOpenWorkMinutes(timeToMinutes(fromMysqlTime(data.endTime)));
      setEarliest(fromMysqlTime(data.earliestPunchIn));
      setLatest(fromMysqlTime(data.latestPunchOut));
      setBreaks(
        (data.breaks ?? []).map((b) => {
          const hasIntervalTimes = Boolean(b.startTime && b.endTime);
          return {
            id: b.id != null ? String(b.id) : uid(),
            category: b.category ?? "shift_break",
            breakName: b.breakName ?? (b.category === "casual_break" ? "Casual Break" : "Lunch Break"),
            payType: b.payType ?? "unpaid",
            ruleType: b.ruleType ?? "interval",
            durationMinutes: b.durationMinutes ?? 15,
            startTime: fromMysqlTime(b.startTime),
            endTime: fromMysqlTime(b.endTime),
            bufferStartTime: fromMysqlTime(b.bufferStartTime ?? b.startTime),
            bufferEndTime: fromMysqlTime(b.bufferEndTime ?? b.endTime),
            // If loaded with interval times, show them expanded
            intervalOpen: hasIntervalTimes,
          };
        }),
      );
    }
  }, [shiftId, urlReady]);

  useEffect(() => {
    if (types.length === 0) return;
    setShiftType((prev) => (types.some((t) => t.code === prev) ? prev : types[0].code));
  }, [types]);

  useEffect(() => {
    if (!urlReady) return;
    const id = window.setTimeout(() => {
      void load().finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(id);
  }, [load, urlReady]);

  const save = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (shiftType === "open" && openWorkMinutes <= 0) {
      setError("Work hours are required.");
      return;
    }
    if (shiftType === "rotational" && !rotationalRows.some((row) => row.name.trim() && row.startTime && row.endTime)) {
      setError("At least one rotational shift detail is required.");
      return;
    }
    if (shiftType !== "open" && shiftType !== "rotational" && (!start || !end)) {
      setError("Start time and end time are required.");
      return;
    }
    if (!canManage) {
      setError("You do not have permission to save shifts.");
      return;
    }
    setSaving(true);
    try {
      const normalizedBreaks = breaks.map((rule) => {
        const b = normalizedBreak(rule);
        return {
          category: b.category,
          breakName: b.breakName.trim() || (b.category === "casual_break" ? "Casual Break" : "Shift Break"),
          payType: b.payType,
          ruleType: b.ruleType,
          durationMinutes: b.ruleType === "duration" ? Math.max(1, Number(b.durationMinutes || 0)) : null,
          startTime: b.ruleType === "interval" ? toMysqlTime(b.startTime) : null,
          endTime: b.ruleType === "interval" ? toMysqlTime(b.endTime) : null,
          bufferStartTime: b.ruleType === "interval" ? toMysqlTime(b.bufferStartTime || b.startTime) : null,
          bufferEndTime: b.ruleType === "interval" ? toMysqlTime(b.bufferEndTime || b.endTime) : null,
        };
      });
      const breakPolicy =
        normalizedBreaks.length > 0
          ? JSON.stringify({
              breaks: normalizedBreaks
                .filter((b) => b.ruleType === "interval")
                .map((b) => ({ start: b.startTime, end: b.endTime })),
            })
          : null;
      const res = await authenticatedFetch(`${apiBaseUrl}/api/shifts${shiftId ? `/${shiftId}` : ""}`, {
        method: shiftId ? "PATCH" : "POST",
        body: JSON.stringify({
          name: name.trim(),
          shiftType,
          startTime:
            shiftType === "open"
              ? "00:00:00"
              : shiftType === "rotational"
                ? toMysqlTime(rotationalRows.find((row) => row.startTime)?.startTime ?? "00:00")
                : toMysqlTime(start),
          endTime:
            shiftType === "open"
              ? toMysqlTime(minutesToTime(openWorkMinutes))
              : shiftType === "rotational"
                ? toMysqlTime(rotationalRows.find((row) => row.endTime)?.endTime ?? "00:00")
                : toMysqlTime(end),
          earliestPunchIn: shiftType === "fixed" && earliest ? toMysqlTime(earliest) : null,
          latestPunchOut: shiftType === "fixed" && latest ? toMysqlTime(latest) : null,
          breakPolicy: shiftType === "fixed" ? breakPolicy : null,
          breaks: shiftType === "fixed" ? normalizedBreaks : [],
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "Could not save shift.");
        return;
      }
      router.push("/dashboard/setup/shifts?saved=1");
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#F8FAFC] text-[13px] font-medium text-[#98A2B3]">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 text-[#0F0F1A]">
      <main className="px-4 pb-8 pt-6 sm:px-8">
        <button
          type="button"
          onClick={() => router.push("/dashboard/setup/shifts")}
          className="text-[13px] font-semibold text-[#2563EB] hover:underline"
        >
          ← Back
        </button>

        <section className="mt-5 rounded-xl border border-[#D6DEE9] bg-white shadow-md shadow-black/[0.05]">
          <div className="border-b border-[#EEF2F6] px-6 py-6">
            <h1 className="text-[16px] font-black text-[#0F0F1A]">Shift Configuration</h1>
            <p className="mt-1 text-[14px] font-medium text-[#667085]">
              Configure your shift here. Set names, start and end times, buffer minutes and more.
            </p>

            <div className="mt-5 inline-flex rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] p-1">
              <button
                type="button"
                onClick={() => setTopTab("add")}
                className={`rounded-md px-4 py-2 text-[13px] font-bold transition ${
                  topTab === "add" ? "bg-white text-[#0F0F1A] shadow-sm" : "text-[#64748B]"
                }`}
              >
                Add Shift
              </button>
              <button
                type="button"
                onClick={() => setTopTab("assign")}
                className={`rounded-md px-4 py-2 text-[13px] font-bold transition ${
                  topTab === "assign" ? "bg-white text-[#0F0F1A] shadow-sm" : "text-[#64748B]"
                }`}
              >
                Assign Rules
              </button>
            </div>
          </div>

          {topTab === "assign" ? (
            <div className="px-6 py-12 text-center">
              <p className="text-[14px] font-medium text-[#667085]">Assign rules to staff will be available in a later step.</p>
              <button
                type="button"
                onClick={() => setTopTab("add")}
                className="mt-4 text-[13px] font-bold text-[#2563EB] hover:underline"
              >
                Go to Add Shift
              </button>
            </div>
          ) : (
            <div className="space-y-5 px-6 py-6">
              <label className="block w-[360px] max-w-full">
                <span className="mb-1.5 block text-[11px] font-semibold text-[#344054]">
                  Shift Type <span className="text-red-500">*</span>
                </span>
                <span className="relative block">
                  <select
                    value={shiftType}
                    onChange={(e) => setShiftType(e.target.value)}
                    className="h-9 w-full appearance-none rounded-md border border-[#E2E8F0] bg-white px-3 pr-9 text-[13px] font-medium text-[#344054] outline-none focus:border-[#4F7FFF] focus:ring-2 focus:ring-[#4F7FFF]/10"
                  >
                    {types.map((t) => (
                      <option key={t.id} value={t.code}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
                </span>
              </label>

              <label className="block w-[360px] max-w-full">
                <span className="mb-1.5 block text-[11px] font-semibold text-[#344054]">
                  Name
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-[13px] font-medium text-[#344054] outline-none focus:border-[#4F7FFF] focus:ring-2 focus:ring-[#4F7FFF]/10"
                />
              </label>

              {shiftType === "open" ? (
                <>
                  <label className="block">
                    <span className="mb-2 block text-[14px] font-medium text-[#475467]">Work hours</span>
                    <DurationSelect value={openWorkMinutes} onChange={setOpenWorkMinutes} />
                  </label>

                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-medium text-[#475467]">Show action buttons</span>
                    <button
                      type="button"
                      aria-pressed={showActionButtons}
                      onClick={() => setShowActionButtons((value) => !value)}
                      className={`relative h-6 w-11 rounded-full transition ${
                        showActionButtons ? "bg-[#2563EB]" : "bg-[#98A2B3]"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
                          showActionButtons ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </>
              ) : shiftType === "rotational" ? (
                <div className="space-y-5">
                  <h2 className="text-[16px] font-semibold text-[#0F0F1A]">Add Shift Details</h2>
                  <div className="overflow-x-auto">
                    <div className="min-w-[980px]">
                      <div className="grid grid-cols-[260px_260px_260px_320px_180px] gap-8 border-b border-[#EEF2F6] pb-4 text-[14px] font-medium text-[#0F0F1A]">
                        <span>Rotational Shift Name</span>
                        <span>Start Time</span>
                        <span>End Time</span>
                        <span>Unpaid Break</span>
                        <span>Net Payable Hours</span>
                      </div>

                      <div className="space-y-4 pt-4">
                        {rotationalRows.map((row) => {
                          const netMinutes = Math.max(0, rangeMinutes(row.startTime, row.endTime) - row.unpaidBreakMinutes);
                          return (
                            <div
                              key={row.id}
                              className="grid grid-cols-[260px_260px_260px_320px_180px] items-center gap-8"
                            >
                              <input
                                value={row.name}
                                onChange={(e) =>
                                  setRotationalRows((prev) =>
                                    prev.map((x) => (x.id === row.id ? { ...x, name: e.target.value } : x)),
                                  )
                                }
                                placeholder="Rotational Shift Name"
                                className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-white px-4 text-[13px] font-medium text-[#344054] outline-none focus:border-[#4F7FFF] focus:ring-2 focus:ring-[#4F7FFF]/10"
                              />
                              <TimeDropdown
                                value={row.startTime}
                                onChange={(next) =>
                                  setRotationalRows((prev) =>
                                    prev.map((x) => (x.id === row.id ? { ...x, startTime: next } : x)),
                                  )
                                }
                                className="w-full"
                                triggerClassName="h-11 rounded-lg px-4 text-[13px]"
                                placeholder="hh:mm aa"
                              />
                              <TimeDropdown
                                value={row.endTime}
                                onChange={(next) =>
                                  setRotationalRows((prev) =>
                                    prev.map((x) => (x.id === row.id ? { ...x, endTime: next } : x)),
                                  )
                                }
                                className="w-full"
                                triggerClassName="h-11 rounded-lg px-4 text-[13px]"
                                placeholder="hh:mm aa"
                              />
                              <DurationSelect
                                value={row.unpaidBreakMinutes}
                                onChange={(next) =>
                                  setRotationalRows((prev) =>
                                    prev.map((x) => (x.id === row.id ? { ...x, unpaidBreakMinutes: next } : x)),
                                  )
                                }
                              />
                              <span className="text-[14px] font-semibold text-[#0F0F1A]">{formatMinutes(netMinutes)}</span>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setRotationalRows((prev) => [
                            ...prev,
                            { id: uid(), name: "", startTime: "", endTime: "", unpaidBreakMinutes: 0 },
                          ])
                        }
                        className="mt-4 rounded-lg bg-[#D1D5DB] px-5 py-2 text-[13px] font-bold text-[#4B5563]"
                      >
                        Add Shift
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
              <div>
                <h2 className="text-[13px] font-black text-[#0F0F1A]">Shift Time</h2>
                <div className="mt-2 flex flex-wrap items-end gap-4">
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-semibold text-[#344054]">
                      Start Time <span className="text-red-500">*</span>
                    </span>
                    <TimeDropdown value={start} onChange={setStart} placeholder="hh:mm" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-semibold text-[#344054]">
                      End Time <span className="text-red-500">*</span>
                    </span>
                    <TimeDropdown value={end} onChange={setEnd} placeholder="hh:mm" />
                  </label>
                </div>

                <div className="mt-5 max-w-2xl rounded-lg border border-[#E2E8F0] bg-[#FAFBFC] p-4">
                  <ShiftDayTimeline
                    startTime={start}
                    endTime={end}
                    earliestPunchIn={earliest}
                    latestPunchOut={latest}
                    breaks={breaksForTimeline}
                  />
                </div>
              </div>

              <div className="max-w-xl rounded-lg border border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setBufferOpen((o) => !o)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <span className="text-[14px] font-semibold text-[#344054]">Buffer minutes</span>
                  <Pencil className="h-4 w-4 text-[#667085]" />
                </button>
                {bufferOpen ? (
                  <div className="space-y-4 border-t border-[#EEF2F6] px-4 py-4">
                    <div className="flex flex-wrap items-end gap-4">
                      <label className="block">
                        <span className="mb-1.5 block text-[11px] font-semibold text-[#344054]">
                          Earliest allowed punch in time
                        </span>
                        <TimeDropdown value={earliest} onChange={setEarliest} placeholder="hh:mm" />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-[11px] font-semibold text-[#344054]">
                          Latest allowed punch out time
                        </span>
                        <TimeDropdown value={latest} onChange={setLatest} placeholder="hh:mm" />
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setBufferOpen(false)}
                        className="rounded-lg bg-[#2563EB] px-5 py-2 text-[13px] font-bold text-white"
                      >
                        Done
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEarliest("");
                          setLatest("");
                          setBufferOpen(false);
                        }}
                        className="rounded-lg border border-[#CBD5E1] bg-white px-5 py-2 text-[13px] font-bold text-[#475467]"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                className="flex w-full max-w-xl items-center justify-between rounded-lg border border-[#E2E8F0] px-4 py-3 text-left"
              >
                <span className="text-[14px] font-semibold text-[#344054]">More Settings</span>
                <Pencil className="h-4 w-4 text-[#667085]" />
              </button>

              {/* ── Breaks section ── */}
              <section className="max-w-3xl overflow-visible rounded-lg border border-[#E2E8F0] bg-white">
                <div className="flex items-center justify-between border-b border-[#EEF2F6] px-4 py-3">
                  <h2 className="text-[14px] font-black text-[#0F0F1A]">Breaks</h2>
                  {breaks.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setBreaks([])}
                      className="text-[12px] font-bold text-[#B42318] hover:underline"
                    >
                      Clear All
                    </button>
                  ) : null}
                </div>

                <div className="space-y-3 bg-[#F8FAFC] p-3">
                  {breaks.map((b) => {
                    const norm = normalizedBreak(b);
                    const isShiftBreak = b.category === "shift_break";
                    // For shift_break the type is always "interval"; for casual_break use b.ruleType
                    const effectiveRuleType = isShiftBreak ? "interval" : b.ruleType;

                    return (
                      <div key={b.id} className="overflow-visible rounded-lg border border-[#E2E8F0] bg-white p-3">
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[12px] font-black text-[#0F0F1A]">
                              {isShiftBreak ? "Shift Break" : b.breakName || "Casual Break"}
                            </p>
                            <p className="mt-0.5 text-[11px] font-semibold text-[#667085]">
                              {isShiftBreak ? "Shift break" : "Casual break"} -{" "}
                              {isShiftBreak ? "unpaid" : b.payType} -{" "}
                              {formatMinutes(breakDuration(norm))}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setBreaks((prev) => prev.filter((x) => x.id !== b.id))}
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-[#DC2626] text-[16px] font-bold leading-none text-white"
                            aria-label="Remove break"
                          >
                            -
                          </button>
                        </div>

                        {/* Dropdowns row */}
                        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          {/* Category */}
                          <label className="block">
                            <span className="mb-1 block text-[11px] font-semibold text-[#475467]">
                              Category <span className="text-red-500">*</span>
                            </span>
                            <span className="relative block">
                              <select
                                value={b.category}
                                onChange={(e) =>
                                  setBreaks((prev) =>
                                    prev.map((x) =>
                                      x.id === b.id
                                        ? normalizedBreak({
                                            ...x,
                                            category: e.target.value as ShiftBreakRule["category"],
                                            breakName: e.target.value === "casual_break" ? "Casual Break" : "Shift Break",
                                            intervalOpen: false,
                                          })
                                        : x,
                                    ),
                                  )
                                }
                                className="h-9 w-full appearance-none rounded-md border border-[#E2E8F0] bg-white px-3 pr-8 text-[12px] font-medium text-[#344054] outline-none focus:border-[#4F7FFF] focus:ring-2 focus:ring-[#4F7FFF]/10"
                              >
                                <option value="shift_break">Shift Break</option>
                                <option value="casual_break">Casual Break</option>
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#667085]" />
                            </span>
                          </label>

                          {/* Break Name — only for casual break */}
                          {!isShiftBreak ? (
                            <label className="block">
                              <span className="mb-1 block text-[11px] font-semibold text-[#475467]">
                                Break Name <span className="text-red-500">*</span>
                              </span>
                              <input
                                value={b.breakName}
                                onChange={(e) =>
                                  setBreaks((prev) => prev.map((x) => (x.id === b.id ? { ...x, breakName: e.target.value } : x)))
                                }
                                placeholder="Break Name"
                                className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-[12px] font-medium text-[#344054] outline-none focus:border-[#4F7FFF] focus:ring-2 focus:ring-[#4F7FFF]/10"
                              />
                            </label>
                          ) : null}

                          {/* Pay Type */}
                          <label className="block">
                            <span className="mb-1 block text-[11px] font-semibold text-[#475467]">
                              Pay Type <span className="text-red-500">*</span>
                            </span>
                            <span className="relative block">
                              <select
                                value={isShiftBreak ? "unpaid" : b.payType}
                                disabled={isShiftBreak}
                                onChange={(e) =>
                                  setBreaks((prev) =>
                                    prev.map((x) =>
                                      x.id === b.id ? { ...x, payType: e.target.value as ShiftBreakRule["payType"] } : x,
                                    ),
                                  )
                                }
                                className={`h-9 w-full appearance-none rounded-md border border-[#E2E8F0] px-3 pr-8 text-[12px] font-medium outline-none focus:border-[#4F7FFF] focus:ring-2 focus:ring-[#4F7FFF]/10 ${
                                  isShiftBreak ? "bg-[#EEF2F6] text-[#98A2B3]" : "bg-white text-[#344054]"
                                }`}
                              >
                                <option value="paid">Paid</option>
                                <option value="unpaid">Unpaid</option>
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#667085]" />
                            </span>
                          </label>

                          {/* Type — disabled + locked to Intervals for shift_break */}
                          <label className="block">
                            <span className="mb-1 block text-[11px] font-semibold text-[#475467]">
                              Type <span className="text-red-500">*</span>
                            </span>
                            <span className="relative block">
                              <select
                                value={effectiveRuleType}
                                disabled={isShiftBreak}
                                onChange={(e) =>
                                  setBreaks((prev) =>
                                    prev.map((x) =>
                                      x.id === b.id
                                        ? { ...x, ruleType: e.target.value as ShiftBreakRule["ruleType"] }
                                        : x,
                                    ),
                                  )
                                }
                                className={`h-9 w-full appearance-none rounded-md border border-[#E2E8F0] px-3 pr-8 text-[12px] font-medium outline-none focus:border-[#4F7FFF] focus:ring-2 focus:ring-[#4F7FFF]/10 ${
                                  isShiftBreak ? "bg-[#EEF2F6] text-[#98A2B3]" : "bg-white text-[#344054]"
                                }`}
                              >
                                <option value="duration">Duration</option>
                                <option value="interval">Intervals</option>
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#667085]" />
                            </span>
                          </label>
                        </div>

                        {/* ── Interval / duration body ── */}
                        {effectiveRuleType === "duration" ? (
                          /* Casual break - duration */
                          <label className="mt-3 block max-w-[180px]">
                            <span className="mb-1 block text-[11px] font-semibold text-[#475467]">
                              Max Break Minutes <span className="text-red-500">*</span>
                            </span>
                            <input
                              type="number"
                              min={1}
                              value={b.durationMinutes}
                              onChange={(e) =>
                                setBreaks((prev) =>
                                  prev.map((x) => (x.id === b.id ? { ...x, durationMinutes: Number(e.target.value || 0) } : x)),
                                )
                              }
                              className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-[12px] font-medium text-[#344054] outline-none focus:border-[#4F7FFF] focus:ring-2 focus:ring-[#4F7FFF]/10"
                            />
                          </label>
                        ) : isShiftBreak ? (
                          /* ── Shift Break: show "Add Interval" button, expand on click ── */
                          <div className="mt-3">
                            {!b.intervalOpen ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setBreaks((prev) =>
                                    prev.map((x) => (x.id === b.id ? { ...x, intervalOpen: true } : x)),
                                  )
                                }
                                className="rounded-lg border border-[#2563EB] px-4 py-2 text-[13px] font-bold text-[#2563EB] hover:bg-[#EFF6FF] transition"
                              >
                                Add Interval
                              </button>
                            ) : (
                              <div>
                                <div className="mb-2 flex items-center justify-between">
                                  <h3 className="text-[12px] font-black text-[#0F0F1A]">Intervals</h3>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setBreaks((prev) =>
                                        prev.map((x) =>
                                          x.id === b.id
                                            ? {
                                                ...x,
                                                intervalOpen: false,
                                                startTime: "",
                                                endTime: "",
                                                bufferStartTime: "",
                                                bufferEndTime: "",
                                              }
                                            : x,
                                        ),
                                      )
                                    }
                                    className="text-[11px] font-bold text-[#B42318] hover:underline"
                                  >
                                    Remove Interval
                                  </button>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                  {(
                                    [
                                      ["Start Buffer", "bufferStartTime"],
                                      ["Start Time", "startTime"],
                                      ["End Time", "endTime"],
                                      ["Buffer End", "bufferEndTime"],
                                    ] as [string, keyof ShiftBreakRule][]
                                  ).map(([label, key]) => (
                                    <label key={String(key)} className="block">
                                      <span className="mb-1 block text-[11px] font-semibold text-[#475467]">
                                        {label} <span className="text-red-500">*</span>
                                      </span>
                                      <TimeDropdown
                                        value={String(b[key] ?? "")}
                                        onChange={(next) =>
                                          setBreaks((prev) =>
                                            prev.map((x) => (x.id === b.id ? { ...x, [key]: next } : x)),
                                          )
                                        }
                                        className="w-full"
                                        triggerClassName="h-9 rounded-md px-3 text-[12px]"
                                        placeholder="hh:mm"
                                      />
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Casual break - interval */
                          <div className="mt-3">
                            <h3 className="text-[12px] font-black text-[#0F0F1A]">Intervals</h3>
                            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                              {(
                                [
                                  ["Start Buffer", "bufferStartTime"],
                                  ["Start Time", "startTime"],
                                  ["End Time", "endTime"],
                                  ["Buffer End", "bufferEndTime"],
                                ] as [string, keyof ShiftBreakRule][]
                              ).map(([label, key]) => (
                                <label key={String(key)} className="block">
                                  <span className="mb-1 block text-[11px] font-semibold text-[#475467]">
                                    {label} <span className="text-red-500">*</span>
                                  </span>
                                  <TimeDropdown
                                    value={String(b[key] ?? "")}
                                    onChange={(next) =>
                                      setBreaks((prev) =>
                                        prev.map((x) => (x.id === b.id ? { ...x, [key]: next } : x)),
                                      )
                                    }
                                    className="w-full"
                                    triggerClassName="h-9 rounded-md px-3 text-[12px]"
                                    placeholder="hh:mm"
                                  />
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setBreaks((prev) => [...prev, newBreakRule()])}
                    className="flex items-center gap-2 text-[13px] font-bold text-[#2563EB]"
                  >
                    <Plus className="h-4 w-4" />
                    Add Break
                  </button>
                </div>
              </section>

                </>
              )}
              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-800">
                  {error}
                </p>
              ) : null}
            </div>
          )}
        </section>
      </main>

      {topTab === "add" ? (
        <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-[#EEF2F6] bg-white px-5 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.06)]">
          <div className="flex justify-end">
            <button
              type="button"
              disabled={saving || !canSave}
              onClick={() => void save()}
              className={`h-11 min-w-[120px] rounded-lg px-8 text-[14px] font-bold transition ${
                canSave && !saving
                  ? "bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
                  : "bg-[#E2E8F0] text-[#98A2B3] cursor-not-allowed"
              }`}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
