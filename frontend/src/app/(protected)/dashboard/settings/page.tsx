import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Organization Settings</h2>
          <p className="mt-2 text-sm text-slate-600">Timezone, policies, attendance rules, payroll preferences.</p>
        </Card>
        <Card>
          <h2 className="font-semibold">Access & Security</h2>
          <p className="mt-2 text-sm text-slate-600">Roles, permissions, API keys, integrations, and audit controls.</p>
        </Card>
        <Card className="md:col-span-2">
          <h2 className="font-semibold">Email (SMTP)</h2>
          <p className="mt-2 text-sm text-slate-600">
            Send invites and notifications from your company mail server when configured; otherwise the platform default is used.
          </p>
          <Link
            href="/dashboard/settings/smtp"
            className="mt-3 inline-block text-sm font-medium text-slate-900 underline underline-offset-4 hover:text-slate-700"
          >
            Configure organization SMTP →
          </Link>
        </Card>
      </div>
    </div>
  );
}
