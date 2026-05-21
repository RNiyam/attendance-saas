"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, Layers3, Plus, Tags, Trash2, Users } from "lucide-react";
import { apiBaseUrl, authenticatedFetch } from "@/services/http";

type FunctionType = "departments" | "designations";

type MasterData = {
  departments: { id: number; name: string }[];
  designations: { id: number; departmentId: number; name: string }[];
};

type PredefinedData = {
  departments: { name: string; designations: string[] }[];
};

const functionOptions: {
  id: FunctionType;
  title: string;
  desc: string;
  icon: typeof Users;
  placeholder: string;
}[] = [
  {
    id: "departments",
    title: "Departments",
    desc: "Teams or functional areas such as HR, IT, Finance, and Operations.",
    icon: Users,
    placeholder: "HR",
  },
  {
    id: "designations",
    title: "Designations",
    desc: "Job titles such as Developer, Manager, HR Executive, or Accountant.",
    icon: Tags,
    placeholder: "Manager",
  },
];

const inputClass =
  "h-11 w-full rounded-lg border-2 border-[#E8E5F0] bg-[#FAFAFA] px-3.5 text-[13px] font-medium text-[#0F0F1A] outline-none transition placeholder:text-[#CACAD6] focus:border-[#7C3AED]/50 focus:bg-white focus:ring-[3px] focus:ring-[#7C3AED]/10";

async function readApiError(res: Response, fallback: string) {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await res.json().catch(() => ({}));
    return typeof body.error === "string" ? body.error : fallback;
  }
  const text = await res.text().catch(() => "");
  const match = text.match(/<pre>([\s\S]*?)<\/pre>/);
  return match?.[1]?.trim() || text.trim() || `${fallback} (${res.status})`;
}

export default function BusinessFunctionsSetupPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<FunctionType>("departments");
  const [data, setData] = useState<MasterData>({ departments: [], designations: [] });
  const [predefined, setPredefined] = useState<PredefinedData>({ departments: [] });
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | "">("");
  const [isCustomValue, setIsCustomValue] = useState(false);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const active = useMemo(
    () => functionOptions.find((option) => option.id === selectedType) ?? functionOptions[0],
    [selectedType],
  );
  const ActiveIcon = active.icon;
  const values = (selectedType === "designations"
    ? data.designations.filter((d) => selectedDepartmentId === "" || d.departmentId === selectedDepartmentId)
    : data.departments) as { id: number; name: string; departmentId?: number }[];

  const load = useCallback(async () => {
    const [res, preRes] = await Promise.all([
      authenticatedFetch(`${apiBaseUrl}/api/organization/business-functions`),
      authenticatedFetch(`${apiBaseUrl}/api/organization/business-functions/predefined`),
    ]);
    if (res.ok) {
      const body = (await res.json()) as MasterData;
      setData({
        departments: body.departments ?? [],
        designations: body.designations ?? [],
      });
    }
    if (preRes.ok) {
      const body = (await preRes.json()) as PredefinedData;
      setPredefined(body);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load().finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const allPredefinedDepartments = predefined.departments.map((d) => d.name);

  const selectedDeptName = data.departments.find((d) => d.id === selectedDepartmentId)?.name;
  const allPredefinedDesignations = predefined.departments.find((d) => d.name === selectedDeptName)?.designations || [];

  const addValue = async () => {
    if (selectedType === "designations" && !selectedDepartmentId) {
      setError("Please select a department first.");
      return;
    }
    const name = value.trim();
    if (!name) {
      setError(`Enter a ${active.title.slice(0, -1).toLowerCase()} name.`);
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await authenticatedFetch(`${apiBaseUrl}/api/organization/business-functions/${selectedType}/values`, {
        method: "POST",
        body: JSON.stringify({
          name,
          ...(selectedType === "designations" ? { departmentId: selectedDepartmentId } : {}),
        }),
      });
      if (!res.ok) {
        setError(await readApiError(res, "Could not add value."));
        return;
      }
      await res.json().catch(() => ({}));
      setValue("");
      setIsCustomValue(false);
      setMessage(`${name} added to ${active.title}.`);
      await load();
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  };

  const ensureOrganizationOnlyDepartment = async () => {
    if (data.departments.length > 0) return true;

    const res = await authenticatedFetch(`${apiBaseUrl}/api/organization/business-functions/skip`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      setError(await readApiError(res, "Could not skip business functions."));
      return false;
    }
    await res.json().catch(() => ({}));
    await load();
    return true;
  };

  const deleteValue = async (item: { id: number; name: string }) => {
    const key = `${selectedType}:${item.id}`;
    setDeletingKey(key);
    setError(null);
    setMessage(null);
    try {
      const res = await authenticatedFetch(
        `${apiBaseUrl}/api/organization/business-functions/${selectedType}/values/${item.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        setError(await readApiError(res, "Could not delete value."));
        return;
      }
      await res.json().catch(() => ({}));
      setMessage(`${item.name} deleted from ${active.title}.`);
      await load();
    } catch {
      setError("Network error while deleting.");
    } finally {
      setDeletingKey(null);
    }
  };

  const continueToTaxes = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const ok = await ensureOrganizationOnlyDepartment();
      if (!ok) return;
      localStorage.setItem("setup:kybSkipped", "true");
      localStorage.setItem("setup:businessFunctionsDone", "true");
      router.push("/dashboard/setup/taxes-compliance");
    } catch {
      setError("Network error while continuing.");
    } finally {
      setSaving(false);
    }
  };

  const skipBusinessFunctions = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const ok = await ensureOrganizationOnlyDepartment();
      if (!ok) return;
      localStorage.setItem("setup:kybSkipped", "true");
      localStorage.setItem("setup:businessFunctionsDone", "true");
      router.push("/dashboard/setup/taxes-compliance");
    } catch {
      setError("Network error while skipping.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F7F5F0] text-[#0F0F1A]">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(212,228,255,0.52)_0%,rgba(247,245,240,0.94)_34%,rgba(255,240,212,0.36)_68%,rgba(255,255,255,0.72)_100%)]"
        aria-hidden
      />

      <main className="relative z-10 mx-auto w-full max-w-[1060px] px-4 pb-32 pt-8 sm:px-6 lg:pt-10">
        <Link
          href="/dashboard/setup"
          className="mb-6 inline-flex items-center gap-2 text-[13px] font-semibold text-[#6B6B80] transition hover:text-[#0F0F1A]"
        >
          <ArrowLeft className="h-4 w-4 text-[#4F7FFF]" />
          Back
        </Link>

        <section className="overflow-hidden rounded-2xl border border-[#E8E5F0] bg-white shadow-xl shadow-black/[0.05]">
          <div className="border-b border-[#E8E5F0] bg-[#FAFAFA] px-5 py-5 sm:px-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#4F7FFF]">Basic Details</p>
                <h1 className="mt-1 text-[24px] font-black tracking-[-0.03em] text-[#0F0F1A] sm:text-[30px]">
                  Business Functions
                </h1>
                <p className="mt-2 max-w-2xl text-[13px] font-medium leading-relaxed text-[#6B6B80]">
                  Create the fixed masters your HRMS needs first: departments and designations.
                </p>
              </div>

              <div className="flex rounded-xl border border-[#E8E5F0] bg-white p-1 shadow-sm">
                {["KYB", "Business Functions", "Taxes & Compliance"].map((step, index) => (
                  <span
                    key={step}
                    className={`rounded-lg px-3 py-2 text-[12px] font-bold ${
                      index === 0
                        ? "bg-emerald-50 text-emerald-600"
                        : index === 1
                          ? "bg-[#EFF6FF] text-[#4F7FFF]"
                          : "text-[#9CA3AF]"
                    }`}
                  >
                    {index === 0 ? "✓ " : `${index + 1} `}
                    {step}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="rounded-xl border border-[#E8E5F0] bg-[#FAFAFA] p-4">
              <label className="block">
                <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                  Function Type
                </span>
                <div className="relative">
                  <select
                    value={selectedType}
                    onChange={(e) => {
                      setSelectedType(e.target.value as FunctionType);
                      setValue("");
                      setError(null);
                      setMessage(null);
                      setSelectedDepartmentId("");
                      setIsCustomValue(false);
                    }}
                    className={`${inputClass} appearance-none pr-10`}
                  >
                    {functionOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                </div>
              </label>

              <div className="mt-5 space-y-2">
                {functionOptions.map((option) => {
                  const Icon = option.icon;
                  const selected = option.id === selectedType;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setSelectedType(option.id);
                        setSelectedDepartmentId("");
                        setIsCustomValue(false);
                      }}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                        selected
                          ? "border-[#C7D7FE] bg-[#EFF6FF]"
                          : "border-[#E8E5F0] bg-white hover:border-[#C7D7FE]"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          selected ? "bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] text-white" : "bg-[#F0EEF8] text-[#6B6B80]"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-[13px] font-black text-[#0F0F1A]">{option.title}</span>
                        <span className="mt-0.5 block text-[11px] font-medium leading-relaxed text-[#6B6B80]">
                          {data[option.id].length} values
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="rounded-xl border border-[#E8E5F0] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] text-white shadow-md shadow-blue-200">
                    <ActiveIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-[18px] font-black text-[#0F0F1A]">{active.title}</h2>
                    <p className="mt-1 max-w-xl text-[13px] font-medium leading-relaxed text-[#6B6B80]">{active.desc}</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#4F7FFF]">
                  {values.length} values
                </span>
              </div>

              <div className="mt-6 rounded-xl border border-dashed border-[#DAD7E8] bg-[#FAFAFA] p-4">
                {selectedType === "designations" && data.departments.length > 0 ? (
                  <div className="mb-4">
                    <label className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                      Select Department
                    </label>
                    <div className="relative">
                      <select
                        value={selectedDepartmentId}
                        onChange={(e) => setSelectedDepartmentId(Number(e.target.value) || "")}
                        className={`${inputClass} appearance-none pr-10`}
                      >
                        <option value="">-- All Departments --</option>
                        {data.departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                  {isCustomValue ? (
                    <div className="relative">
                      <input
                        className={inputClass}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={active.placeholder}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomValue(false);
                          setValue("");
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#6B6B80] hover:text-[#0F0F1A]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        className={`${inputClass} appearance-none pr-10`}
                        value={value}
                        onChange={(e) => {
                          if (e.target.value === "__CUSTOM__") {
                            setIsCustomValue(true);
                            setValue("");
                          } else {
                            setValue(e.target.value);
                          }
                        }}
                      >
                        <option value="">-- Select {active.title.slice(0, -1)} --</option>
                        {(selectedType === "departments" ? allPredefinedDepartments : allPredefinedDesignations).map((opt) => {
                          const isAdded = selectedType === "departments" 
                            ? data.departments.some((d) => d.name === opt)
                            : data.designations.some((d) => d.departmentId === selectedDepartmentId && d.name === opt);
                          return (
                            <option key={opt} value={opt} disabled={isAdded}>
                              {opt} {isAdded ? "(Already Added)" : ""}
                            </option>
                          );
                        })}
                        <option value="__CUSTOM__">+ Other (Add Custom)</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={saving || (!isCustomValue && !value)}
                    onClick={() => void addValue()}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] px-5 text-[13px] font-black text-white shadow-lg shadow-[#4F7FFF]/20 transition hover:opacity-[0.97] disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    {saving ? "Adding..." : "Add Value"}
                  </button>
                </div>

                {error ? <p className="mt-3 text-[12px] font-semibold text-red-600">{error}</p> : null}
                {message ? <p className="mt-3 text-[12px] font-semibold text-emerald-600">{message}</p> : null}
              </div>

              <div className="mt-5">
                {loading ? (
                  <p className="text-[13px] font-medium text-[#9CA3AF]">Loading values...</p>
                ) : values.length ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {values.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-xl border border-[#E8E5F0] bg-[#FAFAFA] px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-black text-[#0F0F1A]">{item.name}</p>
                        </div>
                        <button
                          type="button"
                          aria-label={`Delete ${item.name}`}
                          title={`Delete ${item.name}`}
                          disabled={deletingKey === `${selectedType}:${item.id}`}
                          onClick={() => void deleteValue(item)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#E8E5F0] bg-[#FAFAFA] px-4 py-8 text-center">
                    <Layers3 className="mx-auto h-7 w-7 text-[#CACAD6]" />
                    <p className="mt-2 text-[13px] font-bold text-[#6B6B80]">No values added yet</p>
                    <p className="mt-1 text-[12px] text-[#9CA3AF]">Add one or more values for {active.title.toLowerCase()}.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#E8E5F0] bg-[#F7F5F0]/95 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1060px] justify-end gap-3">
          <Link
            href="/dashboard/setup"
            className="flex h-10 w-28 items-center justify-center rounded-xl border-2 border-[#E8E5F0] bg-white text-[13px] font-bold text-[#6B6B80] transition hover:border-[#4F7FFF] hover:text-[#4F7FFF]"
          >
            Back
          </Link>
          <button
            type="button"
            disabled={saving}
            onClick={() => void skipBusinessFunctions()}
            className="flex h-10 w-28 items-center justify-center rounded-xl border-2 border-[#E8E5F0] bg-white text-[13px] font-bold text-[#4F7FFF] transition hover:border-[#4F7FFF] disabled:opacity-50"
          >
            Skip
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void continueToTaxes()}
            className="flex h-10 w-32 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] text-[13px] font-black text-white shadow-lg shadow-[#4F7FFF]/20 transition hover:opacity-[0.97] disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
