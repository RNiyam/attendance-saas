"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiBaseUrl } from "@/services/http";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SmtpPublic = {
  configured: boolean;
  host: string | null;
  port: number | null;
  secure: boolean | null;
  username: string | null;
  fromEmail: string | null;
  fromName: string | null;
  isActive: boolean | null;
  hasPassword: boolean;
};

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (token) (h as Record<string, string>).Authorization = `Bearer ${token}`;
  return h;
}

export default function OrganizationSmtpSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publicCfg, setPublicCfg] = useState<SmtpPublic | null>(null);

  const [host, setHost] = useState("");
  const [port, setPort] = useState("587");
  const [secure, setSecure] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [testTo, setTestTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/settings/smtp`, { headers: authHeaders() });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as SmtpPublic;
      setPublicCfg(data);
      if (data.configured) {
        setHost(data.host ?? "");
        setPort(String(data.port ?? 587));
        setSecure(Boolean(data.secure));
        setUsername(data.username ?? "");
        setFromEmail(data.fromEmail ?? "");
        setFromName(data.fromName ?? "");
        setIsActive(Boolean(data.isActive));
        setPassword("");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/settings/smtp`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          host,
          port: Number(port),
          secure,
          username,
          password: password.trim() || undefined,
          fromEmail,
          fromName,
          isActive,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      setMessage("SMTP settings saved.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function testInline() {
    setMessage(null);
    setError(null);
    try {
      if (!password.trim()) {
        setError("Enter the SMTP password to run an inline test (or save first and use “Test saved”).");
        return;
      }
      const res = await fetch(`${apiBaseUrl}/api/settings/smtp/test`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          mode: "inline",
          host,
          port: Number(port),
          secure,
          username,
          password,
          fromEmail,
          fromName,
          testRecipientEmail: testTo.trim() || undefined,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      setMessage(j.message ?? "OK");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Test failed");
    }
  }

  async function testSaved() {
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/settings/smtp/test`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          mode: "saved",
          testRecipientEmail: testTo.trim() || undefined,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      setMessage(j.message ?? "OK");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Test failed");
    }
  }

  async function toggleActive(next: boolean) {
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/settings/smtp`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ isActive: next }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      setIsActive(next);
      setMessage(next ? "Organization SMTP enabled." : "Organization SMTP disabled; platform email will be used.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/dashboard/settings" className="text-sm text-slate-600 hover:underline">
          ← Settings
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Organization email (SMTP)</h1>
        <p className="mt-1 text-sm text-slate-600">
          When enabled, outbound mail for this workspace uses your server instead of the platform default. Requires the{" "}
          <code className="rounded bg-slate-100 px-1">MANAGE_INTEGRATIONS</code> permission (owner / HR).
        </p>
      </div>

      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
      {message ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</p> : null}

      <Card className="space-y-4 p-6">
        {loading ? (
          <p className="text-sm text-slate-600">Loading…</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium">SMTP host</label>
                <Input value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.office365.com" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Port</label>
                <Input value={port} onChange={(e) => setPort(e.target.value)} />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <input id="secure" type="checkbox" checked={secure} onChange={(e) => setSecure(e.target.checked)} />
                <label htmlFor="secure" className="text-sm">
                  TLS / SSL (secure)
                </label>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium">Username</label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={publicCfg?.hasPassword ? "Leave blank to keep existing" : "Required on first save"}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium">From email</label>
                <Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} type="email" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium">From name</label>
                <Input value={fromName} onChange={(e) => setFromName(e.target.value)} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium">Optional test recipient</label>
                <Input value={testTo} onChange={(e) => setTestTo(e.target.value)} type="email" placeholder="you@company.com" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => void save()} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={() => void testInline()}>
                Test connection (form values)
              </Button>
              {publicCfg?.configured ? (
                <Button type="button" variant="outline" onClick={() => void testSaved()}>
                  Test saved SMTP
                </Button>
              ) : null}
            </div>

            {publicCfg?.configured ? (
              <div className="border-t pt-4">
                <p className="mb-2 text-sm font-medium">Organization SMTP is {isActive ? "active" : "inactive"}</p>
                <Button type="button" variant="outline" size="sm" onClick={() => void toggleActive(!isActive)}>
                  {isActive ? "Disable (use platform SMTP)" : "Enable organization SMTP"}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}
