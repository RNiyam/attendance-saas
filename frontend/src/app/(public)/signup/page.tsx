"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiBaseUrl } from "@/services/http";

// ─── Types ────────────────────────────────────────────────────────────────────
type EmployeeStatus = "clocked-in" | "on-leave" | "clocked-out";

interface Employee {
  name: string;
  role: string;
  avatar: string;
  status: EmployeeStatus;
  clockedAt: string;
}

interface LeaveToast {
  id: number;
  text: string;
  type: "leave" | "payroll" | "shift";
}

// ─── Constants ────────────────────────────────────────────────────────────────
const INITIAL_EMPLOYEES: Employee[] = [
  { name: "Priya S.",  role: "Engineering", avatar: "PS", status: "clocked-in",  clockedAt: "09:02 AM" },
  { name: "Arjun M.",  role: "Design",       avatar: "AM", status: "on-leave",    clockedAt: "—" },
  { name: "Sneha R.",  role: "HR",           avatar: "SR", status: "clocked-in",  clockedAt: "08:55 AM" },
  { name: "Rohan K.",  role: "Sales",        avatar: "RK", status: "clocked-out", clockedAt: "05:30 PM" },
  { name: "Divya P.",  role: "Finance",      avatar: "DP", status: "clocked-in",  clockedAt: "09:15 AM" },
];

const STATUS_META: Record<EmployeeStatus, { bg: string; dot: string; label: string }> = {
  "clocked-in":  { bg: "#dcfce7", dot: "#16a34a", label: "Clocked In" },
  "on-leave":    { bg: "#fef9c3", dot: "#ca8a04", label: "On Leave"   },
  "clocked-out": { bg: "#f1f5f9", dot: "#94a3b8", label: "Clocked Out"},
};

const TOAST_QUEUE: Omit<LeaveToast, "id">[] = [
  { text: "✅  Leave approved — Arjun M. · 2 days",        type: "leave"   },
  { text: "💰  Payroll processed — ₹14.2L disbursed",       type: "payroll" },
  { text: "🔄  Shift swapped — Rohan K. ↔ Divya P.",        type: "shift"   },
  { text: "✅  Leave approved — Sneha R. · 1 day",          type: "leave"   },
];

