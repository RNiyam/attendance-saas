export type ApproverType =
  | "owner"
  | "admin"
  | "restricted_admin"
  | "attendance_supervisors"
  | "reporting_manager";

export type ApprovalApprover = {
  id: string;
  approverType: ApproverType;
  approverName: string;
  substituteEnabled: boolean;
};

export type ApprovalLevel = {
  id: string;
  levelOrder: number;
  minApproversRequired: number;
  approvers: ApprovalApprover[];
};

export const APPROVAL_DRAFT_STORAGE_KEY = "leavePolicyApprovalDraft";

export const APPROVER_TYPE_OPTIONS: { value: ApproverType; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "restricted_admin", label: "Restricted Admin" },
  { value: "attendance_supervisors", label: "Attendance Supervisors" },
  { value: "reporting_manager", label: "Reporting Manager" },
];

export const APPROVER_NAME_BY_TYPE: Record<ApproverType, string[]> = {
  owner: ["Any Owner"],
  admin: ["Any Admin"],
  restricted_admin: ["Any Restricted Admin"],
  attendance_supervisors: ["Any Attendance Supervisor"],
  reporting_manager: ["Reporting Manager"],
};

export function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyLevel(order: number): ApprovalLevel {
  return {
    id: uid(),
    levelOrder: order,
    minApproversRequired: 0,
    approvers: [],
  };
}

export function defaultApprovalLevels(): ApprovalLevel[] {
  return [createEmptyLevel(1)];
}

export function readApprovalDraft(): ApprovalLevel[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(APPROVAL_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ApprovalLevel[];
  } catch {
    return null;
  }
}

export function writeApprovalDraft(levels: ApprovalLevel[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(APPROVAL_DRAFT_STORAGE_KEY, JSON.stringify(levels));
}

export function clearApprovalDraft() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(APPROVAL_DRAFT_STORAGE_KEY);
}

export function approvalSummary(levels: ApprovalLevel[]): string {
  if (!levels.length) return "Not configured";
  const approverCount = levels.reduce((n, l) => n + l.approvers.length, 0);
  return `${levels.length} level(s), ${approverCount} approver(s)`;
}

export function toApiPayload(levels: ApprovalLevel[]) {
  return levels.map((level) => ({
    levelOrder: level.levelOrder,
    minApproversRequired: level.minApproversRequired,
    approvers: level.approvers.map((a, index) => ({
      approverType: a.approverType,
      approverName: a.approverName,
      substituteEnabled: a.substituteEnabled ? 1 : 0,
      sortOrder: index,
    })),
  }));
}

export function fromApiLevels(
  rows: {
    id?: number;
    levelOrder: number;
    minApproversRequired: number;
    approvers: {
      id?: number;
      approverType: ApproverType;
      approverName: string;
      substituteEnabled: number;
    }[];
  }[],
): ApprovalLevel[] {
  if (!rows.length) return defaultApprovalLevels();
  return rows.map((level) => ({
    id: String(level.id ?? uid()),
    levelOrder: level.levelOrder,
    minApproversRequired: level.minApproversRequired,
    approvers: level.approvers.map((a) => ({
      id: String(a.id ?? uid()),
      approverType: a.approverType,
      approverName: a.approverName,
      substituteEnabled: a.substituteEnabled === 1,
    })),
  }));
}
