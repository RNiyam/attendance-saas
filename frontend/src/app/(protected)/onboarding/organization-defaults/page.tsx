"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiBaseUrl } from "@/services/http";

type MeResponse = {
  organization: {
    name: string;
    slug: string;
    payableDaysPolicy?: string;
    standardWorkdayMinutes?: number;
  } | null;
};

const PAYABLE_OPTIONS: {
  id: "calendar_month" | "fixed_30" | "fixed_28" | "fixed_26" | "exclude_weekly_offs";
  title: string;
  description: string;
  badge: string;
}[] = [
  {
    id: "calendar_month",
    title: "Calendar Month",
    description: "March → 31 days, April → 30 days",
    badge: "Variable",
  },
  {
    id: "fixed_30",
    title: "Fixed 30 Days",
    description: "Every month counts as 30 payable days",
    badge: "30",
  },
  {
    id: "fixed_28",
    title: "Fixed 28 Days",
    description: "Every month counts as 28 payable days",
    badge: "28",
  },
  {
    id: "fixed_26",
    title: "Fixed 26 Days",
    description: "Every month counts as 26 payable days",
    badge: "26",
  },
  {
    id: "exclude_weekly_offs",
    title: "Exclude Weekly Offs",
    description: "31-day month with 4 weekly offs → 27 payable days",
    badge: "Dynamic",
  },
];

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (token) (h as Record<string, string>).Authorization = `Bearer ${token}`;
  return h;
}

function splitMinutes(total: number): { h: number; m: number } {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return { h: Math.min(23, h), m };
}

const STEPS = ["Payable Days", "Work Hours"];