function formatClock24(d: Date) {
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  const s = d.getSeconds().toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// ─── Live Dashboard Component ─────────────────────────────────────────────────
function LiveDashboard() {
  /** null until mount so SSR + first client paint match (avoids locale/time drift). */
  const [now, setNow] = useState<Date | null>(null);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [toast, setToast] = useState<LeaveToast | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const toastQueueRef = useRef(0);
  const toastIdRef = useRef(0);

  // Clock tick (first update deferred so SSR + hydration match; setState only in timers)
  useEffect(() => {
    const tick = () => setNow(new Date());
    const t0 = window.setTimeout(tick, 0);
    const t = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(t0);
      window.clearInterval(t);
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setHighlightIdx((prevIdx) => {
        const nextIdx = (prevIdx + 1) % INITIAL_EMPLOYEES.length;
        setEmployees((prevEmps) =>
          prevEmps.map((e, i) => {
            if (i !== nextIdx) return e;
            if (e.status === "on-leave") return e;
            const next: EmployeeStatus = e.status === "clocked-out" ? "clocked-in" : "clocked-out";
            const nowT = new Date();
            const hh = nowT.getHours().toString().padStart(2, "0");
            const mm = nowT.getMinutes().toString().padStart(2, "0");
            return { ...e, status: next, clockedAt: `${hh}:${mm}` };
          })
        );
        return nextIdx;
      });
    }, 1600);
    return () => clearInterval(t);
  }, []);

  // Toast queue
  useEffect(() => {
    const t = setInterval(() => {
      const item = TOAST_QUEUE[toastQueueRef.current % TOAST_QUEUE.length];
      toastQueueRef.current += 1;
      toastIdRef.current += 1;
      setToast({ ...item, id: toastIdRef.current });
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2800);
    }, 3600);
    return () => clearInterval(t);
  }, []);

  const toastColors: Record<LeaveToast["type"], string> = {
    leave:   "#dcfce7",
    payroll: "#dbeafe",
    shift:   "#f3e8ff",
  };
  const toastTextColors: Record<LeaveToast["type"], string> = {
    leave:   "#15803d",
    payroll: "#1d4ed8",
    shift:   "#7e22ce",
  };

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1.5px solid rgba(0,0,0,0.07)",
        borderRadius: 20,
        boxShadow: "0 20px 50px -12px rgba(79,127,255,0.12), 0 4px 16px rgba(0,0,0,0.04)",
        overflow: "hidden",
        width: "100%",
        maxWidth: "100%",
        maxHeight: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          background: "linear-gradient(90deg, #4F7FFF 0%, #7C3AED 100%)",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#a5f3fc",
              boxShadow: "0 0 0 3px rgba(165,243,252,0.3)",
              animation: "signupDashPulse 1.5s infinite",
              display: "inline-block",
            }}
          />
          <span style={{ color: "#fff", fontWeight: 600, fontSize: 13, letterSpacing: 0.2 }}>
            WorkforceOS · Live
          </span>
        </div>
        <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontVariantNumeric: "tabular-nums", letterSpacing: 1 }}>
          {now ? formatClock24(now) : "––:––:––"}
        </span>
      </div>

      {/* ── Stat row ── */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid #E8E5F0",
          flexShrink: 0,
        }}
      >
        {[
          { icon: "👥", value: "38", label: "Present", color: "#4F7FFF" },
          { icon: "🌴", value: "4", label: "On Leave", color: "#D97706" },
          { icon: "🗂️", value: "12", label: "Shifts Today", color: "#16A34A" },
        ].map((s, idx) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "12px 6px",
              borderRight: idx < 2 ? "1px solid #E8E5F0" : "none",
            }}
          >
            <div style={{ fontSize: 16 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500, marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Employee rows (scrolls so payroll + toast stay visible) ── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        {employees.map((emp, i) => {
          const meta = STATUS_META[emp.status];
          const active = i === highlightIdx;
          return (
            <div
              key={emp.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "9px 16px",
                background: active ? "#F5F3FF" : "transparent",
                borderLeft: active ? "3px solid #7C3AED" : "3px solid transparent",
                transition: "all 0.38s cubic-bezier(.4,0,.2,1)",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: active ? "linear-gradient(135deg,#4F7FFF,#7C3AED)" : "#E8E5F0",
                  color: active ? "#fff" : "#64748b",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  flexShrink: 0,
                  transition: "all 0.38s ease",
                  boxShadow: active ? "0 2px 8px rgba(79,127,255,0.35)" : "none",
                }}
              >
                {emp.avatar}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0F0F1A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {emp.name}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{emp.role}</div>
              </div>

              {/* Clock time */}
              <div style={{ fontSize: 11, color: "#94a3b8", fontVariantNumeric: "tabular-nums", marginRight: 8, flexShrink: 0 }}>
                {emp.clockedAt}
              </div>

              {/* Badge */}
              <div
                style={{
                  background: meta.bg,
                  borderRadius: 20,
                  padding: "3px 9px",
                  display: "flex", alignItems: "center", gap: 5,
                  flexShrink: 0,
                  transition: "background 0.38s ease",
                }}
              >
                <span
                  style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: meta.dot,
                    display: "inline-block",
                    animation: emp.status === "clocked-in" ? "signupDashPulse 1.5s infinite" : "none",
                  }}
                />
                <span style={{ fontSize: 11, fontWeight: 600, color: meta.dot, whiteSpace: "nowrap" }}>
                  {meta.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Payroll progress bar ── */}
      <div style={{ padding: "10px 16px 12px", borderTop: "1px solid #E8E5F0", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>Monthly Payroll</span>
          <span style={{ fontSize: 11, color: "#4F7FFF", fontWeight: 700 }}>₹14.2L / ₹18L</span>
        </div>
        <div style={{ background: "#E8E5F0", borderRadius: 99, height: 6, overflow: "hidden" }}>
          <div
            style={{
              width: "79%", height: "100%",
              background: "linear-gradient(90deg,#4F7FFF,#7C3AED)",
              borderRadius: 99,
              transition: "width 1.2s ease",
            }}
          />
        </div>
        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>Next disbursal in 6 days</div>
      </div>

      {/* Toast strip — in normal flow so parent scale/overflow-hidden cannot clip it */}
      <div
        style={{
          padding: "10px 12px 12px",
          borderTop: "1px solid #E8E5F0",
          background: "#fafafa",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 11,
            fontWeight: 600,
            lineHeight: 1.35,
            minHeight: 38,
            display: "flex",
            alignItems: "center",
            boxShadow: toastVisible ? "0 2px 10px rgba(0,0,0,0.06)" : "none",
            background:
              toastVisible && toast ? toastColors[toast.type] : "#eef0f3",
            color: toastVisible && toast ? toastTextColors[toast.type] : "#64748b",
            opacity: 1,
            transform: toastVisible ? "translateY(0)" : "translateY(0)",
            transition: "background 0.35s ease, color 0.35s ease, box-shadow 0.35s ease",
          }}
        >
          {toastVisible && toast ? toast.text : "Live updates from your workspace"}
        </div>
      </div>

      {/* ── Keyframe injection ── */}
      <style>{`
        @keyframes signupDashPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ orgName: "", email: "" });
  const [organizationCodePreview, setOrganizationCodePreview] = useState("");
  const [loadingOrganizationCode, setLoadingOrganizationCode] = useState(false);

  const fieldErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!form.orgName.trim()) errors.orgName = "Organization name is required";
    if (!form.email.trim()) errors.email = "Company admin email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = "Enter a valid email";
    return errors;
  }, [form.orgName, form.email]);

  const canSubmit =
    Object.keys(fieldErrors).length === 0 &&
    Boolean(organizationCodePreview) &&
    !loadingOrganizationCode &&
    !submitting;
  const showOrgError = Boolean(form.orgName.trim() && fieldErrors.orgName);
  const showEmailError = Boolean(form.email.trim() && fieldErrors.email);

  useEffect(() => {
    const organizationName = form.orgName.trim();
    if (organizationName.length < 2) {
      setOrganizationCodePreview("");
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoadingOrganizationCode(true);
      try {
        const response = await fetch(`${apiBaseUrl}/api/auth/organization-code-preview`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ organizationName }),
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok && typeof data?.organizationCode === "string") {
          setOrganizationCodePreview(data.organizationCode);
        }
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) setOrganizationCodePreview("");
      } finally {
        if (!controller.signal.aborted) setLoadingOrganizationCode(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [form.orgName]);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const organizationName = form.orgName.trim();
      const ownerEmail = form.email.trim().toLowerCase();
      const setupUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/complete-signup`
          : undefined;

      const response = await fetch(`${apiBaseUrl}/api/auth/signup`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          organizationName,
          ...(organizationCodePreview ? { organizationSlug: organizationCodePreview } : {}),
          ownerEmail,
          ownerDisplayName: ownerEmail,
          appLoginUrl: setupUrl,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorMessage(data?.error ?? "Signup failed. Please try again.");
        return;
      }

      const organizationCode = data?.organization?.slug;
      setSuccessMessage(
        organizationCode
          ? `Company workspace created. Organization code: ${organizationCode}`
          : data?.message ?? "Company workspace created. Check your email for the temporary password."
      );
      router.push(
        `/complete-signup?org=${encodeURIComponent(organizationCode ?? "")}&email=${encodeURIComponent(ownerEmail)}`
      );
    } catch {
      setErrorMessage("Network error while creating workspace.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (invalid: boolean) =>
    `w-full rounded-lg border-2 bg-[#FAFAFA] px-3 py-2 text-[13px] font-medium text-[#0F0F1A] outline-none transition placeholder:text-[#CACAD6] focus:bg-white focus:ring-[3px] focus:ring-[#7C3AED]/10 ${
      invalid
        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
        : "border-[#E8E5F0] focus:border-[#7C3AED]/50"
    }`;

  return (
    <div className="relative flex h-dvh max-h-dvh flex-col overflow-hidden bg-[#F7F5F0] text-[#0F0F1A]">
      {/* Marketing-style decorative background (matches landing) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -right-40 h-[700px] w-[700px] rounded-full bg-gradient-to-br from-[#D4E4FF] via-[#EDE9FE] to-transparent opacity-60" />
        <div className="absolute top-1/2 -left-32 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-[#FFF0D4] via-[#FFE4E4] to-transparent opacity-50" />
        <div className="absolute -bottom-20 right-1/4 h-[400px] w-[400px] rounded-full bg-gradient-to-tl from-[#D4FFE4] to-transparent opacity-40" />
      </div>

      <nav className="relative z-20 flex w-full shrink-0 items-center justify-between border-b border-black/[0.06] bg-[#F7F5F0]/85 px-4 py-2.5 backdrop-blur-sm sm:px-6 sm:py-3 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] shadow-lg shadow-blue-200">
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden>
              <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" fill="white" />
              <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" fill="white" opacity="0.65" />
              <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" fill="white" opacity="0.65" />
              <rect x="9" y="9" width="5.5" height="5.5" rx="1.5" fill="white" />
            </svg>
          </div>
          <span className="truncate text-[15px] font-bold tracking-[-0.02em] text-[#0F0F1A]">WorkforceOS</span>
        </Link>
        <div className="hidden items-center gap-8 text-[13.5px] font-medium text-[#6B6B80] md:flex">
          <Link href="/features" className="transition-colors hover:text-[#0F0F1A]">
            Features
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-[#0F0F1A]">
            Pricing
          </Link>
          <Link href="/contact" className="transition-colors hover:text-[#0F0F1A]">
            Contact
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-[13px] font-medium text-[#6B6B80] transition-colors hover:bg-black/5 hover:text-[#0F0F1A] sm:px-4"
          >
            Sign in
          </Link>
          <span className="rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] px-4 py-2 text-[13px] font-semibold text-white shadow-md shadow-blue-200">
            Get started →
          </span>
        </div>
      </nav>

      <div className="relative z-20 w-full shrink-0 border-b border-black/[0.06] bg-[#F7F5F0]/90 px-4 py-2 text-center backdrop-blur-sm sm:px-6 lg:px-8">
        <span className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#4F7FFF] sm:text-[11.5px]">
          <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[#4F7FFF]" />
          <span className="whitespace-normal sm:whitespace-nowrap">Free 14-day trial · No credit card</span>
        </span>
      </div>

      {/* Full-width split: no centered max-width gutter; columns hug viewport edges */}
      <div className="relative z-10 grid min-h-0 w-full flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_auto] overflow-x-hidden lg:grid-cols-2 lg:grid-rows-1">
        <section className="flex h-full min-h-0 max-h-full flex-col justify-start gap-2.5 overflow-x-hidden px-4 pb-3 pt-3 sm:gap-3 sm:px-6 sm:pb-4 sm:pt-3.5 lg:gap-4 lg:px-8 lg:pb-5 lg:pt-4 xl:pl-10 xl:pr-6">
          <div className="shrink-0">
            <h1 className="text-[22px] font-black leading-[1.1] tracking-[-0.04em] text-[#0F0F1A] sm:text-[28px] md:text-[32px] lg:text-[36px] xl:text-[40px]">
              Create your{" "}
              <span className="bg-gradient-to-r from-[#4F7FFF] via-[#7C3AED] to-[#EC4899] bg-clip-text text-transparent">
                company workspace
              </span>
            </h1>
            <p className="mt-1.5 max-w-xl text-[12px] leading-snug text-[#6B6B80] sm:mt-2 sm:text-[13px] sm:leading-relaxed lg:text-[14px]">
              One place for attendance, shifts, leave, and payroll. Set up your org in minutes—no credit card required.
            </p>
          </div>

          <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-medium leading-snug text-[#6B6B80] sm:text-[10px] md:gap-x-2.5 lg:flex-nowrap lg:gap-x-3 lg:text-[10.5px] xl:text-[11px]">
            {[
              "Multi-tenant HRMS built for growing teams",
              "Invite admins and employees after signup",
              "SOC 2-minded security and audit-ready logs",
            ].map((line, i, arr) => (
              <span key={line} className="inline-flex max-w-full shrink-0 items-center gap-1">
                <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-green-100 sm:h-3.5 sm:w-3.5">
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden>
                    <path
                      d="M2 5l1.8 1.8L8 3"
                      stroke="#16A34A"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="whitespace-nowrap">{line}</span>
                {i < arr.length - 1 ? (
                  <span className="pl-1 text-[#CACAD6] sm:pl-1.5" aria-hidden>
                    ·
                  </span>
                ) : null}
              </span>
            ))}
          </div>

          <div className="flex h-full min-h-0 w-full flex-1 flex-col justify-end overflow-visible pt-0.5">
            <div className="flex h-full min-h-0 w-full max-w-[440px] flex-col justify-end self-center origin-bottom scale-[0.68] sm:scale-[0.78] md:scale-[0.86] lg:max-w-none lg:scale-[0.94] xl:scale-100">
              <LiveDashboard />
            </div>
          </div>
        </section>

        <section className="flex min-h-0 shrink-0 flex-col justify-start overflow-hidden border-t border-black/[0.06] bg-white lg:h-full lg:min-h-0 lg:border-l lg:border-t-0 lg:justify-center lg:py-4">
          <div className="mx-auto w-full max-w-sm overflow-hidden px-4 pb-4 pt-4 sm:max-w-md sm:px-5 sm:pb-5 sm:pt-4 lg:max-w-[22rem] lg:px-6 xl:max-w-sm">
            <h2 className="text-lg font-black text-[#0F0F1A]">Get started</h2>
            <p className="mt-0.5 text-[12px] leading-relaxed text-[#9CA3AF] sm:text-[13px]">
              We&apos;ll email a temporary password to finish setup.
            </p>

            <form onSubmit={handleSignup} className="mt-5 space-y-3.5 sm:mt-6 sm:space-y-4">
              <div>
                <label className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF] sm:text-[11px]">
                  Organization name
                </label>
                <input
                  name="orgName"
                  autoComplete="organization"
                  value={form.orgName}
                  onChange={(e) => setForm((prev) => ({ ...prev, orgName: e.target.value }))}
                  placeholder="Acme Pvt Ltd"
                  className={inputClass(showOrgError)}
                />
                {showOrgError ? (
                  <p className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-red-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {fieldErrors.orgName}
                  </p>
                ) : null}
                {form.orgName.trim() ? (
                  <p
                    className="mt-2 select-none text-[11px] leading-relaxed text-[#6B6B80] sm:text-[12px]"
                    onCopy={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    Organization code preview:{" "}
                    <span className="font-mono font-semibold tracking-wide text-[#0F0F1A]">
                      {loadingOrganizationCode ? "Generating..." : organizationCodePreview || "Generating..."}
                    </span>
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF] sm:text-[11px]">
                  Company email
                </label>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@company.com"
                  className={inputClass(showEmailError)}
                />
                {showEmailError ? (
                  <p className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-red-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>

              {errorMessage ? (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                  <p className="text-[12px] leading-relaxed text-red-700">{errorMessage}</p>
                </div>
              ) : null}
              {successMessage ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[12px] text-emerald-800">
                  {successMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={!canSubmit}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold shadow-md transition-all sm:text-[14px] ${
                  canSubmit
                    ? "bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] text-white shadow-violet-200/80 hover:shadow-lg active:translate-y-px"
                    : "cursor-not-allowed bg-[#F0F0F4] text-[#BABAC8]"
                }`}
              >
                {submitting ? "Creating workspace…" : "Create company workspace"}
                {!submitting && canSubmit ? (
                  <svg width="14" height="14" fill="none" viewBox="0 0 16 16" className="opacity-90" aria-hidden>
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </button>

              <p className="text-center text-[11px] leading-relaxed text-[#CACAD6] sm:text-[12px]">
                By signing up you agree to our{" "}
                <Link href="/terms" className="font-medium text-[#6B6B80] underline-offset-2 hover:text-[#0F0F1A]">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-medium text-[#6B6B80] underline-offset-2 hover:text-[#0F0F1A]">
                  Privacy Policy
                </Link>
                .
              </p>
            </form>

            <p className="mt-4 text-center text-[12px] text-[#6B6B80] sm:mt-5 sm:text-[13px]">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-[#4F7FFF] hover:text-[#7C3AED]">
                Sign in
              </Link>
            </p>

            <div className="mt-4 grid w-full grid-cols-3 gap-1.5 border-t border-[#E8E5F0] pt-4 sm:mt-5 sm:gap-2">
              {["No credit card", "14-day trial", "Cancel anytime"].map((item) => (
                <div
                  key={item}
                  className="flex min-w-0 flex-nowrap items-center justify-center gap-1 rounded-xl border border-[#E8E5F0] bg-[#FAFAFA] px-1 py-2 text-center sm:gap-1.5 sm:px-2 sm:py-2.5"
                >
                  <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-green-100 sm:h-4 sm:w-4">
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden>
                      <path
                        d="M2 5l1.8 1.8L8 3"
                        stroke="#16A34A"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="min-w-0 truncate text-[9px] font-semibold leading-tight text-[#6B6B80] sm:text-[10.5px]">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
