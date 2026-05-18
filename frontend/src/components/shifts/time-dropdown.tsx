"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";

type Props = {
  value: string; // "HH:MM" (24h) or empty
  onChange: (next: string) => void;
  placeholder?: string;
  /** Wrapper width; trigger fills this box. Default compact time picker width. */
  className?: string;
  triggerClassName?: string;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function minutesStepArray(step: number): number[] {
  const out: number[] = [];
  for (let m = 0; m < 60; m += step) out.push(m);
  return out;
}

function parseValue(value: string): { hour12: number; minute: number; ampm: "AM" | "PM" } | null {
  if (!value) return null;
  const parts = value.split(":");
  const h = parseInt(parts[0] ?? "0", 10);
  const m = parseInt(parts[1] ?? "0", 10);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;

  const ampm: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return { hour12, minute: Math.max(0, Math.min(59, m)), ampm };
}

function to24h(hour12: number, minute: number, ampm: "AM" | "PM"): string {
  const base = hour12 % 12; // 12 -> 0
  const h = (ampm === "PM" ? base + 12 : base) % 24;
  return `${pad2(h)}:${pad2(minute)}`;
}

const DEFAULT_WIDTH = "w-[118px]";

export default function TimeDropdown({ value, onChange, placeholder, className, triggerClassName }: Props) {
  const parsed = useMemo(() => parseValue(value), [value]);

  const [open, setOpen] = useState(false);
  const [hour12, setHour12] = useState<number>(parsed?.hour12 ?? 1);
  const [minute, setMinute] = useState<number>(parsed?.minute ?? 0);
  const [ampm, setAmpm] = useState<"AM" | "PM">(parsed?.ampm ?? "AM");

  useEffect(() => {
    if (!parsed) return;
    setHour12(parsed.hour12);
    setMinute(parsed.minute);
    setAmpm(parsed.ampm);
  }, [parsed]);

  const display = useMemo(() => {
    if (!value) return placeholder ?? "hh:mm";
    const p = parseValue(value);
    if (!p) return placeholder ?? "hh:mm";
    return `${pad2(p.hour12)}:${pad2(p.minute)} ${p.ampm}`;
  }, [placeholder, value]);

  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const minutes = useMemo(() => minutesStepArray(1), []);

  const close = () => setOpen(false);

  const commit = (h12: number, m: number, ap: "AM" | "PM") => {
    onChange(to24h(h12, m, ap));
  };

  // Basic outside click handling for the popover.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest?.("[data-time-dropdown]")) return;
      close();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const wrapperClass = className ?? DEFAULT_WIDTH;

  return (
    <div className={`relative shrink-0 ${wrapperClass}`} data-time-dropdown>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-9 w-full items-center justify-between border border-[#E2E8F0] bg-white px-2.5 text-[13px] font-medium outline-none focus:border-[#4F7FFF] focus:ring-2 focus:ring-[#4F7FFF]/10 ${triggerClassName ?? "rounded-md"}`}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <Clock3 className="h-3.5 w-3.5 shrink-0 text-[#98A2B3]" />
          <span className="truncate text-[#344054]">{display}</span>
        </span>
        <span className="shrink-0 text-[11px] text-[#667085]">▾</span>
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 min-w-[260px] rounded-xl border border-[#E2E8F0] bg-white shadow-lg">
          <div className="flex items-start gap-0 px-4 py-3">
            <div className="max-h-[220px] w-1/3 overflow-auto pr-3">
              <div className="pb-2 text-[12px] font-bold text-[#98A2B3]">Hours</div>
              <div className="space-y-1">
                {hours.map((h) => {
                  const active = h === hour12;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        setHour12(h);
                        commit(h, minute, ampm);
                      }}
                      className={`block w-full rounded-lg px-2 py-1 text-left text-[16px] font-semibold ${
                        active ? "bg-[#EEF2FF] text-[#4F7FFF]" : "text-[#667085] hover:bg-[#F8FAFF]"
                      }`}
                    >
                      {pad2(h)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-h-[220px] w-1/3 overflow-auto px-1">
              <div className="pb-2 text-[12px] font-bold text-[#98A2B3]">Minutes</div>
              <div className="space-y-1">
                {minutes.map((m) => {
                  const active = m === minute;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setMinute(m);
                        commit(hour12, m, ampm);
                      }}
                      className={`block w-full rounded-lg px-2 py-1 text-left text-[16px] font-semibold ${
                        active ? "bg-[#EEF2FF] text-[#4F7FFF]" : "text-[#667085] hover:bg-[#F8FAFF]"
                      }`}
                    >
                      {pad2(m)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-h-[220px] w-1/3 overflow-auto pl-3">
              <div className="pb-2 text-[12px] font-bold text-[#98A2B3]">&nbsp;</div>
              <div className="space-y-1">
                {(["AM", "PM"] as const).map((ap) => {
                  const active = ap === ampm;
                  return (
                    <button
                      key={ap}
                      type="button"
                      onClick={() => {
                        setAmpm(ap);
                        commit(hour12, minute, ap);
                      }}
                      className={`block w-full rounded-lg px-2 py-1 text-left text-[16px] font-semibold ${
                        active ? "bg-[#EEF2FF] text-[#4F7FFF]" : "text-[#667085] hover:bg-[#F8FAFF]"
                      }`}
                    >
                      {ap}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[#EEF2F6] px-4 py-3">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const hh = now.getHours();
                const mm = now.getMinutes();
                onChange(`${pad2(hh)}:${pad2(mm)}`);
              }}
              className="rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-[13px] font-bold text-[#475467] hover:bg-[#FAFAFA]"
            >
              Now
            </button>
            <button
              type="button"
              onClick={close}
              className="rounded-lg bg-[#2563EB] px-3 py-2 text-[13px] font-bold text-white hover:bg-[#1d4ed8]"
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

