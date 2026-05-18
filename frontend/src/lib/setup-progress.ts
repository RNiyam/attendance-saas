export type SetupStepState = "completed" | "active" | "locked";

export type SetupFlags = {
  kybSkipped: boolean;
  businessFunctionsDone: boolean;
  taxesComplianceDone: boolean;
  attendanceTemplatesDone: boolean;
  shiftsDone: boolean;
  holidayPolicyDone: boolean;
  leavePolicyDone: boolean;
};

const KEYS = {
  kybSkipped: "setup:kybSkipped",
  businessFunctionsDone: "setup:businessFunctionsDone",
  taxesComplianceDone: "setup:taxesComplianceDone",
  attendanceTemplatesDone: "setup:attendanceTemplatesDone",
  shiftsDone: "setup:shiftsDone",
  holidayPolicyDone: "setup:holidayPolicyDone",
  leavePolicyDone: "setup:leavePolicyDone",
  /** @deprecated legacy — cleared when steps are incomplete */
  attendancePhaseCompleted: "setup:attendancePhaseCompleted",
} as const;

function readBool(key: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(key) === "true";
}

export function readSetupFlags(): SetupFlags {
  const flags: SetupFlags = {
    kybSkipped: readBool(KEYS.kybSkipped),
    businessFunctionsDone: readBool(KEYS.businessFunctionsDone),
    taxesComplianceDone: readBool(KEYS.taxesComplianceDone),
    attendanceTemplatesDone: readBool(KEYS.attendanceTemplatesDone),
    shiftsDone: readBool(KEYS.shiftsDone),
    holidayPolicyDone: readBool(KEYS.holidayPolicyDone),
    leavePolicyDone: readBool(KEYS.leavePolicyDone),
  };

  // Drop incorrect legacy flag that marked the whole phase done after "Continue" on templates.
  if (readBool(KEYS.attendancePhaseCompleted) && !isAttendancePhaseComplete(flags)) {
    try {
      localStorage.removeItem(KEYS.attendancePhaseCompleted);
    } catch {
      /* ignore */
    }
  }

  return flags;
}

/** Fired after localStorage setup flags change (same tab). */
export const SETUP_FLAGS_CHANGED = "workforceos:setup-flags-changed";

export function writeSetupFlag(
  key: keyof Omit<SetupFlags, never>,
  value: boolean,
): void {
  if (typeof window === "undefined") return;
  const storageKey = KEYS[key];
  if (value) localStorage.setItem(storageKey, "true");
  else localStorage.removeItem(storageKey);

  const flags = readSetupFlags();
  if (isAttendancePhaseComplete(flags)) {
    localStorage.setItem(KEYS.attendancePhaseCompleted, "true");
  } else {
    localStorage.removeItem(KEYS.attendancePhaseCompleted);
  }

  window.dispatchEvent(new CustomEvent(SETUP_FLAGS_CHANGED));
}

/** Query param on /dashboard/setup so the hub re-reads flags after client navigation. */
export function setupHubHref(flag?: keyof SetupFlags): string {
  return flag ? `/dashboard/setup?${flag}=true` : "/dashboard/setup";
}

export function isOrgSetupComplete(flags: SetupFlags): boolean {
  return flags.taxesComplianceDone;
}

export function isAttendancePhaseComplete(flags: SetupFlags): boolean {
  return (
    flags.attendanceTemplatesDone &&
    flags.shiftsDone &&
    flags.holidayPolicyDone &&
    flags.leavePolicyDone
  );
}

export type AttendanceStripStep = "attendance" | "shifts" | "holiday" | "leave";

/** Which attendance sub-step is currently in progress (first incomplete). */
export function currentAttendanceStep(flags: SetupFlags): AttendanceStripStep {
  if (!flags.attendanceTemplatesDone) return "attendance";
  if (!flags.shiftsDone) return "shifts";
  if (!flags.holidayPolicyDone) return "holiday";
  return "leave";
}

export function attendanceStripTabState(
  tab: AttendanceStripStep,
  flags: SetupFlags,
): SetupStepState {
  if (!isOrgSetupComplete(flags)) return "locked";

  const order: AttendanceStripStep[] = ["attendance", "shifts", "holiday", "leave"];
  const tabIdx = order.indexOf(tab);
  const current = currentAttendanceStep(flags);

  const doneMap: Record<AttendanceStripStep, boolean> = {
    attendance: flags.attendanceTemplatesDone,
    shifts: flags.shiftsDone,
    holiday: flags.holidayPolicyDone,
    leave: flags.leavePolicyDone,
  };

  if (doneMap[tab]) return "completed";

  const currentIdx = order.indexOf(current);
  if (tabIdx === currentIdx) return "active";
  if (tabIdx < currentIdx) return "completed";
  return "locked";
}

export function attendanceSetupStepState(
  step: "templates" | "shifts" | "holiday" | "leave",
  flags: SetupFlags,
): SetupStepState {
  if (!isOrgSetupComplete(flags)) return "locked";

  const order = ["templates", "shifts", "holiday", "leave"] as const;
  const doneMap = {
    templates: flags.attendanceTemplatesDone,
    shifts: flags.shiftsDone,
    holiday: flags.holidayPolicyDone,
    leave: flags.leavePolicyDone,
  };

  if (doneMap[step]) return "completed";

  const current = currentAttendanceStep(flags);
  const stepToStrip: Record<typeof step, AttendanceStripStep> = {
    templates: "attendance",
    shifts: "shifts",
    holiday: "holiday",
    leave: "leave",
  };

  if (stepToStrip[step] === current) return "active";

  const orderStrip: AttendanceStripStep[] = ["attendance", "shifts", "holiday", "leave"];
  if (orderStrip.indexOf(stepToStrip[step]) < orderStrip.indexOf(current)) return "completed";

  return "locked";
}

export function countAttendanceStepsDone(flags: SetupFlags): number {
  return [
    flags.attendanceTemplatesDone,
    flags.shiftsDone,
    flags.holidayPolicyDone,
    flags.leavePolicyDone,
  ].filter(Boolean).length;
}
