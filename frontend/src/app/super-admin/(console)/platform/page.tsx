"use client";

import { useState } from "react";
import { platformAdminFetch } from "@/services/super-admin-http";

type Status = {
  smtpConfigured: boolean;
  smtpHostHint: string | null;
  smtpFromConfigured: boolean;
  redisConfigured: boolean;
  orgSmtpEncryptionConfigured: boolean;
};

export default function SuperAdminPlatformPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadStatus() {
    setError(null);
    setVerifyMsg(null);
    setLoading(true);
    try {
      const res = await platformAdminFetch("/api/super-admin/platform/smtp-status");
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      setStatus(j as Status);
    } catch (e) {
      setStatus(null);
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function verifyPlatformSmtp() {
    setError(null);
    setVerifyMsg(null);
    setLoading(true);
    try {
      const res = await platformAdminFetch("/api/super-admin/platform/smtp-verify", { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      setVerifyMsg(j.message ?? "Verified");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verify failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#4F7FFF]">Platform</p>
      <h1 className="mt-1 text-[24px] font-black tracking-[-0.02em]">Platform settings</h1>
      <p className="mt-2 text-[14px] font-medium text-[#6B6B80]">
        SMTP and infrastructure flags are configured in server environment variables.
      </p>

      <div className="mt-6 rounded-2xl border border-[#E8E5F0] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadStatus()}
            disabled={loading}
            className="h-10 rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] px-5 text-[13px] font-black text-white shadow-md disabled:opacity-60"
          >
            Load status
          </button>
          <button
            type="button"
            onClick={() => void verifyPlatformSmtp()}
            disabled={loading}
            className="h-10 rounded-xl border-2 border-[#E8E5F0] bg-white px-5 text-[13px] font-bold text-[#4F7FFF]"
          >
            Verify SMTP
          </button>
        </div>

        {error ? <p className="mt-4 text-[13px] font-medium text-red-600">{error}</p> : null}
        {verifyMsg ? <p className="mt-4 text-[13px] font-medium text-emerald-600">{verifyMsg}</p> : null}

        {status ? (
          <ul className="mt-6 space-y-2 text-[13px] font-medium text-[#344054]">
            <li>Platform SMTP configured: {status.smtpConfigured ? "Yes" : "No"}</li>
            <li>SMTP host: {status.smtpHostHint ?? "—"}</li>
            <li>SMTP From set: {status.smtpFromConfigured ? "Yes" : "No"}</li>
            <li>Redis URL set: {status.redisConfigured ? "Yes" : "No"}</li>
            <li>Org SMTP encryption key: {status.orgSmtpEncryptionConfigured ? "Ready" : "Missing"}</li>
          </ul>
        ) : null}
      </div>
    </div>
  );
}
