"use client";

import { AlertCircle, ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { apiBaseUrl } from "@/services/http";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [organizationSlug, setOrganizationSlug] = useState("");
  const [showOrgCode, setShowOrgCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const inputClass =
    "w-full rounded-xl border-2 border-[#E8E5F0] bg-[#FAFAFA] py-3 pl-11 pr-4 text-[14px] font-medium text-[#0F0F1A] outline-none transition placeholder:text-[#CACAD6] focus:border-[#7C3AED]/50 focus:bg-white focus:ring-[3px] focus:ring-[#7C3AED]/10";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const normalizedEmail = email.trim().toLowerCase();
    const body: { email: string; organizationSlug?: string } = { email: normalizedEmail };
    if (showOrgCode && organizationSlug.trim()) {
      body.organizationSlug = organizationSlug.trim().toUpperCase();
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 409) {
        setShowOrgCode(true);
        setErrorMessage(
          data?.error ??
            "This email is linked to more than one workspace. Enter your organization code below.",
        );
        return;
      }

      if (!response.ok) {
        setErrorMessage(data?.error ?? "Could not send reset link. Please try again.");
        return;
      }

      setSuccessMessage(
        data?.message ?? "If an account exists for that email, you will receive a password reset link shortly.",
      );
    } catch {
      setErrorMessage("Network error while requesting password reset.");
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
          <h1 className="text-[28px] font-black tracking-[-0.03em] text-[#0F0F1A] sm:text-[32px]">Forgot password</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#6B6B80]">
            Enter your work email and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {successMessage ? (
          <div className="space-y-6">
            <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden />
              <p className="text-[14px] leading-relaxed text-green-800">{successMessage}</p>
            </div>
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] py-3.5 text-[14px] font-bold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
            >
              Return to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]"
              >
                Work email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className={inputClass}
                />
              </div>
            </div>

            {showOrgCode ? (
              <div>
                <label
                  htmlFor="organizationSlug"
                  className="mb-2 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]"
                >
                  Organization code
                </label>
                <input
                  id="organizationSlug"
                  name="organizationSlug"
                  type="text"
                  required
                  value={organizationSlug}
                  onChange={(e) => setOrganizationSlug(e.target.value.toUpperCase())}
                  placeholder="ABCD1234"
                  className="w-full rounded-xl border-2 border-[#E8E5F0] bg-[#FAFAFA] px-4 py-3 text-[14px] font-medium uppercase tracking-wider text-[#0F0F1A] outline-none transition placeholder:text-[#CACAD6] focus:border-[#7C3AED]/50 focus:bg-white focus:ring-[3px] focus:ring-[#7C3AED]/10"
                />
              </div>
            ) : null}

            {errorMessage ? (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
                <p className="text-[13px] leading-relaxed text-red-700">{errorMessage}</p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] py-3.5 text-[14px] font-bold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-300 disabled:translate-y-0 disabled:opacity-70"
            >
              {submitting ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
