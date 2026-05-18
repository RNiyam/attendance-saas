"use client";

import { ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  APPROVER_NAME_BY_TYPE,
  APPROVER_TYPE_OPTIONS,
  type ApprovalApprover,
  type ApproverType,
} from "@/lib/leave-approval";

type Props = {
  open: boolean;
  levelOrder: number;
  initial?: ApprovalApprover | null;
  onClose: () => void;
  onSave: (approver: ApprovalApprover) => void;
};

export default function AddApproverModal({ open, levelOrder, initial, onClose, onSave }: Props) {
  const [approverType, setApproverType] = useState<ApproverType>("admin");
  const [approverName, setApproverName] = useState("Any Admin");
  const [substituteEnabled, setSubstituteEnabled] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setApproverType(initial.approverType);
      setApproverName(initial.approverName);
      setSubstituteEnabled(initial.substituteEnabled);
    } else {
      setApproverType("admin");
      setApproverName("Any Admin");
      setSubstituteEnabled(false);
    }
  }, [open, initial]);

  if (!open) return null;

  const nameOptions = APPROVER_NAME_BY_TYPE[approverType] ?? ["Any Admin"];

  const handleTypeChange = (type: ApproverType) => {
    setApproverType(type);
    setApproverName(APPROVER_NAME_BY_TYPE[type][0] ?? "Any Admin");
  };

  const save = () => {
    onSave({
      id: initial?.id ?? `${Date.now()}`,
      approverType,
      approverName,
      substituteEnabled,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-[480px] rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#EEF2F6] px-6 py-5">
          <div>
            <h2 className="text-[18px] font-black text-[#0F0F1A]">Approver {levelOrder}</h2>
            <p className="mt-0.5 text-[13px] font-medium text-[#667085]">
              Add approver details for level {levelOrder}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#667085] hover:bg-[#F4F7FB]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-[#475467]">
              Approver Type <span className="text-red-500">*</span>
            </span>
            <span className="relative block">
              <select
                value={approverType}
                onChange={(e) => handleTypeChange(e.target.value as ApproverType)}
                className="h-11 w-full appearance-none rounded-lg border border-[#E2E8F0] bg-white px-3 pr-9 text-[14px] font-medium text-[#344054] outline-none focus:border-[#4F7FFF] focus:ring-2 focus:ring-[#4F7FFF]/10"
              >
                {APPROVER_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-[#475467]">
              Approver Name <span className="text-red-500">*</span>
            </span>
            <span className="relative block">
              <select
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                className="h-11 w-full appearance-none rounded-lg border border-[#E2E8F0] bg-white px-3 pr-9 text-[14px] font-medium text-[#344054] outline-none focus:border-[#4F7FFF] focus:ring-2 focus:ring-[#4F7FFF]/10"
              >
                {nameOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
            </span>
          </label>

          <div className="flex items-center justify-between gap-4 rounded-lg bg-[#F8FAFC] px-4 py-4">
            <div>
              <p className="text-[14px] font-semibold text-[#0F0F1A]">Substitute Approver</p>
              <p className="mt-1 text-[12px] font-medium leading-snug text-[#667085]">
                This approver will be able to approve in case the main approver does not exist (deleted /
                deactivated)
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={substituteEnabled}
              onClick={() => setSubstituteEnabled((v) => !v)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                substituteEnabled ? "bg-[#2563EB]" : "bg-[#CBD5E1]"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                  substituteEnabled ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex gap-3 border-t border-[#EEF2F6] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-lg border border-[#4F7FFF] text-[14px] font-bold text-[#2563EB] hover:bg-[#EFF6FF]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            className="h-11 flex-1 rounded-lg bg-[#2563EB] text-[14px] font-bold text-white hover:bg-[#1d4ed8]"
          >
            Save Approver
          </button>
        </div>
      </div>
    </div>
  );
}
