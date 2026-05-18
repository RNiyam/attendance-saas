"use client";

import { useCallback, useEffect, useState } from "react";
import { platformAdminFetch } from "@/services/super-admin-http";

type Tab =
  | "shift-types"
  | "states"
  | "cities"
  | "sectors"
  | "sub-sectors"
  | "enums"
  | "permissions";

const TABS: { id: Tab; label: string }[] = [
  { id: "shift-types", label: "Shift types" },
  { id: "states", label: "States" },
  { id: "cities", label: "Cities" },
  { id: "sectors", label: "Sectors" },
  { id: "sub-sectors", label: "Sub-sectors" },
  { id: "enums", label: "Enums" },
  { id: "permissions", label: "Permissions" },
];

const inputCls =
  "h-9 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-[13px] outline-none focus:border-[#4F7FFF] focus:ring-2 focus:ring-[#4F7FFF]/10";

export function MastersPanel({ initialTab }: { initialTab: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [states, setStates] = useState<{ id: number; code: string; name: string }[]>([]);
  const [sectors, setSectors] = useState<{ id: number; code: string; name: string }[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let path = "";
      if (tab === "shift-types") path = "/api/super-admin/masters/shift-types";
      else if (tab === "states") path = "/api/super-admin/masters/states";
      else if (tab === "cities") {
        path = stateFilter
          ? `/api/super-admin/masters/cities?stateId=${stateFilter}`
          : "/api/super-admin/masters/cities";
      } else if (tab === "sectors") path = "/api/super-admin/masters/sectors";
      else if (tab === "sub-sectors") {
        path = sectorFilter
          ? `/api/super-admin/masters/sub-sectors?sectorId=${sectorFilter}`
          : "/api/super-admin/masters/sub-sectors";
      } else if (tab === "enums") path = "/api/super-admin/masters/enums";
      else if (tab === "permissions") path = "/api/super-admin/masters/permissions";

      const res = await platformAdminFetch(path);
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Load failed");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [tab, stateFilter, sectorFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void platformAdminFetch("/api/super-admin/masters/states")
      .then((r) => r.json())
      .then((d) => setStates(Array.isArray(d) ? d : []));
    void platformAdminFetch("/api/super-admin/masters/sectors")
      .then((r) => r.json())
      .then((d) => setSectors(Array.isArray(d) ? d : []));
  }, []);

  const create = async () => {
    setError(null);
    let path = "";
    let body: Record<string, unknown> = {};
    if (tab === "shift-types") {
      path = "/api/super-admin/masters/shift-types";
      body = { code: form.code, label: form.label, description: form.description || undefined, sortOrder: Number(form.sortOrder) || 0 };
    } else if (tab === "states") {
      path = "/api/super-admin/masters/states";
      body = { code: form.code, name: form.name, sortOrder: Number(form.sortOrder) || 0 };
    } else if (tab === "cities") {
      path = "/api/super-admin/masters/cities";
      body = { stateId: Number(stateFilter || form.stateId), name: form.name, sortOrder: Number(form.sortOrder) || 0 };
    } else if (tab === "sectors") {
      path = "/api/super-admin/masters/sectors";
      body = { code: form.code, name: form.name, sortOrder: Number(form.sortOrder) || 0 };
    } else if (tab === "sub-sectors") {
      path = "/api/super-admin/masters/sub-sectors";
      body = { sectorId: Number(sectorFilter || form.sectorId), code: form.code, name: form.name, sortOrder: Number(form.sortOrder) || 0 };
    } else if (tab === "enums") {
      path = "/api/super-admin/masters/enums";
      body = { enumType: form.enumType, code: form.code, label: form.label, sortOrder: Number(form.sortOrder) || 0 };
    } else return;

    const res = await platformAdminFetch(path, { method: "POST", body: JSON.stringify(body) });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j as { error?: string }).error ?? "Create failed");
      return;
    }
    setForm({});
    void load();
  };

  const remove = async (id: number) => {
    if (!window.confirm("Delete this row?")) return;
    const map: Partial<Record<Tab, string>> = {
      "shift-types": "shift-types",
      cities: "cities",
      "sub-sectors": "sub-sectors",
      enums: "enums",
    };
    const segment = map[tab];
    if (!segment) return;
    const res = await platformAdminFetch(`/api/super-admin/masters/${segment}/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      setError("Delete failed");
      return;
    }
    void load();
  };

  const readOnly = tab === "permissions";

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-[#E8E5F0] pb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold ${
              tab === t.id ? "bg-[#4F7FFF] text-white" : "bg-white text-[#6B6B80] ring-1 ring-[#E8E5F0]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "cities" ? (
        <div className="mt-4">
          <label className="text-[12px] font-semibold text-[#475467]">Filter by state</label>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className={`${inputCls} mt-1 w-full max-w-xs`}
          >
            <option value="">All states</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {tab === "sub-sectors" ? (
        <div className="mt-4">
          <label className="text-[12px] font-semibold text-[#475467]">Filter by sector</label>
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className={`${inputCls} mt-1 w-full max-w-xs`}
          >
            <option value="">All sectors</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {!readOnly ? (
        <div className="mt-4 flex flex-wrap items-end gap-2 rounded-xl border border-[#E8E5F0] bg-[#FAFAFA] p-4">
          {(tab === "shift-types" || tab === "states" || tab === "sectors" || tab === "sub-sectors" || tab === "enums") && (
            <input placeholder="Code" value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputCls} />
          )}
          {tab === "enums" && (
            <input placeholder="Type (e.g. gender)" value={form.enumType ?? ""} onChange={(e) => setForm({ ...form, enumType: e.target.value })} className={inputCls} />
          )}
          {(tab === "shift-types" || tab === "states" || tab === "cities" || tab === "sectors" || tab === "sub-sectors" || tab === "enums") && (
            <input placeholder={tab === "shift-types" ? "Label" : "Name"} value={form.label ?? form.name ?? ""} onChange={(e) => setForm({ ...form, label: e.target.value, name: e.target.value })} className={inputCls} />
          )}
          {tab === "shift-types" && (
            <input placeholder="Description" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputCls} min-w-[140px]`} />
          )}
          {tab === "cities" && !stateFilter ? (
            <select value={form.stateId ?? ""} onChange={(e) => setForm({ ...form, stateId: e.target.value })} className={inputCls}>
              <option value="">State</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          ) : null}
          <input placeholder="Sort" value={form.sortOrder ?? ""} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className={`${inputCls} w-16`} />
          <button type="button" onClick={() => void create()} className="h-9 rounded-lg bg-[#4F7FFF] px-4 text-[12px] font-bold text-white">
            Add
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-[13px] text-red-600">{error}</p> : null}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-[#E8E5F0] bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-[13px] text-[#6B6B80]">Loading…</p>
        ) : (
          <table className="w-full min-w-[520px] text-left text-[12px]">
            <thead className="border-b border-[#E8E5F0] bg-[#FAFAFA] text-[10px] font-bold uppercase text-[#6B6B80]">
              <tr>
                <th className="px-4 py-2">ID</th>
                {tab === "permissions" ? (
                  <>
                    <th className="px-4 py-2">Code</th>
                    <th className="px-4 py-2">Module</th>
                  </>
                ) : tab === "enums" ? (
                  <>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Code</th>
                    <th className="px-4 py-2">Label</th>
                  </>
                ) : tab === "shift-types" ? (
                  <>
                    <th className="px-4 py-2">Code</th>
                    <th className="px-4 py-2">Label</th>
                    <th className="px-4 py-2">Description</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-2">Code / State</th>
                    <th className="px-4 py-2">Name</th>
                  </>
                )}
                {!readOnly ? <th className="px-4 py-2" /> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EEF8]">
              {rows.map((row) => (
                <tr key={String(row.id)} className="hover:bg-[#FAFAFA]">
                  <td className="px-4 py-2 font-mono text-[#6B6B80]">{String(row.id)}</td>
                  {tab === "permissions" ? (
                    <>
                      <td className="px-4 py-2 font-medium">{String(row.code)}</td>
                      <td className="px-4 py-2">{String(row.module)}</td>
                    </>
                  ) : tab === "enums" ? (
                    <>
                      <td className="px-4 py-2">{String(row.enumType)}</td>
                      <td className="px-4 py-2 font-mono">{String(row.code)}</td>
                      <td className="px-4 py-2">{String(row.label)}</td>
                    </>
                  ) : tab === "shift-types" ? (
                    <>
                      <td className="px-4 py-2 font-mono">{String(row.code)}</td>
                      <td className="px-4 py-2 font-bold">{String(row.label)}</td>
                      <td className="px-4 py-2 text-[#667085]">{String(row.description ?? "")}</td>
                    </>
                  ) : tab === "cities" ? (
                    <>
                      <td className="px-4 py-2">state #{String(row.stateId)}</td>
                      <td className="px-4 py-2">{String(row.name)}</td>
                    </>
                  ) : tab === "sub-sectors" ? (
                    <>
                      <td className="px-4 py-2 font-mono">{String(row.code)}</td>
                      <td className="px-4 py-2">{String(row.name)}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2 font-mono">{String(row.code)}</td>
                      <td className="px-4 py-2">{String(row.name)}</td>
                    </>
                  )}
                  {!readOnly && typeof row.id === "number" ? (
                    <td className="px-4 py-2">
                      <button type="button" onClick={() => void remove(row.id as number)} className="text-[12px] font-bold text-red-600 hover:underline">
                        Delete
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-2 text-[11px] text-[#9CA3AF]">{rows.length} rows</p>
    </div>
  );
}