export default function OrganizationDefaultsPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [policy, setPolicy] = useState<(typeof PAYABLE_OPTIONS)[number]["id"]>("calendar_month");
  const [hours, setHours] = useState(8);
  const [mins, setMins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0); // 0 = payable days, 1 = work hours

  const load = useCallback(async () => {
    const res = await fetch(`${apiBaseUrl}/api/auth/me`, { headers: authHeaders() });
    if (!res.ok) {
      router.replace("/login");
      return;
    }
    const data = (await res.json()) as MeResponse;
    const org = data.organization;
    if (org) {
      setOrgName(org.name);
      setOrgSlug(org.slug ?? "");
      const p = org.payableDaysPolicy ?? "calendar_month";
      if (PAYABLE_OPTIONS.some((o) => o.id === p)) {
        setPolicy(p as (typeof PAYABLE_OPTIONS)[number]["id"]);
      }
      const { h, m } = splitMinutes(org.standardWorkdayMinutes ?? 480);
      setHours(h);
      setMins(m);
    }
  }, [router]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load().finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/organization/payroll-defaults`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          payableDaysPolicy: policy,
          standardWorkHours: hours,
          standardWorkMins: mins,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "Could not save payroll defaults.");
        return;
      }
      router.push("/dashboard/setup");
    } catch {
      setError("Network error while saving.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[13px] font-medium text-[#6B6B80]">
        Loading…
      </div>
    );
  }

  const progressPct = step === 0 ? 50 : 100;

  return (
    <section className="mx-auto w-full max-w-xl pb-12">
      {/* Header */}
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-[22px] font-black tracking-[-0.03em] text-[#0F0F1A] sm:text-[26px]">
          {orgName || "Your organisation"}
        </h1>
        {orgSlug ? (
          <p className="mt-1 text-[12px] font-semibold tracking-tight text-[#6B6B80]">
            Organization Code: <span className="font-mono tracking-wide text-[#0F0F1A]">{orgSlug}</span>
          </p>
        ) : null}
        <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">Setup Your Organisation</p>
      </div>

      <div className="rounded-2xl border border-[#E8E5F0] bg-white shadow-lg shadow-black/[0.04] overflow-hidden">
        {/* Progress bar + step labels */}
        <div className="px-6 pt-6 sm:px-8 sm:pt-8">
          {/* Step labels */}
          <div className="flex justify-between mb-2">
            {STEPS.map((label, i) => (
              <span
                key={label}
                className={`text-[11px] font-bold tracking-wide uppercase transition-colors ${
                  i === step
                    ? "text-[#4F7FFF]"
                    : i < step
                    ? "text-[#7C3AED]"
                    : "text-[#C4C4D4]"
                }`}
              >
                {i < step ? "✓ " : `${i + 1}. `}{label}
              </span>
            ))}
          </div>
          {/* Track */}
          <div className="h-1.5 w-full rounded-full bg-[#F0EEF8] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#4F7FFF] to-[#7C3AED] transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-3 text-[11px] font-medium text-[#C4C4D4] text-right">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>

        {/* Divider */}
        <div className="mx-6 sm:mx-8 mt-5 border-t border-[#F0EEF8]" />

        {/* Step content */}
        <div className="px-6 pb-6 pt-5 sm:px-8 sm:pb-8">
          {step === 0 && (
            <div>
              <h2 className="text-base font-bold text-[#0F0F1A]">How many days are payable each month?</h2>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#9CA3AF]">
                This sets the company-wide default used for salary calculations.
              </p>

              {/* Segmented option tiles */}
              <div className="mt-5 grid grid-cols-1 gap-2.5">
                {PAYABLE_OPTIONS.map((opt) => {
                  const selected = policy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPolicy(opt.id)}
                      className={`flex items-center gap-4 rounded-xl border-2 px-4 py-3 text-left transition-all duration-150 ${
                        selected
                          ? "border-[#4F7FFF] bg-[#F8FAFF] shadow-sm shadow-[#4F7FFF]/10"
                          : "border-[#E8E5F0] bg-[#FAFAFA] hover:border-[#CACAD6]"
                      }`}
                    >
                      {/* Badge */}
                      <span
                        className={`flex h-9 min-w-[2.75rem] px-2 shrink-0 items-center justify-center rounded-lg text-[10px] font-black leading-tight text-center transition-colors ${
                          selected
                            ? "bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] text-white"
                            : "bg-[#EDEDF5] text-[#8888A0]"
                        }`}
                      >
                        {opt.badge}
                      </span>

                      <span className="flex-1 min-w-0">
                        <span className={`block text-[13px] font-bold ${selected ? "text-[#0F0F1A]" : "text-[#3A3A50]"}`}>
                          {opt.title}
                        </span>
                        <span className="block mt-0.5 text-[11px] leading-snug text-[#9CA3AF] truncate">
                          {opt.description}
                        </span>
                      </span>

                      {/* Radio dot */}
                      <span
                        className={`h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selected ? "border-[#4F7FFF]" : "border-[#D0CDE0]"
                        }`}
                      >
                        {selected && (
                          <span className="h-2 w-2 rounded-full bg-[#4F7FFF]" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="mt-6 flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] text-sm font-semibold text-white shadow-lg shadow-[#4F7FFF]/25 transition hover:opacity-[0.97]"
              >
                Next →
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-base font-bold text-[#0F0F1A]">What&apos;s the standard daily work duration?</h2>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#9CA3AF]">
                Default attendance baseline before shift assignment. Shifts can override this later.
              </p>

              {/* Clock visual + inputs */}
              <div className="mt-6 flex flex-col items-center gap-6">
                {/* Large time display */}
                <div className="flex items-center gap-2">
                  {/* Hours column */}
                  <div className="flex flex-col items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setHours((h) => Math.min(23, h + 1))}
                      className="flex h-8 w-16 items-center justify-center rounded-lg bg-[#F0EEF8] text-[#4F7FFF] font-bold text-lg hover:bg-[#E8E5F0] transition"
                    >
                      ▲
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={String(hours).padStart(2, "0")}
                      onChange={(e) => setHours(Math.min(23, Math.max(0, parseInt(e.target.value || "0", 10))))}
                      className="h-16 w-16 rounded-xl border-2 border-[#E8E5F0] bg-white text-center text-[28px] font-black text-[#0F0F1A] outline-none focus:border-[#4F7FFF]/60 tabular-nums"
                    />
                    <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wide">Hours</span>
                    <button
                      type="button"
                      onClick={() => setHours((h) => Math.max(0, h - 1))}
                      className="flex h-8 w-16 items-center justify-center rounded-lg bg-[#F0EEF8] text-[#4F7FFF] font-bold text-lg hover:bg-[#E8E5F0] transition"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Colon */}
                  <span className="mb-6 text-[32px] font-black text-[#D0CDE0] select-none">:</span>

                  {/* Minutes column */}
                  <div className="flex flex-col items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setMins((m) => Math.min(59, m + 1))}
                      className="flex h-8 w-16 items-center justify-center rounded-lg bg-[#F0EEF8] text-[#4F7FFF] font-bold text-lg hover:bg-[#E8E5F0] transition"
                    >
                      ▲
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={String(mins).padStart(2, "0")}
                      onChange={(e) => setMins(Math.min(59, Math.max(0, parseInt(e.target.value || "0", 10))))}
                      className="h-16 w-16 rounded-xl border-2 border-[#E8E5F0] bg-white text-center text-[28px] font-black text-[#0F0F1A] outline-none focus:border-[#4F7FFF]/60 tabular-nums"
                    />
                    <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wide">Mins</span>
                    <button
                      type="button"
                      onClick={() => setMins((m) => Math.max(0, m - 1))}
                      className="flex h-8 w-16 items-center justify-center rounded-lg bg-[#F0EEF8] text-[#4F7FFF] font-bold text-lg hover:bg-[#E8E5F0] transition"
                    >
                      ▼
                    </button>
                  </div>
                </div>

                {/* Summary pill */}
                <div className="rounded-xl bg-[#F8FAFF] border border-[#E0E8FF] px-5 py-2.5 text-center">
                  <span className="text-[12px] font-semibold text-[#6B6B80]">
                    Workday set to{" "}
                    <span className="text-[#4F7FFF] font-black">
                      {hours}h {mins > 0 ? `${mins}m` : ""}
                    </span>{" "}
                    per day
                  </span>
                </div>
              </div>

              {error && (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-800">
                  {error}
                </p>
              )}

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStep(0); setError(null); }}
                  className="flex h-11 w-24 shrink-0 items-center justify-center rounded-xl border-2 border-[#E8E5F0] bg-white text-[13px] font-semibold text-[#6B6B80] hover:border-[#CACAD6] transition"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void submit()}
                  className="flex h-11 flex-1 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] text-sm font-semibold text-white shadow-lg shadow-[#4F7FFF]/25 transition hover:opacity-[0.97] disabled:opacity-50"
                >
                  {submitting ? "Saving…" : "Save & Continue"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
