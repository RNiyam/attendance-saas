"use client";

import { useEffect, useState } from "react";
import { platformAdminFetch } from "@/services/super-admin-http";

type Org = {
  id: number;
  name: string;
  slug: string;
  legalName: string | null;
  email: string | null;
};

export default function SuperAdminOrganizationsPage() {
  const [rows, setRows] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void platformAdminFetch("/api/super-admin/organizations")
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#4F7FFF]">Tenants</p>
      <h1 className="mt-1 text-[24px] font-black tracking-[-0.02em]">Organizations</h1>
      <p className="mt-2 text-[14px] font-medium text-[#6B6B80]">All workspaces registered on the platform.</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[#E8E5F0] bg-white shadow-sm">
        {loading ? (
          <p className="p-8 text-[13px] text-[#6B6B80]">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-[13px] text-[#6B6B80]">No organizations yet.</p>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-[#E8E5F0] bg-[#FAFAFA] text-[11px] font-bold uppercase tracking-wide text-[#6B6B80]">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Legal name</th>
                <th className="px-5 py-3">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EEF8]">
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-[#FAFAFA]">
                  <td className="px-5 py-3.5 font-bold text-[#0F0F1A]">{o.name}</td>
                  <td className="px-5 py-3.5 font-mono text-[12px] text-[#4F7FFF]">{o.slug}</td>
                  <td className="px-5 py-3.5 text-[#344054]">{o.legalName ?? "—"}</td>
                  <td className="px-5 py-3.5 text-[#344054]">{o.email ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
