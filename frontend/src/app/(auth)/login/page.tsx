"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppForm } from "@/components/forms/app-form";
import { apiBaseUrl } from "@/services/http";

function normalizeOrganizationCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export default function LoginPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (values: Record<string, string>) => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const organizationSlug = normalizeOrganizationCode(values.organizationSlug ?? "");
      const email = values.email?.trim().toLowerCase() ?? "";
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          organizationSlug,
          email,
          password: values.password,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorMessage(data?.error ?? "Login failed. Please check your details.");
        return;
      }
      if (data?.requiresPasswordChange) {
        router.push(`/complete-signup?org=${encodeURIComponent(organizationSlug)}&email=${encodeURIComponent(email)}`);
        return;
      }
      if (data?.accessToken) localStorage.setItem("accessToken", data.accessToken);
      if (data?.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
      if (data?.organization?.slug) localStorage.setItem("organizationCode", data.organization.slug);
      router.push("/onboarding");
    } catch {
      setErrorMessage("Network error while signing in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Login</h1>
      <AppForm
        title="Sign in to company workspace"
        submitLabel="Login"
        submitting={submitting}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
        fields={[
          { name: "organizationSlug", label: "Organization Code", type: "text", placeholder: "ACME1234" },
          { name: "email", label: "Email", type: "email", placeholder: "admin@company.com" },
          { name: "password", label: "Password", type: "password", placeholder: "********" },
        ]}
      />
      <div className="flex justify-between text-sm text-slate-600">
        <Link href="/forgot-password">Forgot password?</Link>
        <Link href="/signup">Create account</Link>
      </div>
    </section>
  );
}
