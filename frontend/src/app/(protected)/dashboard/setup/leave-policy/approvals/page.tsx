"use client";

import { Info, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import AddApproverModal from "@/components/leave/add-approver-modal";
import {
  APPROVER_TYPE_OPTIONS,
  approvalSummary,
  createEmptyLevel,
  defaultApprovalLevels,
  fromApiLevels,
  readApprovalDraft,
  toApiPayload,
  writeApprovalDraft,
  type ApprovalApprover,
  type ApprovalLevel,
} from "@/lib/leave-approval";
import { apiBaseUrl, authenticatedFetch } from "@/services/http";

function approverTypeLabel(type: string) {
  return APPROVER_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function ApprovalPolicyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId");
  const returnTo = searchParams.get("returnTo") ?? "/dashboard/setup/leave-policy/add";

  const [levels, setLevels] = useState<ApprovalLevel[]>(defaultApprovalLevels());
  const [loading, setLoading] = useState(Boolean(templateId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeLevelId, setActiveLevelId] = useState<string | null>(null);
  const [editingApprover, setEditingApprover] = useState<ApprovalApprover | null>(null);

  const load = useCallback(async () => {
    if (!templateId) {
      const draft = readApprovalDraft();
      if (draft?.length) setLevels(draft);
      setLoading(false);
      return;
    }
    try {
      const res = await authenticatedFetch(
        `${apiBaseUrl}/api/leave/policy-templates/${templateId}/approval-levels`,
      );
      if (res.ok) {
        const data = await res.json();
        setLevels(fromApiLevels(Array.isArray(data) ? data : []));
      }
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeLevel = levels.find((l) => l.id === activeLevelId);
  const activeLevelOrder = activeLevel?.levelOrder ?? levels.length;

  const openAddApprover = (levelId: string) => {
    setActiveLevelId(levelId);
    setEditingApprover(null);
    setModalOpen(true);
  };

  const saveApprover = (approver: ApprovalApprover) => {
    if (!activeLevelId) return;
    setLevels((prev) =>
      prev.map((level) => {
        if (level.id !== activeLevelId) return level;
        const exists = level.approvers.some((a) => a.id === approver.id);
        const approvers = exists
          ? level.approvers.map((a) => (a.id === approver.id ? approver : a))
          : [...level.approvers, approver];
        const minRequired = Math.min(level.minApproversRequired, approvers.length);
        return { ...level, approvers, minApproversRequired: minRequired };
      }),
    );
  };

  const addLevel = () => {
    setLevels((prev) => [...prev, createEmptyLevel(prev.length + 1)]);
  };

  const clearLevel = (levelId: string) => {
    setLevels((prev) =>
      prev.map((l) => (l.id === levelId ? { ...l, approvers: [], minApproversRequired: 0 } : l)),
    );
  };

  const removeLevel = (levelId: string) => {
    setLevels((prev) => {
      const next = prev.filter((l) => l.id !== levelId);
      return next.length ? next.map((l, i) => ({ ...l, levelOrder: i + 1 })) : defaultApprovalLevels();
    });
  };

  const setMinRequired = (levelId: string, value: number) => {
    setLevels((prev) =>
      prev.map((l) => {
        if (l.id !== levelId) return l;
        const max = l.approvers.length;
        return { ...l, minApproversRequired: Math.max(0, Math.min(value, max)) };
      }),
    );
  };

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      const payload = { levels: toApiPayload(levels) };

      if (templateId) {
        const res = await authenticatedFetch(
          `${apiBaseUrl}/api/leave/policy-templates/${templateId}/approval-levels`,
          { method: "PUT", body: JSON.stringify(payload) },
        );
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof body.error === "string" ? body.error : "Could not save approval levels.");
          return;
        }
      } else {
        writeApprovalDraft(levels);
      }
      router.push(returnTo);
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#F8FAFC] text-[13px] font-medium text-[#98A2B3]">
        Loading approval policy…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 text-[#0F0F1A]">
      <main className="mx-auto max-w-[900px] px-4 pb-8 pt-6 sm:px-8">
        <button
          type="button"
          onClick={() => router.push(returnTo)}
          className="text-[13px] font-semibold text-[#2563EB] hover:underline"
        >
          ← Back
        </button>

        <h1 className="mt-6 flex items-center gap-2 text-[20px] font-black text-[#0F0F1A]">
          Approval Policy
          <Info className="h-4 w-4 text-[#98A2B3]" aria-hidden />
        </h1>

        <div className="mt-6 space-y-6">
          {levels.map((level) => (
            <section
              key={level.id}
              className="rounded-xl border border-[#E5EAF2] bg-white px-6 py-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-[16px] font-black text-[#0F0F1A]">Level {level.levelOrder}</h2>
                  <p className="mt-1 text-[13px] font-medium text-[#667085]">
                    Configure approvers at levels. Approvers can approve in any order.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right">
                    <p className="text-[11px] font-medium text-[#667085]">
                      Minimum number of approvers required for this level
                    </p>
                    <div className="mt-1 flex items-center justify-end gap-2">
                      <input
                        type="number"
                        min={0}
                        max={level.approvers.length}
                        value={level.minApproversRequired}
                        onChange={(e) => setMinRequired(level.id, parseInt(e.target.value, 10) || 0)}
                        className="h-9 w-14 rounded-lg border border-[#E2E8F0] px-2 text-center text-[14px] font-semibold"
                      />
                      <span className="text-[14px] font-semibold text-[#344054]">
                        out of {level.approvers.length}
                      </span>
                    </div>
                  </div>
                  {levels.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeLevel(level.id)}
                      className="text-[13px] font-semibold text-red-600 hover:underline"
                    >
                      Remove Level
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => clearLevel(level.id)}
                    className="text-[13px] font-semibold text-red-600 hover:underline"
                  >
                    Clear Level
                  </button>
                </div>
              </div>

              {level.approvers.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {level.approvers.map((approver) => (
                    <li
                      key={approver.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E5EAF2] bg-[#FAFBFC] px-4 py-3"
                    >
                      <div>
                        <p className="text-[14px] font-bold text-[#1F2937]">
                          {approverTypeLabel(approver.approverType)} — {approver.approverName}
                        </p>
                        {approver.substituteEnabled ? (
                          <p className="text-[12px] font-medium text-[#667085]">Substitute enabled</p>
                        ) : null}
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveLevelId(level.id);
                            setEditingApprover(approver);
                            setModalOpen(true);
                          }}
                          className="text-[13px] font-semibold text-[#2563EB] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setLevels((prev) =>
                              prev.map((l) =>
                                l.id === level.id
                                  ? {
                                      ...l,
                                      approvers: l.approvers.filter((a) => a.id !== approver.id),
                                      minApproversRequired: Math.min(
                                        l.minApproversRequired,
                                        l.approvers.length - 1,
                                      ),
                                    }
                                  : l,
                              ),
                            )
                          }
                          className="text-[13px] font-semibold text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}

              <button
                type="button"
                onClick={() => openAddApprover(level.id)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#4F7FFF] bg-[#FAFCFF] py-8 text-[14px] font-bold text-[#2563EB] transition hover:bg-[#EFF6FF]"
              >
                <Plus className="h-5 w-5" />
                Add Approver
              </button>
            </section>
          ))}

          <button
            type="button"
            onClick={addLevel}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E5EAF2] bg-white py-4 text-[14px] font-bold text-[#344054] shadow-sm hover:bg-[#F8FAFC]"
          >
            <Plus className="h-4 w-4" />
            Add New Level
          </button>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-800">
              {error}
            </p>
          ) : null}
        </div>
      </main>

      <AddApproverModal
        open={modalOpen}
        levelOrder={activeLevelOrder}
        initial={editingApprover}
        onClose={() => {
          setModalOpen(false);
          setEditingApprover(null);
        }}
        onSave={saveApprover}
      />

      <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-[#EEF2F6] bg-white/95 px-5 py-4 shadow-[0_-10px_30px_rgba(15,23,42,0.06)] backdrop-blur">
        <div className="mx-auto flex max-w-[900px] items-center justify-between gap-4">
          <p className="text-[13px] font-medium text-[#667085]">{approvalSummary(levels)}</p>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="h-11 min-w-[200px] rounded-lg bg-[#2563EB] px-8 text-[14px] font-bold text-white hover:bg-[#1d4ed8] disabled:bg-[#CBD5E1]"
          >
            {saving ? "Saving…" : "Save Approval Levels"}
          </button>
        </div>
      </footer>
    </div>
  );
}

export default function ApprovalPolicyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center bg-[#F8FAFC] text-[13px] font-medium text-[#98A2B3]">
          Loading…
        </div>
      }
    >
      <ApprovalPolicyContent />
    </Suspense>
  );
}
