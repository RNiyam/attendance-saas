"use client";

import { Check, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { Suspense, useMemo, useState } from "react";
import { apiBaseUrl } from "@/services/http";

function ActivateEmployeeContent() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checks = useMemo(
    () => ({
      min8: password.length >= 8,
      upper: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }),
    [password],
  );
  const canSubmit = token && Object.values(checks).every(Boolean) && !submitting;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/employees/activate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof body.error === "string" ? body.error : "Could not activate invite.");
        return;
      }
      setDone(true);
      window.setTimeout(() => router.push("/login"), 1200);
    } catch {
      setError("Network error while activating invite.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F5F0] px-4 text-[#0F0F1A]">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-[#E8E5F0] bg-white p-6 shadow-xl shadow-black/[0.06]">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#4F7FFF]">Employee Invite</p>
        <h1 className="mt-1 text-[26px] font-black tracking-[-0.03em]">Set your password</h1>
        <p className="mt-2 text-[13px] font-medium leading-relaxed text-[#6B6B80]">
          Create your login password to activate your employee account.
        </p>

        <label className="mt-6 block">
          <span className="mb-1.5 block text-[12px] font-black uppercase tracking-wide text-[#6B6B80]">Password</span>
          <span className="relative block">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 w-full rounded-xl border border-[#E8E5F0] bg-white px-4 pr-11 text-[14px] font-medium outline-none transition focus:border-[#4F7FFF] focus:ring-2 focus:ring-[#4F7FFF]/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-[#F8FAFC]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
        </label>

        <div className="mt-4 grid grid-cols-2 gap-2 text-[12px] font-semibold text-[#6B6B80]">
          {[
            [checks.min8, "8 characters"],
            [checks.upper, "Uppercase"],
            [checks.number, "Number"],
            [checks.special, "Special character"],
          ].map(([ok, label]) => (
            <span key={String(label)} className={ok ? "text-emerald-600" : ""}>
              {ok ? "✓ " : ""}{label}
            </span>
          ))}
        </div>

        {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-600">{error}</p> : null}
        {done ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-[12px] font-semibold text-emerald-600">Account activated. Redirecting to login...</p> : null}

        <button
          type="submit"
          disabled={!canSubmit || done}
          className={`mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-black text-white transition ${
            canSubmit && !done ? "bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] shadow-lg shadow-[#4F7FFF]/20" : "bg-[#E8E5F0] text-[#9CA3AF]"
          }`}
        >
          {done ? <Check className="h-4 w-4" /> : null}
          Activate Account
        </button>
        <Link href="/login" className="mt-4 block text-center text-[13px] font-bold text-[#6B6B80] hover:text-[#0F0F1A]">
          Back to login
        </Link>
      </form>
    </main>
  );
}

export default function ActivateEmployeePage() {
  return (
    <Suspense fallback={null}>
      <ActivateEmployeeContent />
    </Suspense>
  );
}
