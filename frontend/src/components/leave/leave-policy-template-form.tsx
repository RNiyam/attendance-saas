"use client";

import {
  ArrowUpDown,
  CalendarDays,
  ChevronDown,
  Info,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  approvalSummary,
  readApprovalDraft,
  toApiPayload,
  clearApprovalDraft,
  fromApiLevels,
} from "@/lib/leave-approval";
import { readSetupFlags, writeSetupFlag } from "@/lib/setup-progress";
import { apiBaseUrl, authenticatedFetch } from "@/services/http";

export type PolicyCycle = "yearly" | "monthly" | "quarterly";
export type AccrualPeriod = "all_at_once" | "monthly" | "quarterly" | "na";

export type LeaveCategoryRow = {
  id: string;
  leaveName: string;
  leaveCount: string;
  accrualPeriod: AccrualPeriod;
  customFieldsCount: number;
  isSystem: boolean;
};

export type LeavePolicyFormValues = {
  name: string;
  policyCycle: PolicyCycle;
  startMonth: string;
  endMonth: string;
  categories: LeaveCategoryRow[];
  unpaidLeaveEnabled: boolean;
  countSandwichLeaves: boolean;
};

const DEFAULT_CATEGORIES: LeaveCategoryRow[] = [
  { id: "cl", leaveName: "Casual Leave", leaveCount: "", accrualPeriod: "all_at_once", customFieldsCount: 0, isSystem: false },
  { id: "sl", leaveName: "Sick Leave", leaveCount: "", accrualPeriod: "all_at_once", customFieldsCount: 0, isSystem: false },
  { id: "al", leaveName: "Annual Leave", leaveCount: "", accrualPeriod: "all_at_once", customFieldsCount: 0, isSystem: false },
  {
    id: "comp-off",
    leaveName: "Comp Off (System)",
    leaveCount: "",
    accrualPeriod: "na",
    customFieldsCount: 0,
    isSystem: true,
  },
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function monthToDate(value: string, end = false): string {
  if (!value) return "";
  const [year, month] = value.split("-").map((x) => Number(x));
  if (!year || !month) return "";
  if (!end) return `${year}-${String(month).padStart(2, "0")}-01`;
  const last = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

function dateToMonth(value: string): string {
  return value ? value.slice(0, 7) : "";
}

export function formatLeavePeriod(startMonth: string, endMonth: string): string {
  if (!startMonth || !endMonth) return "Select period";
  const [sy, sm] = startMonth.split("-").map(Number);
  const [ey, em] = endMonth.split("-").map(Number);
  if (!sy || !sm || !ey || !em) return "Select period";
  return `${MONTH_NAMES[sm - 1]} ${sy} - ${MONTH_NAMES[em - 1]} ${ey}`;
}

export function mapApiToFormValues(data: {
  name: string;
  startDate: string;
  endDate: string;
  policyCycle?: PolicyCycle;
  unpaidLeaveEnabled?: number;
  countSandwichLeaves?: number;
  approvalLevels?: {
    levelOrder: number;
    minApproversRequired: number;
    approvers: { approverType: string; approverName: string; substituteEnabled: number }[];
  }[];
  leaves: {
    id: number;
    leaveName: string;
    annualQuota: string;
    accrualPeriod?: AccrualPeriod;
    isSystem?: number;
    customFieldsCount?: number;
  }[];
}): LeavePolicyFormValues {
  return {
    name: data.name,
    policyCycle: data.policyCycle ?? "yearly",
    startMonth: dateToMonth(data.startDate),
    endMonth: dateToMonth(data.endDate),
    unpaidLeaveEnabled: (data.unpaidLeaveEnabled ?? 1) === 1,
    countSandwichLeaves: (data.countSandwichLeaves ?? 0) === 1,
    categories: data.leaves.map((row) => ({
      id: String(row.id),
      leaveName: row.leaveName,
      leaveCount: String(row.annualQuota) === "0" ? "" : String(row.annualQuota),
      accrualPeriod: row.accrualPeriod ?? (row.isSystem ? "na" : "all_at_once"),
      customFieldsCount: row.customFieldsCount ?? 0,
      isSystem: Boolean(row.isSystem),
    })),
  };
}

function buildPayload(values: LeavePolicyFormValues) {
  return {
    name: values.name.trim(),
    startDate: monthToDate(values.startMonth),
    endDate: monthToDate(values.endMonth, true),
    policyCycle: values.policyCycle,
    unpaidLeaveEnabled: values.unpaidLeaveEnabled ? 1 : 0,
    countSandwichLeaves: values.countSandwichLeaves ? 1 : 0,
    leaves: values.categories
      .filter((c) => c.leaveName.trim())
      .map((c, index) => ({
        leaveName: c.leaveName.trim(),
        annualQuota: c.leaveCount.trim() || "0",
        accrualPeriod:
          c.isSystem || values.policyCycle === "monthly"
            ? ("na" as const)
            : c.accrualPeriod,
        isSystem: c.isSystem ? 1 : 0,
        customFieldsCount: c.customFieldsCount,
        sortOrder: index,
      })),
  };
}

type Props = {
  mode: "create" | "edit";
  templateId?: number;
  initialValues?: LeavePolicyFormValues;
  backHref?: string;
};

export default function LeavePolicyTemplateForm({
  mode,
  templateId,
  initialValues,
  backHref = "/dashboard/setup/leave-policy",
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialValues?.name ?? "Leave Policy");
  const [policyCycle, setPolicyCycle] = useState<PolicyCycle>(initialValues?.policyCycle ?? "yearly");
  const [startMonth, setStartMonth] = useState(initialValues?.startMonth ?? "2026-01");
  const [endMonth, setEndMonth] = useState(initialValues?.endMonth ?? "2026-12");
  const [categories, setCategories] = useState<LeaveCategoryRow[]>(
    initialValues?.categories ?? DEFAULT_CATEGORIES,
  );
  const [unpaidLeaveEnabled, setUnpaidLeaveEnabled] = useState(initialValues?.unpaidLeaveEnabled ?? true);
  const [countSandwichLeaves, setCountSandwichLeaves] = useState(initialValues?.countSandwichLeaves ?? false);
  const [approvalHint, setApprovalHint] = useState("Not configured");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshApprovalHint = useCallback(async () => {
    if (templateId) {
      try {
        const res = await authenticatedFetch(
          `${apiBaseUrl}/api/leave/policy-templates/${templateId}/approval-levels`,
        );
        if (res.ok) {
          const data = await res.json();
          setApprovalHint(approvalSummary(fromApiLevels(Array.isArray(data) ? data : [])));
          return;
        }
      } catch {
        /* ignore */
      }
    }
    const draft = readApprovalDraft();
    setApprovalHint(draft?.length ? approvalSummary(draft) : "Not configured");
  }, [templateId]);

  useEffect(() => {
    void refreshApprovalHint();
  }, [refreshApprovalHint]);

  const goToApprovals = () => {
    const returnTo =
      mode === "edit" && templateId
        ? `/dashboard/setup/leave-policy/${templateId}`
        : "/dashboard/setup/leave-policy/add";
    const qs = new URLSearchParams({ returnTo });
    if (templateId) qs.set("templateId", String(templateId));
    router.push(`/dashboard/setup/leave-policy/approvals?${qs.toString()}`);
  };

  const totalLeaves = useMemo(
    () =>
      categories.reduce((sum, row) => {
        if (row.isSystem) return sum;
        const n = parseFloat(row.leaveCount);
        return sum + (Number.isFinite(n) ? n : 0);
      }, 0),
    [categories],
  );

  const periodLabel = formatLeavePeriod(startMonth, endMonth);

  const updateCategory = (id: string, patch: Partial<LeaveCategoryRow>) => {
    setCategories((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const onPolicyCycleChange = (cycle: PolicyCycle) => {
    setPolicyCycle(cycle);
    if (cycle === "monthly") {
      setCategories((prev) =>
        prev.map((row) => (row.isSystem ? row : { ...row, accrualPeriod: "na" as const })),
      );
    } else {
      setCategories((prev) =>
        prev.map((row) =>
          row.isSystem ? row : { ...row, accrualPeriod: row.accrualPeriod === "na" ? "all_at_once" : row.accrualPeriod },
        ),
      );
    }
  };

  const save = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Template name is required.");
      return;
    }
    if (!startMonth || !endMonth) {
      setError("Leave period is required.");
      return;
    }
    const draftLevels = readApprovalDraft();
    const payload: ReturnType<typeof buildPayload> & {
      approvalLevels?: ReturnType<typeof toApiPayload>;
    } = buildPayload({
      name,
      policyCycle,
      startMonth,
      endMonth,
      categories,
      unpaidLeaveEnabled,
      countSandwichLeaves,
    });
    if (draftLevels?.length) {
      payload.approvalLevels = toApiPayload(draftLevels);
    }
    if (payload.leaves.length === 0) {
      setError("Add at least one leave category.");
      return;
    }

    setSaving(true);
    try {
      const url =
        mode === "edit" && templateId
          ? `${apiBaseUrl}/api/leave/policy-templates/${templateId}`
          : `${apiBaseUrl}/api/leave/policy-templates`;
      const res = await authenticatedFetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof body.error === "string" ? body.error : "Could not save leave policy.");
        return;
      }
      clearApprovalDraft();
      writeSetupFlag("leavePolicyDone", true);
      readSetupFlags();
      router.push(backHref);
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 text-[#0F0F1A]">
      <main className="mx-auto max-w-[1100px] px-4 pb-8 pt-6 sm:px-8">
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="text-[13px] font-semibold text-[#2563EB] hover:underline"
        >
          ← Back
        </button>

        <section className="mt-6 space-y-5">
          {/* Template Settings */}
          <div className="rounded-xl border border-[#E5EAF2] bg-white px-6 py-6 shadow-sm">
            <h2 className="text-[15px] font-black text-[#0F0F1A]">Template Settings</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-[#475467]">Template Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-[14px] font-medium text-[#344054] outline-none focus:border-[#4F7FFF] focus:ring-2 focus:ring-[#4F7FFF]/10"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-[#475467]">Leave Policy Cycle</span>
                <span className="relative block">
                  <select
                    value={policyCycle}
                    onChange={(e) => onPolicyCycleChange(e.target.value as PolicyCycle)}
                    className="h-11 w-full appearance-none rounded-lg border border-[#E2E8F0] bg-white px-3 pr-9 text-[14px] font-medium text-[#344054] outline-none focus:border-[#4F7FFF] focus:ring-2 focus:ring-[#4F7FFF]/10"
                  >
                    <option value="yearly">Yearly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
                </span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-[#475467]">Leave Period</span>
                <div className="flex h-11 items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3">
                  <CalendarDays className="h-4 w-4 shrink-0 text-[#667085]" />
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[#344054]">{periodLabel}</span>
                  <input
                    type="month"
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                    className="sr-only"
                    aria-label="Start month"
                  />
                  <input
                    type="month"
                    value={endMonth}
                    onChange={(e) => setEndMonth(e.target.value)}
                    title="End month"
                    className="w-[88px] shrink-0 border-0 bg-transparent text-[11px] text-[#667085] outline-none"
                  />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    type="month"
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                    className="h-9 rounded-md border border-[#E2E8F0] px-2 text-[12px]"
                  />
                  <input
                    type="month"
                    value={endMonth}
                    onChange={(e) => setEndMonth(e.target.value)}
                    className="h-9 rounded-md border border-[#E2E8F0] px-2 text-[12px]"
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Leave Categories */}
          <div className="rounded-xl border border-[#E5EAF2] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#EEF2F6] px-6 py-4">
              <h2 className="text-[15px] font-black text-[#0F0F1A]">Leave Categories</h2>
              <button
                type="button"
                onClick={() =>
                  setCategories((prev) => [
                    ...prev,
                    {
                      id: uid(),
                      leaveName: "",
                      leaveCount: "",
                      accrualPeriod: policyCycle === "monthly" ? "na" : "all_at_once",
                      customFieldsCount: 0,
                      isSystem: false,
                    },
                  ])
                }
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#4F7FFF] px-4 text-[13px] font-bold text-[#2563EB]"
              >
                <Plus className="h-4 w-4" />
                Add Leave Category
              </button>
            </div>

            <div className="overflow-x-auto px-4 py-2">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead>
                  <tr className="text-[12px] font-semibold text-[#667085]">
                    <th className="px-2 py-3 font-semibold">Leave Category Name</th>
                    <th className="w-[130px] px-2 py-3 font-semibold">Leave Count</th>
                    <th className="w-[150px] px-2 py-3 font-semibold">Accrual Period</th>
                    <th className="w-[100px] px-2 py-3 text-center font-semibold">Custom Fields</th>
                    <th className="w-[70px] px-2 py-3 text-center font-semibold">Settings</th>
                    <th className="w-[90px] px-2 py-3 text-center font-semibold">Automation Rules</th>
                    <th className="w-[50px] px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {categories.map((row) => {
                    const accrualDisabled = row.isSystem || policyCycle === "monthly";
                    return (
                      <tr key={row.id} className="border-t border-[#F1F5F9]">
                        <td className="px-2 py-3">
                          <input
                            value={row.leaveName}
                            disabled={row.isSystem}
                            onChange={(e) => updateCategory(row.id, { leaveName: e.target.value })}
                            className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-[14px] font-medium text-[#344054] outline-none focus:border-[#4F7FFF] disabled:bg-[#F8FAFC] disabled:text-[#667085]"
                          />
                        </td>
                        <td className="px-2 py-3">
                          <span className="relative block">
                            <input
                              type="number"
                              min={0}
                              step={0.5}
                              value={row.leaveCount}
                              disabled={row.isSystem}
                              placeholder="Leave Count"
                              onChange={(e) => updateCategory(row.id, { leaveCount: e.target.value })}
                              className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-[14px] font-medium outline-none focus:border-[#4F7FFF] disabled:bg-[#F8FAFC]"
                            />
                            {row.isSystem ? (
                              <Info className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
                            ) : null}
                          </span>
                        </td>
                        <td className="px-2 py-3">
                          {accrualDisabled ? (
                            <div className="flex h-10 items-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-[14px] font-medium text-[#98A2B3]">
                              NA
                            </div>
                          ) : (
                            <select
                              value={row.accrualPeriod}
                              onChange={(e) =>
                                updateCategory(row.id, { accrualPeriod: e.target.value as AccrualPeriod })
                              }
                              className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-[14px] font-medium text-[#344054] outline-none focus:border-[#4F7FFF]"
                            >
                              <option value="all_at_once">All at once</option>
                              <option value="monthly">Monthly</option>
                              <option value="quarterly">Quarterly</option>
                            </select>
                          )}
                        </td>
                        <td className="px-2 py-3 text-center">
                          <button
                            type="button"
                            className="text-[14px] font-bold text-[#2563EB] hover:underline"
                            onClick={() =>
                              updateCategory(row.id, {
                                customFieldsCount: row.customFieldsCount > 0 ? 0 : 1,
                              })
                            }
                          >
                            {row.customFieldsCount}
                          </button>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <button
                            type="button"
                            className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-[#475467] hover:bg-[#F4F7FB]"
                            aria-label="Category settings"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <button
                            type="button"
                            className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-[#2563EB] hover:bg-[#EFF6FF]"
                            aria-label="Automation rules"
                          >
                            <ArrowUpDown className="h-4 w-4" />
                          </button>
                        </td>
                        <td className="px-2 py-3 text-center">
                          {!row.isSystem ? (
                            <button
                              type="button"
                              onClick={() => setCategories((prev) => prev.filter((r) => r.id !== row.id))}
                              className="mx-auto flex h-9 w-9 items-center justify-center text-[#EF4444] hover:bg-red-50 rounded-lg"
                              aria-label="Delete category"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-6 border-t border-[#EEF2F6] px-6 py-4">
              <label className="flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#344054]">
                <input
                  type="checkbox"
                  checked={unpaidLeaveEnabled}
                  onChange={(e) => setUnpaidLeaveEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB]"
                />
                Unpaid Leave
                <Info className="h-4 w-4 text-[#98A2B3]" />
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#344054]">
                <input
                  type="checkbox"
                  checked={countSandwichLeaves}
                  onChange={(e) => setCountSandwichLeaves(e.target.checked)}
                  className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB]"
                />
                Count Sandwich Leaves
                <Info className="h-4 w-4 text-[#98A2B3]" />
              </label>
            </div>
          </div>

          {/* Approval Setting */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#E5EAF2] bg-white px-6 py-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
                <Settings className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[14px] font-bold text-[#0F0F1A]">Approval Setting</p>
                <p className="mt-0.5 text-[13px] font-medium text-[#667085]">
                  Configure the levels of approval required in applications using this template
                </p>
                <p className="mt-1 text-[12px] font-semibold text-[#2563EB]">{approvalHint}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={goToApprovals}
              className="h-10 shrink-0 rounded-lg border border-[#4F7FFF] px-5 text-[13px] font-bold text-[#2563EB] hover:bg-[#EFF6FF]"
            >
              Set Approval Levels
            </button>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-800">
              {error}
            </p>
          ) : null}
        </section>
      </main>


      <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-[#EEF2F6] bg-white/95 px-5 py-4 shadow-[0_-10px_30px_rgba(15,23,42,0.06)] backdrop-blur">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4">
          <p className="text-[14px] font-black text-[#475467]">
            Total Leaves : {totalLeaves % 1 === 0 ? totalLeaves : totalLeaves.toFixed(1)}
          </p>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="h-11 min-w-[120px] rounded-lg bg-[#2563EB] px-10 text-[14px] font-bold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-[#CBD5E1]"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </footer>
    </div>
  );
}
