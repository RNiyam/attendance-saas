"use client";

import { AlertCircle, Check, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { apiBaseUrl } from "@/services/http";

function CompleteSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasOrganizationSlugFromUrl = useMemo(
    () => Boolean((searchParams.get("org") ?? "").trim()),
    [searchParams]
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTemporaryPassword, setShowTemporaryPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [form, setForm] = useState({
    organizationSlug: searchParams.get("org") ?? "",
    email: searchParams.get("email") ?? "",
    temporaryPassword: "",
    newPassword: "",
  });

  const passwordChecks = useMemo(() => {
    const password = form.newPassword;
    const upper = /[A-Z]/.test(password);
    const number = /[0-9]/.test(password);
    const special = /[^A-Za-z0-9]/.test(password);
    return {
      min8: password.length >= 8,
      upper,
      number,
      special,
    };
  }, [form.newPassword]);

  const canSubmit =
    form.organizationSlug.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.temporaryPassword &&
    passwordChecks.min8 &&
    passwordChecks.upper &&
    passwordChecks.number &&
    passwordChecks.special &&
    form.newPassword !== form.temporaryPassword &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/complete-password-setup`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          organizationSlug: form.organizationSlug.trim().toUpperCase(),
          email: form.email.trim().toLowerCase(),
          temporaryPassword: form.temporaryPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorMessage(data?.error ?? "Could not complete password setup.");
        return;
      }
      if (data?.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        // Clear any stale setup progress from a previous user's session
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith("setup:")) {
            localStorage.removeItem(key);
            i--; // Adjust index since we removed an item
          }
        }
      }
      if (data?.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
      if (data?.organization?.slug) localStorage.setItem("organizationCode", data.organization.slug);
      router.push("/onboarding");
    } catch {
      setErrorMessage("Network error while setting password.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "h-11 w-full rounded-lg border-2 border-[#E8E5F0] bg-[#FAFAFA] px-3.5 text-[13px] font-medium text-[#0F0F1A] outline-none transition placeholder:text-[#CACAD6] focus:border-[#7C3AED]/50 focus:bg-white focus:ring-[3px] focus:ring-[#7C3AED]/10";

  return (
    <div className="relative flex min-h-dvh flex-col bg-[#F7F5F0] text-[#0F0F1A]">
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
          <Link
            href="/signup"
            className="rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] px-4 py-2 text-[13px] font-semibold text-white shadow-md shadow-blue-200 transition-opacity hover:opacity-[0.97]"
          >
            Get started →
          </Link>
        </div>
      </nav>

      <div className="relative z-20 w-full shrink-0 border-b border-black/[0.06] bg-[#F7F5F0]/90 px-4 py-2 text-center backdrop-blur-sm sm:px-6 lg:px-8">
        <span className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#4F7FFF] sm:text-[11.5px]">
          <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[#4F7FFF]" />
          <span className="whitespace-normal sm:whitespace-nowrap">Finish your workspace · Set your password</span>
        </span>
      </div>

      <main className="relative z-10 mx-auto w-full max-w-lg flex-1 px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
        <Link
          href="/signup"
          className="mb-6 inline-flex items-center gap-1 text-[13px] font-medium text-[#6B6B80] transition-colors hover:text-[#0F0F1A]"
        >
          <span aria-hidden>←</span> Back to signup
        </Link>

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-black tracking-[-0.03em] text-[#0F0F1A] sm:text-3xl">
              Complete{" "}
              <span className="bg-gradient-to-r from-[#4F7FFF] via-[#7C3AED] to-[#EC4899] bg-clip-text text-transparent">
                company account
              </span>{" "}
              setup
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-[#6B6B80] sm:text-sm">
              Use the temporary password from your email, then create your own password for the company workspace.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            className="space-y-5 rounded-2xl border border-[#E8E5F0] bg-white p-6 shadow-lg shadow-black/[0.04] sm:p-8"
          >
            {[
              {
                name: "organizationSlug",
                label: "Organization Code",
                type: "text",
                placeholder: "ACME1234",
                autoComplete: "organization",
              },
              {
                name: "email",
                label: "Company Email",
                type: "email",
                placeholder: "admin@company.com",
                autoComplete: "username",
              },
              {
                name: "temporaryPassword",
                label: "Temporary Password",
                type: "password",
                placeholder: "From your email",
                autoComplete: "one-time-code",
              },
              {
                name: "newPassword",
                label: "New Password",
                type: "password",
                placeholder: "Create a strong password",
                autoComplete: "new-password",
              },
            ]
              .filter((field) => !(field.name === "organizationSlug" && hasOrganizationSlugFromUrl))
              .map((field) => (
              <label key={field.name} className="block">
                <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                  {field.label}
                </span>
                {field.name === "temporaryPassword" || field.name === "newPassword" ? (
                  <div className="relative">
                    <input
                      name={field.name}
                      type={
                        field.name === "temporaryPassword" && showTemporaryPassword
                          ? "text"
                          : field.name === "newPassword" && showNewPassword
                            ? "text"
                            : field.type
                      }
                      value={form[field.name as keyof typeof form]}
                      onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                      placeholder={field.placeholder}
                      autoComplete={field.autoComplete}
                      data-1p-ignore={field.name === "temporaryPassword" ? "true" : undefined}
                      data-bwignore={field.name === "temporaryPassword" ? "true" : undefined}
                      data-lpignore={field.name === "temporaryPassword" ? "true" : undefined}
                      className={`${inputClass} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        field.name === "temporaryPassword"
                          ? setShowTemporaryPassword((visible) => !visible)
                          : setShowNewPassword((visible) => !visible)
                      }
                      className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[#9CA3AF] transition hover:bg-black/5 hover:text-[#0F0F1A]"
                      aria-label={
                        field.name === "temporaryPassword"
                          ? showTemporaryPassword
                            ? "Hide temporary password"
                            : "Show temporary password"
                          : showNewPassword
                            ? "Hide new password"
                            : "Show new password"
                      }
                    >
                      {(field.name === "temporaryPassword" ? showTemporaryPassword : showNewPassword) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ) : (
                  <input
                    name={field.name}
                    type={field.type}
                    value={form[field.name as keyof typeof form]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    className={inputClass}
                  />
                )}
              </label>
            ))}

            {form.newPassword ? (
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

            {errorMessage ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200/90 bg-red-50/95 px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-sm font-medium text-red-800">{errorMessage}</p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              className={`flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition ${
                canSubmit
                  ? "bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] text-white shadow-lg shadow-[#4F7FFF]/25 hover:opacity-[0.97]"
                  : "cursor-not-allowed bg-[#E8E5F0] text-[#CACAD6]"
              }`}
            >
              {submitting ? "Completing setup..." : "Complete Setup"}
            </button>
          </form>

          <p className="text-center text-[13px] text-[#6B6B80]">
            Already set your password?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#4F7FFF] underline-offset-2 hover:text-[#7C3AED] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function CompleteSignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#F7F5F0] text-[#6B6B80]">Loading…</div>
      }
    >
      <CompleteSignupContent />
    </Suspense>
  );
}
