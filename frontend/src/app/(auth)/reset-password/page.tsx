"use client";

import { AlertCircle, ArrowLeft, Check, Eye, EyeOff, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { apiBaseUrl } from "@/services/http";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") ?? "").trim();

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const passwordChecks = useMemo(() => {
    const password = newPassword;
    const lower = /[a-z]/.test(password);
    const upper = /[A-Z]/.test(password);
    const number = /[0-9]/.test(password);
    const special = /[^A-Za-z0-9]/.test(password);
    const variety = [lower, upper, number, special].filter(Boolean).length;
    return {
      min8: password.length >= 8,
      variety: variety >= 3,
      upper,
      number,
      special,
    };
  }, [newPassword]);

  const canSubmit =
    tokenValid &&
    passwordChecks.min8 &&
    passwordChecks.variety &&
    newPassword === confirmPassword &&
    !submitting;

  useEffect(() => {
    if (!token) {
      setValidating(false);
      setTokenValid(false);
      setErrorMessage("This password reset link is invalid or has expired.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`,
        );
        const data = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (!response.ok) {
          setTokenValid(false);
          setErrorMessage(data?.error ?? "This password reset link is invalid or has expired.");
          return;
        }
        setTokenValid(true);
        setAccountEmail(typeof data?.email === "string" ? data.email : null);
      } catch {
        if (!cancelled) {
          setErrorMessage("Network error while validating reset link.");
        }
      } finally {
        if (!cancelled) setValidating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const inputClass =
    "w-full rounded-xl border-2 border-[#E8E5F0] bg-[#FAFAFA] py-3 pl-11 pr-11 text-[14px] font-medium text-[#0F0F1A] outline-none transition placeholder:text-[#CACAD6] focus:border-[#7C3AED]/50 focus:bg-white focus:ring-[3px] focus:ring-[#7C3AED]/10";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorMessage(data?.error ?? "Could not reset password. Please try again.");
        return;
      }
      setSuccessMessage(data?.message ?? "Password updated successfully. You can sign in with your new password.");
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setErrorMessage("Network error while resetting password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-8 lg:px-14">
      <div className="mx-auto w-full max-w-[400px]">
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6B6B80] transition-colors hover:text-[#0F0F1A]"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Back to sign in
        </Link>

        <div className="mb-8">
          <h1 className="text-[28px] font-black tracking-[-0.03em] text-[#0F0F1A] sm:text-[32px]">Reset password</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#6B6B80]">
            {accountEmail
              ? `Choose a new password for ${accountEmail}.`
              : "Choose a strong new password for your account."}
          </p>
        </div>

        {validating ? (
          <p className="text-[14px] text-[#6B6B80]">Validating reset link…</p>
        ) : successMessage ? (
          <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-4">
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden />
            <p className="text-[14px] leading-relaxed text-green-800">{successMessage}</p>
          </div>
        ) : !tokenValid ? (
          <div className="space-y-5">
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
              <p className="text-[13px] leading-relaxed text-red-700">
                {errorMessage ?? "This password reset link is invalid or has expired."}
              </p>
            </div>
            <Link
              href="/forgot-password"
              className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] py-3.5 text-[14px] font-bold text-white shadow-lg shadow-blue-200"
            >
              Request a new link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="newPassword"
                className="mb-2 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]"
              >
                New password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#9CA3AF] transition-colors hover:bg-[#F0F0F5] hover:text-[#6B6B80]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]"
              >
                Confirm password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className={inputClass}
                />
              </div>
            </div>

            {newPassword ? (
              <div className="space-y-2 rounded-xl border border-[#E8E5F0] bg-[#FAFAFA] p-3.5 text-xs">
                <p className="font-bold text-[#0F0F1A]">Password must contain:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {[
                    { label: "At least 8 characters", met: passwordChecks.min8 },
                    { label: "At least one capital letter", met: passwordChecks.upper },
                    { label: "At least one number", met: passwordChecks.number },
                    { label: "At least one special character", met: passwordChecks.special },
                  ].map(({ label, met }) => (
                    <div
                      key={label}
                      className={
                        met
                          ? "flex items-center gap-2 font-medium text-[#15803d]"
                          : "flex items-center gap-2 font-medium text-[#C2410C]"
                      }
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                          met ? "bg-green-100 text-[#16A34A]" : "bg-orange-100 text-[#EA580C]"
                        }`}
                      >
                        {met ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                      </span>
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {confirmPassword && newPassword !== confirmPassword ? (
              <p className="text-[13px] text-red-600">Passwords do not match.</p>
            ) : null}

            {errorMessage ? (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
                <p className="text-[13px] leading-relaxed text-red-700">{errorMessage}</p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] py-3.5 text-[14px] font-bold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-300 disabled:translate-y-0 disabled:opacity-70"
            >
              {submitting ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="px-4 py-10 text-[14px] text-[#6B6B80]">Loading…</p>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
