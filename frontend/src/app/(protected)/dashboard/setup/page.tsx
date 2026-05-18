"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { DragEvent, FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Check,
  CircleDollarSign,
  Clock3,
  GraduationCap,
  Info,
  Lock,
  Upload,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  ChevronRight,
  Zap,
} from "lucide-react";
import {
  attendanceSetupStepState,
  countAttendanceStepsDone,
  isAttendancePhaseComplete,
  isOrgSetupComplete,
  readSetupFlags,
  SETUP_FLAGS_CHANGED,
  writeSetupFlag,
  type SetupFlags,
} from "@/lib/setup-progress";
import { apiBaseUrl, authHeaders, authenticatedFetch } from "@/services/http";

type MeResponse = {
  user: { email: string };
  organization: { name: string; slug: string; legalName: string | null } | null;
  displayName: string;
};

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

type PhaseStatus = "completed" | "active" | "locked";
type SetupScreen = "overview" | "add-staff";
type AddMode = "single" | "bulk";

type EmployeeType = {
  id: string;
  code: "FULL_TIME" | "PART_TIME" | "INTERN" | "PROBATION";
  icon: typeof UserCheck;
  label: string;
  sub: string;
  badge?: string;
  hint: string;
  color: string;
  bg: string;
};

const EMPLOYEE_TYPES: EmployeeType[] = [
  {
    id: "full-time",
    code: "FULL_TIME",
    icon: UserCheck,
    label: "Full-time employee",
    sub: "Permanent, salaried, full benefits & compliance",
    badge: "Most common",
    hint: "Full-time employees get salary templates, PF, ESI, PT, TDS, leave & attendance policies — all from your setup.",
    color: "#4F7FFF",
    bg: "#EFF6FF",
  },
  {
    id: "part-time",
    code: "PART_TIME",
    icon: UserMinus,
    label: "Part-time employee",
    sub: "Fixed hours, prorated salary & benefits",
    hint: "Part-time employees are linked to your shift and attendance templates with prorated salary calculations.",
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
  {
    id: "intern",
    code: "INTERN",
    icon: GraduationCap,
    label: "Intern / trainee",
    sub: "Stipend-based, time-bound, may need TDS handling",
    hint: "Interns receive a fixed monthly stipend. TDS applies if stipend exceeds threshold. No PF/ESI.",
    color: "#059669",
    bg: "#ECFDF5",
  },
  {
    id: "probation",
    code: "PROBATION",
    icon: CalendarClock,
    label: "On probation",
    sub: "Trial period, converts to regular on confirmation",
    hint: "Probation employees follow the same payroll as full-time but are flagged for confirmation after the trial period.",
    color: "#DC2626",
    bg: "#FEF2F2",
  },
];

type Phase = {
  id: string;
  title: string;
  shortTitle: string;
  meta: string;
  status: PhaseStatus;
  icon: typeof Building2;
  color: string;
  steps: {
    label: string;
    optional?: boolean;
    statusLabel?: string;
    statusTone?: "amber" | "emerald";
    action?: string;
    actionVariant?: "primary" | "success";
    href: string;
    state: PhaseStatus;
  }[];
};

function AddStaffScreen({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<AddMode | null>(null);
  const selectedType = EMPLOYEE_TYPES.find((type) => type.id === selected) ?? null;

  if (addMode === "single" && selectedType) {
    return <AddSingleEmployeeForm type={selectedType} onBack={() => setAddMode(null)} />;
  }

  if (addMode === "bulk" && selectedType) {
    return <BulkUploadScreen type={selectedType} onBack={() => setAddMode(null)} />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F7F5F0] text-[#0F0F1A]">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(212,228,255,0.52)_0%,rgba(247,245,240,0.94)_34%,rgba(255,240,212,0.36)_68%,rgba(255,255,255,0.72)_100%)]"
        aria-hidden
      />
      <div className="relative z-10 mx-auto w-full max-w-[780px] px-4 pb-24 pt-10 sm:px-6">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-[13px] font-bold text-[#6B6B80] transition-colors hover:text-[#0F0F1A]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Setup
        </button>

        <div className="mb-8">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#4F7FFF]">Add &amp; Invite Staff</p>
          <h1 className="mt-1 text-[28px] font-black tracking-[-0.03em] text-[#0F0F1A] sm:text-[32px]">
            Who are you adding?
          </h1>
          <p className="mt-2 max-w-lg text-[14px] font-medium text-[#6B6B80]">
            Choose the employment type to set up the right profile, payroll, and compliance.
          </p>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {EMPLOYEE_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selected === type.id;

            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelected(type.id)}
                className={`group relative flex items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-[#4F7FFF] bg-white shadow-lg shadow-[#4F7FFF]/10"
                    : "border-[#E8E5F0] bg-white hover:border-[#C7D7FE] hover:shadow-md hover:shadow-black/[0.04]"
                }`}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: type.bg }}
                >
                  <Icon className="h-5 w-5" style={{ color: type.color }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-black text-[#0F0F1A]">{type.label}</span>
                    {type.badge ? (
                      <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#4F7FFF]">
                        {type.badge}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-[12px] font-medium leading-snug text-[#9CA3AF]">{type.sub}</span>
                </span>
                {isSelected ? (
                  <span className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-[#4F7FFF]">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div
          className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 transition-all duration-300 ${
            selectedType ? "border-[#C7D7FE] bg-[#EFF6FF]" : "border-[#E8E5F0] bg-white"
          }`}
        >
          <Info
            className={`mt-0.5 h-4 w-4 shrink-0 ${selectedType ? "text-[#4F7FFF]" : "text-[#C4C4D4]"}`}
          />
          <p className="text-[13px] font-medium leading-relaxed text-[#6B6B80]">
            {selectedType ? selectedType.hint : "Select an employment type above to continue."}
          </p>
        </div>

        {selected ? (
          <div className="mb-6 overflow-hidden rounded-2xl border border-[#E8E5F0] bg-white shadow-sm">
            <div className="border-b border-[#E8E5F0] bg-[#FAFAFA] px-5 py-3">
              <p className="text-[12px] font-black uppercase tracking-wide text-[#9CA3AF]">
                How would you like to add?
              </p>
            </div>
            <div className="grid grid-cols-1 divide-y divide-[#E8E5F0] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <button
                type="button"
                onClick={() => setAddMode("single")}
                className="group flex items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-[#F8FBFF]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF]">
                  <UserPlus className="h-5 w-5 text-[#4F7FFF]" />
                </span>
                <span>
                  <span className="block text-[14px] font-black text-[#0F0F1A]">Add single employee</span>
                  <span className="block text-[12px] font-medium text-[#9CA3AF]">Fill out a form for one person</span>
                </span>
                <ChevronRight className="ml-auto h-4 w-4 text-[#D1D5DB] transition-colors group-hover:text-[#4F7FFF]" />
              </button>
              <button
                type="button"
                onClick={() => setAddMode("bulk")}
                className="group flex items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-[#F8FBFF]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF]">
                  <Upload className="h-5 w-5 text-[#4F7FFF]" />
                </span>
                <span>
                  <span className="block text-[14px] font-black text-[#0F0F1A]">Bulk upload via CSV</span>
                  <span className="block text-[12px] font-medium text-[#9CA3AF]">Upload many employees at once</span>
                </span>
                <ChevronRight className="ml-auto h-4 w-4 text-[#D1D5DB] transition-colors group-hover:text-[#4F7FFF]" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end">
            <button
              type="button"
              disabled
              className="flex h-10 w-44 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#E8E5F0] text-[13px] font-black text-[#9CA3AF]"
            >
              Continue
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

type OnboardingOption = { id: number; name?: string; title?: string; employeeCode?: string };
type OnboardingOptions = {
  branches: OnboardingOption[];
  departments: OnboardingOption[];
  designations: OnboardingOption[];
  managers: OnboardingOption[];
  shifts: OnboardingOption[];
  attendancePolicies: OnboardingOption[];
  holidayTemplates: OnboardingOption[];
  leavePolicyTemplates: OnboardingOption[];
  salaryTemplates: OnboardingOption[];
};

const EMPTY_OPTIONS: OnboardingOptions = {
  branches: [],
  departments: [],
  designations: [],
  managers: [],
  shifts: [],
  attendancePolicies: [],
  holidayTemplates: [],
  leavePolicyTemplates: [],
  salaryTemplates: [],
};

function numberOrUndefined(value: string) {
  return value ? Number(value) : undefined;
}

function compactPayload<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== "" && value !== undefined && value !== null),
  );
}

function AddSingleEmployeeForm({ type, onBack }: { type: EmployeeType; onBack: () => void }) {
  const Icon = type.icon;
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    departmentId: "",
    designationId: "",
    branchId: "",
    joiningDate: "",
    employeeId: "",
    managerEmployeeId: "",
    managerName: "",
    workLocation: "",
    shiftId: "",
    attendancePolicyId: "",
    holidayTemplateId: "",
    leavePolicyTemplateId: "",
    salaryTemplateId: "",
    weeklyOffPolicy: "",
    ctc: "",
    salaryStructure: "",
    bankAccountNumber: "",
    bankIfsc: "",
    pan: "",
    aadhaar: "",
    pfNumber: "",
    esiNumber: "",
    workHoursPerWeek: "",
    hourlyRate: "",
    proratedSalaryPercent: "",
    contractStart: "",
    contractEnd: "",
    vendorCompany: "",
    billingCycle: "",
    invoiceAmount: "",
    dailyWage: "",
    workUnit: "",
    supervisor: "",
    internshipStart: "",
    internshipEnd: "",
    mentor: "",
    stipend: "",
    college: "",
    probationStart: "",
    probationEnd: "",
    confirmationDate: "",
    onboardingNotes: "",
    sendInvite: true,
  });
  const [options, setOptions] = useState<OnboardingOptions>(EMPTY_OPTIONS);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    const id = window.setTimeout(async () => {
      try {
        const res = await authenticatedFetch(`${apiBaseUrl}/api/employees/onboarding-options`);
        if (res.ok) {
          setOptions({ ...EMPTY_OPTIONS, ...((await res.json()) as Partial<OnboardingOptions>) });
        }
      } finally {
        setOptionsLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = compactPayload({
      employeeType: type.code,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      employeeCode: form.employeeId || `EMP-${Date.now().toString().slice(-6)}`,
      joiningDate: form.joiningDate,
      gender: form.gender,
      dob: form.dob,
      branchId: numberOrUndefined(form.branchId),
      departmentId: numberOrUndefined(form.departmentId),
      designationId: numberOrUndefined(form.designationId),
      managerEmployeeId: numberOrUndefined(form.managerEmployeeId),
      managerName: form.managerName,
      workLocation: form.workLocation,
      shiftId: numberOrUndefined(form.shiftId),
      attendancePolicyId: numberOrUndefined(form.attendancePolicyId),
      holidayTemplateId: numberOrUndefined(form.holidayTemplateId),
      leavePolicyTemplateId: numberOrUndefined(form.leavePolicyTemplateId),
      salaryTemplateId: numberOrUndefined(form.salaryTemplateId),
      weeklyOffPolicy: form.weeklyOffPolicy,
      ctc: form.ctc,
      salaryStructure: form.salaryStructure,
      bankAccountNumber: form.bankAccountNumber,
      bankIfsc: form.bankIfsc,
      pan: form.pan,
      aadhaar: form.aadhaar,
      pfNumber: form.pfNumber,
      esiNumber: form.esiNumber,
      workHoursPerWeek: form.workHoursPerWeek,
      hourlyRate: form.hourlyRate,
      proratedSalaryPercent: form.proratedSalaryPercent,
      contractStart: form.contractStart,
      contractEnd: form.contractEnd,
      vendorCompany: form.vendorCompany,
      billingCycle: form.billingCycle,
      invoiceAmount: form.invoiceAmount,
      dailyWage: form.dailyWage,
      workUnit: form.workUnit,
      supervisor: form.supervisor,
      internshipStart: form.internshipStart,
      internshipEnd: form.internshipEnd,
      mentor: form.mentor,
      stipend: form.stipend,
      college: form.college,
      probationStart: form.probationStart,
      probationEnd: form.probationEnd,
      confirmationDate: form.confirmationDate,
      onboardingNotes: form.onboardingNotes,
      sendInvite: form.sendInvite,
      invitedByName: "HR Team",
      appInviteBaseUrl: `${window.location.origin}/activate`,
    });

    try {
      const res = await authenticatedFetch(`${apiBaseUrl}/api/employees/onboard`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(typeof body.error === "string" ? body.error : "Could not add employee.");
        return;
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Network error while adding employee.");
    } finally {
      setSaving(false);
    }
  };

  const isPayrollEmployee = type.code === "FULL_TIME" || type.code === "PART_TIME" || type.code === "PROBATION";
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F7F5F0] text-[#0F0F1A]">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(212,228,255,0.52)_0%,rgba(247,245,240,0.94)_34%,rgba(255,240,212,0.36)_68%,rgba(255,255,255,0.72)_100%)]"
        aria-hidden
      />
      <div className="relative z-10 mx-auto w-full max-w-[680px] px-4 pb-28 pt-10 sm:px-6">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-[13px] font-bold text-[#6B6B80] transition-colors hover:text-[#0F0F1A]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="mb-5 inline-flex items-center gap-2 rounded-xl px-4 py-2" style={{ background: type.bg }}>
          <Icon className="h-4 w-4" style={{ color: type.color }} />
          <span className="text-[13px] font-black" style={{ color: type.color }}>
            {type.label}
          </span>
        </div>

        <h1 className="mb-1 text-[24px] font-black tracking-[-0.03em] text-[#0F0F1A]">Add employee details</h1>
        <p className="mb-8 text-[13px] font-medium text-[#9CA3AF]">
          Fill the profile, rules, and payroll behavior. The selected templates are linked when the employee is saved.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <FormSection title="Basic">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextInput label="First name" required value={form.firstName} onChange={(value) => set("firstName", value)} placeholder="Riya" />
            <TextInput label="Last name" required value={form.lastName} onChange={(value) => set("lastName", value)} placeholder="Sharma" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextInput label="Work email" type="email" required value={form.email} onChange={(value) => set("email", value)} placeholder="riya@company.com" />
            <TextInput label="Phone" type="tel" value={form.phone} onChange={(value) => set("phone", value)} placeholder="+91 98765 43210" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectInput label="Gender" value={form.gender} onChange={(value) => set("gender", value)} options={[{ id: "male", name: "Male" }, { id: "female", name: "Female" }, { id: "other", name: "Other" }]} />
            <TextInput label="DOB" type="date" value={form.dob} onChange={(value) => set("dob", value)} />
          </div>
          </FormSection>

          <FormSection title="Work">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextInput label="Employee ID" required value={form.employeeId} onChange={(value) => set("employeeId", value)} placeholder="EMP-001" />
            <TextInput label="Date of joining" type="date" required value={form.joiningDate} onChange={(value) => set("joiningDate", value)} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectInput label="Department" value={form.departmentId} onChange={(value) => set("departmentId", value)} options={options.departments} loading={optionsLoading} />
            <SelectInput label="Designation" value={form.designationId} onChange={(value) => set("designationId", value)} options={options.designations.map((item) => ({ ...item, name: item.title ?? item.name }))} loading={optionsLoading} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectInput label="Manager" value={form.managerEmployeeId} onChange={(value) => set("managerEmployeeId", value)} options={options.managers} loading={optionsLoading} />
            <SelectInput label="Location" value={form.branchId} onChange={(value) => set("branchId", value)} options={options.branches} loading={optionsLoading} />
          </div>
          <TextInput label="Manager name/email fallback" value={form.managerName} onChange={(value) => set("managerName", value)} placeholder="Manager name or email" />
          </FormSection>

          <FormSection title="Rules">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SelectInput label="Shift Template" value={form.shiftId} onChange={(value) => set("shiftId", value)} options={options.shifts} loading={optionsLoading} />
              <SelectInput label="Attendance Template" value={form.attendancePolicyId} onChange={(value) => set("attendancePolicyId", value)} options={options.attendancePolicies} loading={optionsLoading} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SelectInput label="Holiday Template" value={form.holidayTemplateId} onChange={(value) => set("holidayTemplateId", value)} options={options.holidayTemplates} loading={optionsLoading} />
              <SelectInput label="Leave Policy" value={form.leavePolicyTemplateId} onChange={(value) => set("leavePolicyTemplateId", value)} options={options.leavePolicyTemplates} loading={optionsLoading} />
            </div>
            <TextInput label="Weekly Off" value={form.weeklyOffPolicy} onChange={(value) => set("weeklyOffPolicy", value)} placeholder="Sunday" />
          </FormSection>

          {isPayrollEmployee ? (
            <FormSection title="Salary">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextInput label="CTC" type="number" value={form.ctc} onChange={(value) => set("ctc", value)} placeholder="600000" />
                <SelectInput label="Salary Template" value={form.salaryTemplateId} onChange={(value) => set("salaryTemplateId", value)} options={options.salaryTemplates} loading={optionsLoading} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextInput label="Bank account" value={form.bankAccountNumber} onChange={(value) => set("bankAccountNumber", value)} />
                <TextInput label="IFSC" value={form.bankIfsc} onChange={(value) => set("bankIfsc", value)} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextInput label="PAN" value={form.pan} onChange={(value) => set("pan", value)} />
                <TextInput label="Aadhaar" value={form.aadhaar} onChange={(value) => set("aadhaar", value)} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextInput label="PF" value={form.pfNumber} onChange={(value) => set("pfNumber", value)} />
                <TextInput label="ESI" value={form.esiNumber} onChange={(value) => set("esiNumber", value)} />
              </div>
            </FormSection>
          ) : null}

          {type.code === "PART_TIME" ? (
            <FormSection title="Part-time Rules">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <TextInput label="Work hours/week" type="number" value={form.workHoursPerWeek} onChange={(value) => set("workHoursPerWeek", value)} />
                <TextInput label="Hourly rate" type="number" value={form.hourlyRate} onChange={(value) => set("hourlyRate", value)} />
                <TextInput label="Prorated salary %" type="number" value={form.proratedSalaryPercent} onChange={(value) => set("proratedSalaryPercent", value)} />
              </div>
            </FormSection>
          ) : null}

          {type.code === "INTERN" ? (
            <FormSection title="Internship">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextInput label="Internship Start" type="date" value={form.internshipStart} onChange={(value) => set("internshipStart", value)} />
                <TextInput label="Internship End" type="date" value={form.internshipEnd} onChange={(value) => set("internshipEnd", value)} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextInput label="Mentor" value={form.mentor} onChange={(value) => set("mentor", value)} />
                <TextInput label="Stipend" type="number" value={form.stipend} onChange={(value) => set("stipend", value)} />
              </div>
              <TextInput label="College" value={form.college} onChange={(value) => set("college", value)} />
            </FormSection>
          ) : null}

          {type.code === "PROBATION" ? (
            <FormSection title="Probation">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <TextInput label="Probation Start" type="date" value={form.probationStart} onChange={(value) => set("probationStart", value)} />
                <TextInput label="Probation End" type="date" value={form.probationEnd} onChange={(value) => set("probationEnd", value)} />
                <TextInput label="Confirmation Date" type="date" value={form.confirmationDate} onChange={(value) => set("confirmationDate", value)} />
              </div>
            </FormSection>
          ) : null}

          <div className="flex items-center justify-between rounded-xl border border-[#E8E5F0] bg-white px-5 py-4">
            <div>
              <p className="text-[14px] font-black text-[#0F0F1A]">Send invite email</p>
              <p className="text-[12px] font-medium text-[#9CA3AF]">Employee gets a link to set up their account</p>
            </div>
            <button
              type="button"
              aria-pressed={form.sendInvite}
              onClick={() => set("sendInvite", !form.sendInvite)}
              className={`relative h-6 w-11 rounded-full transition-colors ${form.sendInvite ? "bg-[#4F7FFF]" : "bg-[#E8E5F0]"}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  form.sendInvite ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-[#C7D7FE] bg-[#EFF6FF] px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#4F7FFF]" />
            <p className="text-[12px] font-medium leading-relaxed text-[#4F7FFF]">
              This saves one employee record and links the selected shift, attendance, holiday, leave, and salary templates where applicable.
            </p>
          </div>

          {error ? (
            <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-600">
              {error}
            </p>
          ) : null}

          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#E8E5F0] bg-[#F7F5F0]/95 px-4 py-4 backdrop-blur-md">
            <div className="mx-auto flex max-w-[680px] items-center justify-between gap-3">
              <p className="text-[12px] font-semibold text-[#9CA3AF]">{type.label} · Basic profile</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="flex h-10 w-24 items-center justify-center rounded-xl border-2 border-[#E8E5F0] bg-white text-[13px] font-bold text-[#6B6B80] transition hover:border-[#4F7FFF] hover:text-[#4F7FFF]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`flex h-10 w-44 items-center justify-center gap-2 rounded-xl text-[13px] font-black text-white shadow-lg transition ${
                    saved
                      ? "bg-emerald-500 shadow-emerald-500/20"
                      : saving
                        ? "bg-[#9CA3AF]"
                        : "bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] shadow-[#4F7FFF]/20 hover:opacity-[0.97]"
                  }`}
                >
                  {saving ? (
                    "Saving..."
                  ) : saved ? (
                    <>
                      <Check className="h-4 w-4" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Save &amp; Continue
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-[#E8E5F0] bg-white/80 p-4">
      <h2 className="text-[12px] font-black uppercase tracking-wide text-[#6B6B80]">{title}</h2>
      {children}
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-black uppercase tracking-wide text-[#6B6B80]">
        {label}
        {required ? <span className="text-red-400"> *</span> : null}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#E8E5F0] bg-white px-4 py-2.5 text-[14px] font-medium text-[#0F0F1A] outline-none transition placeholder:text-[#C4C4D4] focus:border-[#4F7FFF] focus:ring-2 focus:ring-[#4F7FFF]/10"
      />
    </div>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
  loading = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { id: number | string; name?: string; title?: string; employeeCode?: string }[];
  loading?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-black uppercase tracking-wide text-[#6B6B80]">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-[#E8E5F0] bg-white px-4 py-2.5 text-[14px] font-medium text-[#0F0F1A] outline-none transition focus:border-[#4F7FFF] focus:ring-2 focus:ring-[#4F7FFF]/10"
      >
        <option value="">{loading ? "Loading..." : `Select ${label.toLowerCase()}`}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name ?? option.title}
            {option.employeeCode ? ` (${option.employeeCode})` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

function BulkUploadScreen({ type, onBack }: { type: EmployeeType; onBack: () => void }) {
  const Icon = type.icon;
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F7F5F0] text-[#0F0F1A]">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(212,228,255,0.52)_0%,rgba(247,245,240,0.94)_34%,rgba(255,240,212,0.36)_68%,rgba(255,255,255,0.72)_100%)]"
        aria-hidden
      />
      <div className="relative z-10 mx-auto w-full max-w-[680px] px-4 pb-28 pt-10 sm:px-6">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-[13px] font-bold text-[#6B6B80] transition-colors hover:text-[#0F0F1A]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="mb-5 inline-flex items-center gap-2 rounded-xl px-4 py-2" style={{ background: type.bg }}>
          <Icon className="h-4 w-4" style={{ color: type.color }} />
          <span className="text-[13px] font-black" style={{ color: type.color }}>
            {type.label} · Bulk upload
          </span>
        </div>

        <h1 className="mb-1 text-[24px] font-black tracking-[-0.03em] text-[#0F0F1A]">Upload employee CSV</h1>
        <p className="mb-8 text-[13px] font-medium text-[#9CA3AF]">
          Download the template, fill it in, and upload it back here.
        </p>

        <div className="mb-4 flex items-center justify-between rounded-xl border border-[#E8E5F0] bg-white px-5 py-4">
          <div>
            <p className="text-[14px] font-black text-[#0F0F1A]">Employee CSV template</p>
            <p className="text-[12px] font-medium text-[#9CA3AF]">Pre-filled headers for {type.label.toLowerCase()}</p>
          </div>
          <button
            type="button"
            className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] px-4 text-[12px] font-black text-white shadow-md shadow-[#4F7FFF]/25"
          >
            <Upload className="h-3.5 w-3.5 rotate-180" />
            Download
          </button>
        </div>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-14 text-center transition-all ${
            dragging
              ? "border-[#4F7FFF] bg-[#EFF6FF]"
              : file
                ? "border-emerald-300 bg-emerald-50"
                : "border-[#E8E5F0] bg-white hover:border-[#C7D7FE]"
          }`}
        >
          {file ? (
            <>
              <Check className="mb-3 h-10 w-10 text-emerald-500" />
              <p className="text-[15px] font-black text-emerald-600">{file.name}</p>
              <p className="mt-1 text-[12px] font-medium text-emerald-500">
                {(file.size / 1024).toFixed(1)} KB · Ready to upload
              </p>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="mt-3 text-[12px] font-bold text-[#9CA3AF] transition-colors hover:text-red-400"
              >
                Remove
              </button>
            </>
          ) : (
            <>
              <Upload className="mb-3 h-10 w-10 text-[#C4C4D4]" />
              <p className="text-[15px] font-black text-[#0F0F1A]">Drop your CSV here</p>
              <p className="mt-1 text-[12px] font-medium text-[#9CA3AF]">or click to browse files</p>
              <label className="mt-4 flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border-2 border-[#E8E5F0] px-4 text-[12px] font-bold text-[#6B6B80] transition hover:border-[#4F7FFF] hover:text-[#4F7FFF]">
                Browse
                <input
                  type="file"
                  accept=".csv"
                  className="sr-only"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </label>
            </>
          )}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#E8E5F0] bg-[#F7F5F0]/95 px-4 py-4 backdrop-blur-md">
          <div className="mx-auto flex max-w-[680px] items-center justify-between gap-3">
            <p className="text-[12px] font-semibold text-[#9CA3AF]">{type.label} · Bulk upload</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onBack}
                className="flex h-10 w-24 items-center justify-center rounded-xl border-2 border-[#E8E5F0] bg-white text-[13px] font-bold text-[#6B6B80] transition hover:border-[#4F7FFF] hover:text-[#4F7FFF]"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!file}
                className={`flex h-10 w-44 items-center justify-center gap-2 rounded-xl text-[13px] font-black text-white shadow-lg transition ${
                  file
                    ? "bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] shadow-[#4F7FFF]/20 hover:opacity-[0.97]"
                    : "cursor-not-allowed bg-[#E8E5F0] text-[#9CA3AF]"
                }`}
              >
                <Upload className="h-4 w-4" />
                Upload &amp; Import
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildPhases(flags: SetupFlags): Phase[] {
  const orgCompleted = isOrgSetupComplete(flags);
  const attendanceDone = isAttendancePhaseComplete(flags);
  const attendancePhaseStatus: PhaseStatus = !orgCompleted
    ? "locked"
    : attendanceDone
      ? "completed"
      : "active";

  /** Unlocks salary + staff after attendance; salary auto-completed for now. */
  const postAttendanceUnlocked = orgCompleted && attendanceDone;

  return [
  {
    id: "org",
    title: "Organization Setup",
    shortTitle: "Org Setup",
    meta: "3 steps · 5 min",
    status: orgCompleted ? "completed" : "active",
    icon: Building2,
    color: "#4F7FFF",
      steps: [
      {
        label: "KYB",
        optional: true,
        statusLabel: flags.kybSkipped ? "Skipped" : undefined,
        action: flags.kybSkipped ? undefined : "START",
        href: "/dashboard/setup/kyb",
        state: flags.kybSkipped ? "completed" : "active",
      },
      {
        label: "Business Functions",
        optional: true,
        statusLabel: flags.businessFunctionsDone ? "Done" : undefined,
        action: flags.kybSkipped && !flags.businessFunctionsDone ? "START" : undefined,
        href: "/dashboard/setup/business-functions",
        state: flags.businessFunctionsDone ? "completed" : flags.kybSkipped ? "active" : "locked",
      },
      {
        label: "Taxes & Compliance",
        statusLabel: flags.taxesComplianceDone ? "Done" : undefined,
        action: flags.businessFunctionsDone && !flags.taxesComplianceDone ? "START" : undefined,
        href: "/dashboard/setup/taxes-compliance",
        state: flags.taxesComplianceDone ? "completed" : flags.businessFunctionsDone ? "active" : "locked",
      },
    ],
  },
  {
    id: "attendance",
    title: "Attendance Settings",
    shortTitle: "Attendance",
    meta: "4 steps · 5 min",
    status: attendancePhaseStatus,
    icon: Clock3,
    color: "#7C3AED",
    steps: [
      {
        label: "Attendance Templates",
        action:
          orgCompleted && attendanceSetupStepState("templates", flags) === "active" ? "START" : undefined,
        href: "/dashboard/setup/attendance",
        state: attendanceSetupStepState("templates", flags),
      },
      {
        label: "Shifts",
        action: attendanceSetupStepState("shifts", flags) === "active" ? "START" : undefined,
        href: "/dashboard/setup/shifts",
        state: attendanceSetupStepState("shifts", flags),
      },
      {
        label: "Holiday Policy",
        href: "/dashboard/setup/holiday-policy",
        state: attendanceSetupStepState("holiday", flags),
      },
      {
        label: "Leave Policy",
        href: "/dashboard/setup/leave-policy",
        state: attendanceSetupStepState("leave", flags),
      },
    ],
  },
  {
    id: "salary",
    title: "Salary Settings",
    shortTitle: "Salary",
    meta: "4 steps · 5 min",
    status: !postAttendanceUnlocked ? "locked" : "completed",
    icon: CircleDollarSign,
    color: "#059669",
    steps: [
      {
        label: "Components Creation",
        optional: true,
        statusLabel: "Upload completed",
        statusTone: "emerald",
        href: "/dashboard/payroll",
        state: postAttendanceUnlocked ? "completed" : "locked",
      },
      {
        label: "Statutory Components Creation",
        optional: true,
        statusLabel: "Upload completed",
        statusTone: "emerald",
        href: "/dashboard/payroll",
        state: postAttendanceUnlocked ? "completed" : "locked",
      },
      {
        label: "Salary Template",
        optional: true,
        statusLabel: "Upload completed",
        statusTone: "emerald",
        href: "/dashboard/payroll",
        state: postAttendanceUnlocked ? "completed" : "locked",
      },
      {
        label: "Flexi-Benefit Plan Template",
        optional: true,
        statusLabel: "Upload completed",
        statusTone: "emerald",
        href: "/dashboard/payroll",
        state: postAttendanceUnlocked ? "completed" : "locked",
      },
    ],
  },
  {
    id: "staff",
    title: "Add and Invite Staff",
    shortTitle: "Staff",
    meta: "2 steps · 5 min",
    status: !postAttendanceUnlocked ? "locked" : "active",
    icon: Users,
    color: "#DC2626",
    steps: [
      {
        label: "Add Employees",
        action: postAttendanceUnlocked ? "START" : undefined,
        actionVariant: "success",
        href: "/dashboard/employees",
        state: postAttendanceUnlocked ? "active" : "locked",
      },
      {
        label: "Invite Employees",
        optional: true,
        href: "/dashboard/employees",
        state: postAttendanceUnlocked ? "locked" : "locked",
      },
    ],
  },
  ];
}

function pickDefaultPhaseId(flags: SetupFlags): string {
  if (!isOrgSetupComplete(flags)) return "org";
  if (!isAttendancePhaseComplete(flags)) return "attendance";
  return "staff";
}

function applySetupQueryParams(): { focusAttendance: boolean; focusStaff: boolean } {
  const params = new URLSearchParams(window.location.search);
  const focusAttendance =
    params.get("attendanceTemplatesDone") === "true" ||
    params.get("shiftsDone") === "true" ||
    params.get("holidayPolicyDone") === "true";
  const focusStaff = params.get("leavePolicyDone") === "true";

  if (params.get("taxesComplianceDone") === "true") {
    writeSetupFlag("kybSkipped", true);
    writeSetupFlag("businessFunctionsDone", true);
    writeSetupFlag("taxesComplianceDone", true);
  }
  if (params.get("attendanceTemplatesDone") === "true") {
    writeSetupFlag("attendanceTemplatesDone", true);
  }
  if (params.get("shiftsDone") === "true") {
    writeSetupFlag("shiftsDone", true);
  }
  if (params.get("holidayPolicyDone") === "true") {
    writeSetupFlag("holidayPolicyDone", true);
  }
  if (params.get("leavePolicyDone") === "true") {
    writeSetupFlag("leavePolicyDone", true);
  }

  if (params.toString()) {
    window.history.replaceState(null, "", "/dashboard/setup");
  }

  return { focusAttendance, focusStaff };
}

export default function SetupOverviewPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [screen, setScreen] = useState<SetupScreen>("overview");
  const [loading, setLoading] = useState(true);
  const [activePhaseId, setActivePhaseId] = useState("org");
  const [setupFlags, setSetupFlags] = useState<SetupFlags>(() => readSetupFlags());
  const [setupError, setSetupError] = useState<string | null>(null);

  const refreshSetupFlags = useCallback(() => {
    const flags = readSetupFlags();
    setSetupFlags(flags);
    setActivePhaseId((prev) => {
      const phase = buildPhases(flags).find((p) => p.id === prev);
      if (phase && phase.status !== "locked") return prev;
      return pickDefaultPhaseId(flags);
    });
  }, []);

  const phases = buildPhases(setupFlags);
  const orgPhase = phases.find((p) => p.id === "org");
  const attendancePhase = phases.find((p) => p.id === "attendance");
  const salaryPhase = phases.find((p) => p.id === "salary");
  const staffPhase = phases.find((p) => p.id === "staff");
  const orgSteps = orgPhase?.steps ?? [];
  const attendanceSteps = attendancePhase?.steps ?? [];
  const salarySteps = salaryPhase?.steps ?? [];
  const staffSteps = staffPhase?.steps ?? [];
  const completedOrgSteps = orgSteps.filter((step) => step.state === "completed").length;
  const completedAttendanceSteps = countAttendanceStepsDone(setupFlags);
  const completedSalarySteps = salarySteps.filter((step) => step.state === "completed").length;
  const completedStaffSteps = staffSteps.filter((step) => step.state === "completed").length;
  const attendanceComplete = isAttendancePhaseComplete(setupFlags);
  const setupComplete =
    completedOrgSteps === orgSteps.length && orgSteps.length > 0 && attendanceComplete;

  const activePhase = phases.find((p) => p.id === activePhaseId) ?? phases[0];
  const footerProgress = (() => {
    if (activePhaseId === "attendance") {
      return {
        done: completedAttendanceSteps,
        total: attendanceSteps.length,
        phaseName: "attendance",
        label: attendanceComplete
          ? "Attendance setup complete"
          : (attendanceSteps.find((s) => s.state === "active")?.label ?? "Attendance Settings"),
      };
    }
    if (activePhaseId === "salary") {
      return {
        done: completedSalarySteps,
        total: salarySteps.length,
        phaseName: "salary",
        label: "Salary Settings",
      };
    }
    if (activePhaseId === "staff") {
      return {
        done: completedStaffSteps,
        total: staffSteps.length,
        phaseName: "staff",
        label: staffSteps.find((s) => s.state === "active")?.label ?? "Add and Invite Staff",
      };
    }
    return {
      done: completedOrgSteps,
      total: orgSteps.length,
      phaseName: "organization",
      label: orgSteps.find((s) => s.state === "active")?.label ?? "Organization Setup",
    };
  })();

  const load = useCallback(async () => {
    const res = await fetch(`${apiBaseUrl}/api/auth/me`, { headers: authHeaders() });
    if (!res.ok) return;
    setMe((await res.json()) as MeResponse);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load().finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  useEffect(() => {
    if (pathname !== "/dashboard/setup") return;
    const { focusAttendance, focusStaff } = applySetupQueryParams();
    refreshSetupFlags();
    if (focusStaff && isAttendancePhaseComplete(readSetupFlags())) {
      setActivePhaseId("staff");
    } else if (focusAttendance) {
      setActivePhaseId("attendance");
    }
  }, [pathname, refreshSetupFlags]);

  useEffect(() => {
    const onFlagsChanged = () => refreshSetupFlags();
    window.addEventListener(SETUP_FLAGS_CHANGED, onFlagsChanged);
    return () => window.removeEventListener(SETUP_FLAGS_CHANGED, onFlagsChanged);
  }, [refreshSetupFlags]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshSetupFlags();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshSetupFlags]);

  const skipKyb = () => {
    writeSetupFlag("kybSkipped", true);
    refreshSetupFlags();
  };

  const skipBusinessFunctions = async () => {
    setSetupError(null);
    try {
      const res = await authenticatedFetch(`${apiBaseUrl}/api/organization/business-functions/skip`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        setSetupError(await readApiError(res, "Could not skip business functions."));
        return;
      }
      await res.json().catch(() => ({}));
      writeSetupFlag("businessFunctionsDone", true);
      refreshSetupFlags();
    } catch {
      setSetupError("Network error while skipping business functions.");
    }
  };

  const orgName =
    me?.organization?.legalName?.trim() || me?.organization?.name || "Your organization";

  const completedPhases = phases.filter((phase) => phase.status === "completed").length;

  if (screen === "add-staff") {
    return <AddStaffScreen onBack={() => setScreen("overview")} />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F7F5F0] text-[#0F0F1A]">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(212,228,255,0.52)_0%,rgba(247,245,240,0.94)_34%,rgba(255,240,212,0.36)_68%,rgba(255,255,255,0.72)_100%)]"
        aria-hidden
      />
      <div className="relative z-10 mx-auto w-full max-w-[960px] px-4 pb-32 pt-10 sm:px-6 lg:pt-14">

        {/* ── Header ── */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#4F7FFF]">
              Workspace Setup
            </p>
            <h1 className="mt-1 text-[28px] font-black tracking-[-0.03em] text-[#0F0F1A] sm:text-[34px]">
              {loading ? "Loading…" : orgName}
            </h1>
            {me?.organization?.slug && (
              <p className="mt-1 text-[12px] font-semibold text-[#6B6B80]">
                Organization Code:{" "}
                <span className="font-mono tracking-wide text-[#0F0F1A]">{me.organization.slug}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-[#E8E5F0] bg-white/90 px-5 py-3 shadow-lg shadow-black/[0.04] backdrop-blur-sm">
            <div className="flex gap-1">
              {phases.map((phase) => (
                <span
                  key={phase.id}
                  className={`h-2 w-8 rounded-full transition-all ${
                    phase.status === "completed"
                      ? "bg-[#4F7FFF]"
                      : phase.id === activePhase.id
                      ? "bg-gradient-to-r from-[#4F7FFF] to-[#7C3AED]"
                      : "bg-[#E8E5F0]"
                  }`}
                />
              ))}
            </div>
            <span className="text-[12px] font-bold text-[#6B6B80]">
              {completedPhases} of {phases.length} done
            </span>
          </div>
        </div>

        {/* ── Phase cards row ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {phases.map((phase, i) => {
            const Icon = phase.icon;
            const isActive = phase.status === "active";
            const isCompleted = phase.status === "completed";
            const isLocked = phase.status === "locked";
            const isSelected = activePhaseId === phase.id;

            return (
              <button
                key={phase.id}
                type="button"
                disabled={isLocked}
                onClick={() => !isLocked && setActivePhaseId(phase.id)}
                className={`group relative flex flex-col items-start rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-[#4F7FFF] bg-white shadow-lg shadow-[#4F7FFF]/10"
                    : isLocked
                    ? "cursor-not-allowed border-[#E8E5F0] bg-[#FAFAFA]/80 opacity-60"
                    : "border-[#E8E5F0] bg-white hover:border-[#C7D7FE] hover:shadow-lg hover:shadow-black/[0.04]"
                }`}
              >
                <span
                  className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl text-[13px] font-black shadow-sm ${
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isActive
                      ? "bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] text-white shadow-[#4F7FFF]/30"
                      : "bg-[#F0EEF8] text-[#9CA3AF]"
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : isLocked ? <Lock className="h-3.5 w-3.5" /> : i + 1}
                </span>

                <p className={`text-[13px] font-black leading-tight ${isLocked ? "text-[#9CA3AF]" : "text-[#0F0F1A]"}`}>
                  {phase.shortTitle}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-[#9CA3AF]">{phase.meta}</p>

                {isActive && (
                  <span className="mt-2.5 flex items-center gap-1 rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#4F7FFF]">
                    <Zap className="h-2.5 w-2.5" /> Active
                  </span>
                )}

                {/* Selected indicator */}
                {isSelected && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 translate-y-px rounded-full bg-[#4F7FFF]" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Connector arrow ── */}
        <div className="flex justify-center py-1">
          <span className="text-[#C7D7FE] text-lg">▼</span>
        </div>

        {/* ── Active phase detail panel ── */}
        <div className="overflow-hidden rounded-2xl border border-[#E8E5F0] bg-white shadow-xl shadow-black/[0.05]">
          {/* Panel header */}
          <div className="flex items-center justify-between border-b border-[#E8E5F0] bg-[#FAFAFA] px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] shadow-sm shadow-[#4F7FFF]/30">
                {(() => { const Icon = activePhase.icon; return <Icon className="h-4 w-4 text-white" />; })()}
              </span>
              <div>
                <h2 className="text-[15px] font-black text-[#0F0F1A]">{activePhase.title}</h2>
                <p className="text-[11px] font-semibold text-[#9CA3AF]">{activePhase.meta}</p>
              </div>
            </div>
            {activePhase.status === "locked" && (
              <span className="flex items-center gap-1.5 rounded-full border border-[#E8E5F0] bg-white px-3 py-1 text-[11px] font-bold text-[#6B6B80]">
                <Lock className="h-3 w-3" /> Complete previous phase first
              </span>
            )}
          </div>

          {/* Steps as horizontal strip */}
          {activePhase.steps.length > 0 ? (
            <div className="divide-y divide-[#F0EEF8]">
              {activePhase.steps.map((step, idx) => {
                const isStepActive = step.state === "active";
                const isStepDone = step.state === "completed";
                const isStepLocked = step.state === "locked";
                const canOpenStep = !isStepLocked;
                const isAddEmployeesStep = step.label === "Add Employees";

                const inner = (
                  <div
                    role={canOpenStep ? "button" : undefined}
                    tabIndex={canOpenStep ? 0 : undefined}
                    onClick={() => {
                      if (!canOpenStep) return;
                      if (isAddEmployeesStep) {
                        setScreen("add-staff");
                        return;
                      }
                      router.push(step.href);
                    }}
                    onKeyDown={(e) => {
                      if (canOpenStep && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        if (isAddEmployeesStep) {
                          setScreen("add-staff");
                          return;
                        }
                        router.push(step.href);
                      }
                    }}
                    className={`flex min-h-[68px] items-center justify-between gap-4 px-6 py-4 transition-colors ${
                      isStepActive
                        ? "bg-[#F8FBFF] hover:bg-[#EFF6FF]"
                        : isStepDone
                        ? "bg-[#F0FDF4]"
                        : "bg-white hover:bg-[#FAFAFA]"
                    } ${isStepLocked ? "opacity-50" : "cursor-pointer"}`}
                  >
                    {/* Left: number + label */}
                    <div className="flex items-center gap-4">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[13px] font-black ${
                          isStepDone
                            ? "bg-emerald-100 text-emerald-600"
                            : isStepActive
                            ? "bg-[#EFF6FF] text-[#4F7FFF]"
                            : "bg-[#F0EEF8] text-[#9CA3AF]"
                        }`}
                      >
                        {isStepDone ? (
                          <Check className="h-4 w-4" />
                        ) : isStepLocked ? (
                          <Lock className="h-3.5 w-3.5" />
                        ) : (
                          idx + 1
                        )}
                      </span>
                      <div>
                        <p className="text-[14px] font-bold text-[#0F0F1A]">
                          {step.label}
                          {step.optional && (
                            <span className="ml-1.5 text-[12px] font-normal text-[#9CA3AF]">(Optional)</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex shrink-0 items-center gap-3">
                      {step.statusLabel ? (
                        <span
                          className={
                            step.statusTone === "emerald"
                              ? "text-[13px] font-semibold text-emerald-600"
                              : "rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-600"
                          }
                        >
                          {step.statusLabel}
                        </span>
                      ) : null}
                      {step.action ? (
                        <>
                          {step.label === "KYB" ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                skipKyb();
                              }}
                              className="text-[13px] font-bold text-[#4F7FFF] hover:underline"
                            >
                              Skip
                            </button>
                          ) : step.label === "Business Functions" ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void skipBusinessFunctions();
                              }}
                              className="text-[13px] font-bold text-[#4F7FFF] hover:underline"
                            >
                              Skip
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isAddEmployeesStep) {
                                setScreen("add-staff");
                                return;
                              }
                              router.push(step.href);
                            }}
                            className={`flex h-9 items-center gap-1.5 rounded-lg px-5 text-[12px] font-black text-white shadow-sm transition hover:opacity-[0.97] ${
                              step.actionVariant === "success"
                                ? "bg-emerald-500 shadow-emerald-500/25 hover:bg-emerald-600"
                                : "rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] shadow-md shadow-[#4F7FFF]/25"
                            }`}
                          >
                            {step.action}
                            {step.actionVariant !== "success" ? (
                              <ChevronRight className="h-3.5 w-3.5" />
                            ) : null}
                          </button>
                        </>
                      ) : !isStepLocked ? (
                        <ChevronRight className="h-4 w-4 text-[#D1D5DB]" />
                      ) : null}
                    </div>
                  </div>
                );

                return <div key={step.label}>{inner}</div>;
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
              <Lock className="h-7 w-7 text-[#CACAD6]" />
              <p className="text-[14px] font-bold text-[#9CA3AF]">Locked</p>
              <p className="text-[12px] text-[#C4C4D4]">Finish the active phase to unlock this one</p>
            </div>
          )}
        </div>

        {setupError ? (
          <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-600">
            {setupError}
          </p>
        ) : null}

        {/* ── All phases mini overview ── */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {phases.map((p) => (
            <div
              key={p.id}
              className={`rounded-xl border px-4 py-3 ${
                p.status === "completed"
                  ? "border-emerald-200 bg-emerald-50"
                  : p.status === "active"
                  ? "border-[#C7D7FE] bg-[#EFF6FF]"
                  : "border-[#E8E5F0] bg-white"
              }`}
            >
              <p className={`text-[11px] font-black uppercase tracking-wide ${
                p.status === "completed" ? "text-emerald-600" : p.status === "active" ? "text-[#4F7FFF]" : "text-[#C4C4D4]"
              }`}>
                {p.status === "completed" ? "Done" : p.status === "active" ? "In progress" : "Locked"}
              </p>
              <p className={`mt-0.5 text-[12px] font-bold ${p.status === "locked" ? "text-[#C4C4D4]" : "text-[#0F0F1A]"}`}>
                {p.shortTitle}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sticky footer ── */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#E8E5F0] bg-[#F7F5F0]/95 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-[960px] items-center justify-between gap-3">
          <p className="text-[12px] font-semibold text-[#9CA3AF]">
            {footerProgress.done} of {footerProgress.total} {footerProgress.phaseName} steps done ·{" "}
            {footerProgress.label}
          </p>
          <div className="flex gap-3">
            <Link
              href="/onboarding/organization-defaults"
              className="flex h-10 w-28 items-center justify-center rounded-xl border-2 border-[#E8E5F0] bg-white text-[13px] font-bold text-[#6B6B80] transition hover:border-[#4F7FFF] hover:text-[#4F7FFF]"
            >
              Back
            </Link>
            <button
              type="button"
              disabled={!setupComplete}
              className={`flex h-10 w-44 items-center justify-center gap-2 rounded-xl text-[13px] font-black transition ${
                setupComplete
                  ? "bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] text-white shadow-lg shadow-[#4F7FFF]/20 hover:opacity-[0.97]"
                  : "bg-[#E8E5F0] text-[#9CA3AF]"
              }`}
            >
              <Check className="h-4 w-4" />
              Complete Setup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
