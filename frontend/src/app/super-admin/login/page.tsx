"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { apiBaseUrl } from "@/services/http";
import { getPlatformAdminToken, setPlatformAdminToken } from "@/services/super-admin-http";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getPlatformAdminToken()) router.replace("/super-admin");
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/super-admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Login failed");
        return;
      }
      if (data.accessToken) setPlatformAdminToken(data.accessToken);
      router.replace("/super-admin");
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-[#F7F5F0] px-4 text-[#0F0F1A]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -right-40 h-[700px] w-[700px] rounded-full bg-gradient-to-br from-[#D4E4FF] via-[#EDE9FE] to-transparent opacity-60" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#E8E5F0] bg-white p-8 shadow-xl shadow-black/[0.06]">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] text-white shadow-lg shadow-blue-200">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-[20px] font-black tracking-[-0.02em]">Super Admin</h1>
            <p className="text-[12px] font-medium text-[#6B6B80]">Platform control center</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold text-[#475467]">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-lg border-2 border-[#E8E5F0] bg-[#FAFAFA] px-3 text-[14px] outline-none focus:border-[#4F7FFF] focus:bg-white focus:ring-2 focus:ring-[#4F7FFF]/10"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold text-[#475467]">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-lg border-2 border-[#E8E5F0] bg-[#FAFAFA] px-3 text-[14px] outline-none focus:border-[#4F7FFF] focus:bg-white focus:ring-2 focus:ring-[#4F7FFF]/10"
              required
            />
          </label>
          {error ? <p className="text-[13px] font-medium text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] text-[14px] font-black text-white shadow-md shadow-[#4F7FFF]/25 disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-[12px] text-[#6B6B80]">
          <Link href="/login" className="font-semibold text-[#4F7FFF] hover:underline">
            Organization login
          </Link>
        </p>
      </div>
    </div>
  );
}
