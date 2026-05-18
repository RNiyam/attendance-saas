"use client";

import {
  ArrowLeft,
  BadgeCheck,
  CalendarX2,
  ChevronDown,
  Clock3,
  MapPin,
  Ruler,
  UserX,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiBaseUrl, authenticatedFetch } from "@/services/http";

type ApiOption = {
  value: string;
  label: string;
  description?: string;
};

type TemplateOptions = {
  attendanceModes: ApiOption[];
  holidayAttendance: ApiOption[];
  effectiveWorkingHourRules: ApiOption[];
  approvalAfterDays: ApiOption[];
};

type Template = {
  name: string;
  attendanceMode: string;
  holidayAttendance: string;
  trackInOutTime: boolean;
  noAttendanceWithoutPunchOut: boolean;
  allowMultiplePunches: boolean;
  autoApproveAttendance: boolean;
  autoApproveAfterDays: string;
  markAbsentPreviousDays: boolean;
  effectiveWorkingHourRule: string;
  lateAfterMinutes: number;
  halfDayAfterMinutes: number;
  overtimeAfterMinutes: number;
  weeklyOffDays: string;
};

const fallbackOptions: TemplateOptions = {
  attendanceModes: [
    {
      value: "mark_present_by_default",
      label: "Mark Present by Default",
      description: "Default auto present, can be changed manually",
    },
    {
      value: "manual_attendance",
      label: "Manual Attendance",
      description: "Attendance is neutral by default, should be marked manually",
    },
    {
      value: "location_based",
      label: "Location Based",
      description: "Staff can mark their own attendance. Location will be captured automatically",
    },
    {
      value: "selfie_location_based",
      label: "Selfie & Location Based",
      description: "Staff can mark their own attendance with selfie. Location will be captured automatically",
    },
  ],
  holidayAttendance: [
    {
      value: "block_paid_holidays",
      label: "Do NOT Allow attendance on paid holidays",
      description: "Do not let staff mark attendance on paid holidays",
    },
    {
      value: "comp_off",
      label: "Comp Off",
      description: "Allow a comp off leave if a staff works on a holiday",
    },
    {
      value: "allow_paid_holidays",
      label: "Allow attendance on paid holidays",
      description: "Let staff mark attendance on paid holidays",
    },
  ],
  effectiveWorkingHourRules: [
    {
      value: "do_not_show",
      label: "Do not show",
      description: "Hide effective working hours from attendance calculations",
    },
    {
      value: "rule_1",
      label: "Rule 1",
      description: "Overtime and paid breaks will be deducted from the total time",
    },
    {
      value: "rule_2",
      label: "Rule 2",
      description: "Total time only, no deductions",
    },
    {
      value: "rule_3",
      label: "Rule 3",
      description: "Overtime will be deducted from total time",
    },
    {
      value: "rule_4",
      label: "Rule 4",
      description: "All breaks will be deducted from total time",
    },
  ],
  approvalAfterDays: [
    { value: "1", label: "1 day" },
    { value: "2", label: "2 days" },
    { value: "3", label: "3 days" },
    { value: "7", label: "7 days" },
    { value: "15", label: "15 days" },
    { value: "30", label: "30 days" },
  ],
};

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-[#4F7FFF]" : "bg-[#98A2B3]"}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
          checked ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: string;
  options: ApiOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      {label ? <span className="mb-2 block text-[12px] font-medium text-[#475467]">{label}</span> : null}
      <span className="relative block">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full appearance-none rounded-lg border border-[#E2E8F0] bg-white px-4 pr-10 text-[14px] font-medium text-[#344054] outline-none transition focus:border-[#4F7FFF] focus:ring-4 focus:ring-[#4F7FFF]/10"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
      </span>
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-[12px] font-medium text-[#475467]">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value || 0))}
        className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-white px-4 text-[14px] font-medium text-[#344054] outline-none transition focus:border-[#4F7FFF] focus:ring-4 focus:ring-[#4F7FFF]/10"
      />
    </label>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full px-3 text-[12px] font-black ${
        active ? "bg-[#E8FAD8] text-[#2F6D16]" : "bg-[#EEF2F6] text-[#667085]"
      }`}
    >
      {active ? "Active" : "Off"}
    </span>
  );
}

function Tile({
  title,
  subtitle,
  active,
  icon: Icon,
  selected,
  onClick,
  children,
}: {
  title: string;
  subtitle: string;
  active: boolean;
  icon: typeof MapPin;
  selected?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  const className = `flex h-[180px] flex-col rounded-xl border bg-white p-5 text-left shadow-sm transition ${
    selected
      ? "border-[#4F7FFF] shadow-[#4F7FFF]/15"
      : "border-[#E2E8F0] hover:border-[#AFC4FF] hover:shadow-md hover:shadow-black/[0.04]"
  }`;
  const content = (
    <>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#1F63B5]">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-[16px] font-black tracking-[-0.01em] text-[#0F0F1A]">{title}</p>
      <p className="mt-1.5 text-[14px] font-semibold leading-5 text-[#667085]">{subtitle}</p>
      <div className="mt-auto pt-3">
        <StatusPill active={active} />
      </div>
    </>
  );

  if (!onClick) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
    >
      {content}
    </button>
  );
}

function optionLabel(options: ApiOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? "Select";
}

function compactOptionLabel(options: ApiOption[], value: string) {
  const label = optionLabel(options, value);
  return label
    .replace("Mark Present by Default", "Auto present")
    .replace("Manual Attendance", "Manual")
    .replace("Location Based", "Location based")
    .replace("Selfie & Location Based", "Selfie + location")
    .replace("Do NOT Allow attendance on paid holidays", "Blocked on holidays")
    .replace("Allow attendance on paid holidays", "Allowed on holidays");
}

export default function AttendanceTemplateDetailPage() {
  const router = useRouter();
  const [options, setOptions] = useState<TemplateOptions>(fallbackOptions);
  const [template, setTemplate] = useState<Template>({
    name: "Default Template",
    attendanceMode: "",
    holidayAttendance: "",
    trackInOutTime: false,
    noAttendanceWithoutPunchOut: false,
    allowMultiplePunches: false,
    autoApproveAttendance: false,
    autoApproveAfterDays: "7",
    markAbsentPreviousDays: false,
    effectiveWorkingHourRule: "",
    lateAfterMinutes: 0,
    halfDayAfterMinutes: 240,
    overtimeAfterMinutes: 0,
    weeklyOffDays: "sunday",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<
    "attendanceMode" | "holidayAttendance" | "trackTime" | "autoApprove" | "previousDays" | "workingHours" | null
  >(null);

  const patchTemplate = (patch: Partial<Template>) => setTemplate((current) => ({ ...current, ...patch }));

  const load = useCallback(async () => {
    const [optionsRes, templateRes] = await Promise.all([
      authenticatedFetch(`${apiBaseUrl}/api/attendance/templates/options`),
      authenticatedFetch(`${apiBaseUrl}/api/attendance/templates/default`),
    ]);

    const apiOptions = optionsRes.ok ? ((await optionsRes.json()) as Partial<TemplateOptions>) : {};
    const nextOptions = {
      attendanceModes: apiOptions.attendanceModes?.length ? apiOptions.attendanceModes : fallbackOptions.attendanceModes,
      holidayAttendance: apiOptions.holidayAttendance?.length
        ? apiOptions.holidayAttendance
        : fallbackOptions.holidayAttendance,
      effectiveWorkingHourRules: apiOptions.effectiveWorkingHourRules?.length
        ? apiOptions.effectiveWorkingHourRules
        : fallbackOptions.effectiveWorkingHourRules,
      approvalAfterDays: apiOptions.approvalAfterDays?.length ? apiOptions.approvalAfterDays : fallbackOptions.approvalAfterDays,
    };
    setOptions(nextOptions);

    if (templateRes.ok) {
      const data = (await templateRes.json()) as Template;
      setTemplate({
        ...data,
        attendanceMode: data.attendanceMode || nextOptions.attendanceModes[0]?.value || "",
        holidayAttendance: data.holidayAttendance || nextOptions.holidayAttendance[0]?.value || "",
        effectiveWorkingHourRule: data.effectiveWorkingHourRule || nextOptions.effectiveWorkingHourRules[0]?.value || "",
      });
    } else {
      setTemplate((current) => ({
        ...current,
        attendanceMode: current.attendanceMode || nextOptions.attendanceModes[0]?.value || "",
        holidayAttendance: current.holidayAttendance || nextOptions.holidayAttendance[0]?.value || "",
        effectiveWorkingHourRule: current.effectiveWorkingHourRule || nextOptions.effectiveWorkingHourRules[0]?.value || "",
      }));
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await authenticatedFetch(`${apiBaseUrl}/api/attendance/templates/default`, {
        method: "PATCH",
        body: JSON.stringify({
          name: template.name,
          attendanceMode: template.attendanceMode,
          holidayAttendance: template.holidayAttendance,
          trackInOutTime: template.trackInOutTime,
          noAttendanceWithoutPunchOut: template.noAttendanceWithoutPunchOut,
          allowMultiplePunches: template.allowMultiplePunches,
          autoApproveAttendance: template.autoApproveAttendance,
          autoApproveAfterDays: template.autoApproveAfterDays,
          markAbsentPreviousDays: template.markAbsentPreviousDays,
          effectiveWorkingHourRule: template.effectiveWorkingHourRule,
          lateAfterMinutes: template.lateAfterMinutes,
          halfDayAfterMinutes: template.halfDayAfterMinutes,
          overtimeAfterMinutes: template.overtimeAfterMinutes,
          weeklyOffDays: template.weeklyOffDays,
        }),
      });
      if (!res.ok) {
        setMessage("Could not save attendance template.");
        return;
      }
      await res.json().catch(() => ({}));
      router.push("/dashboard/setup/attendance?templateSaved=1");
    } catch {
      setMessage("Network error while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-[#0F0F1A]">
      <main className="px-4 pb-8 pt-6 sm:px-8">
        <button
          type="button"
          onClick={() => router.push("/dashboard/setup/attendance")}
          className="mb-6 flex items-center gap-2 text-[13px] font-semibold text-[#344054]"
        >
          <ArrowLeft className="h-4 w-4 text-[#2563EB]" />
          Back
        </button>

        <section className="rounded-xl border border-[#E2E8F0] bg-white">
          <div className="w-full px-6 py-7">
            <h1 className="text-[16px] font-black text-[#344054]">Attendance Template</h1>
            <p className="mt-1 text-[14px] font-medium text-[#667085]">
              Configure attendance modes, attendance on holidays, and more
            </p>

            <label className="mt-7 block max-w-[310px]">
              <span className="mb-2 block text-[12px] font-medium text-[#344054]">
                Name <span className="text-red-500">*</span>
              </span>
              <input
                value={template.name}
                onChange={(e) => patchTemplate({ name: e.target.value })}
                className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-white px-4 text-[14px] font-medium text-[#344054] outline-none transition focus:border-[#4F7FFF] focus:ring-4 focus:ring-[#4F7FFF]/10"
              />
            </label>

            <p className="mt-7 text-[14px] font-medium text-[#667085]">Settings</p>

            <div className="mt-3 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              <Tile
                title="Attendance mode"
                subtitle={compactOptionLabel(options.attendanceModes, template.attendanceMode)}
                active={Boolean(template.attendanceMode)}
                icon={MapPin}
                selected={activePanel === "attendanceMode"}
                onClick={() => setActivePanel("attendanceMode")}
              />

              <Tile
                title="Holiday rule"
                subtitle={compactOptionLabel(options.holidayAttendance, template.holidayAttendance)}
                active={Boolean(template.holidayAttendance)}
                icon={CalendarX2}
                selected={activePanel === "holidayAttendance"}
                onClick={() => setActivePanel("holidayAttendance")}
              />

              <Tile
                title="Track in & out"
                subtitle={`${[
                  template.trackInOutTime,
                  template.noAttendanceWithoutPunchOut,
                  template.allowMultiplePunches,
                ].filter(Boolean).length} toggles set`}
                active={template.trackInOutTime}
                icon={Clock3}
                selected={activePanel === "trackTime"}
                onClick={() => setActivePanel("trackTime")}
              />

              <Tile
                title="Auto approve"
                subtitle={template.autoApproveAttendance ? `After ${template.autoApproveAfterDays} days` : "Manual review"}
                active={template.autoApproveAttendance}
                icon={BadgeCheck}
                selected={activePanel === "autoApprove"}
                onClick={() => setActivePanel("autoApprove")}
              />

              <Tile
                title="Mark absent"
                subtitle="Previous days"
                active={template.markAbsentPreviousDays}
                icon={UserX}
                selected={activePanel === "previousDays"}
                onClick={() => setActivePanel("previousDays")}
              />

              <Tile
                title="Working hours"
                subtitle={`${optionLabel(options.effectiveWorkingHourRules, template.effectiveWorkingHourRule)} · ${template.halfDayAfterMinutes} min`}
                active={Boolean(template.effectiveWorkingHourRule)}
                icon={Ruler}
                selected={activePanel === "workingHours"}
                onClick={() => setActivePanel("workingHours")}
              />
            </div>

            {message ? <p className="mt-4 text-[13px] font-semibold text-[#2563EB]">{message}</p> : null}
          </div>
        </section>
      </main>

      {activePanel ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0F0F1A]/35 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[560px] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl shadow-[#0F0F1A]/20">
            <div className="flex items-start justify-between gap-4 border-b border-[#E5EAF2] px-6 py-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-[#4F7FFF]">Default Template</p>
                <h2 className="mt-1 text-[20px] font-black tracking-[-0.02em] text-[#0F0F1A]">
                  {activePanel === "attendanceMode"
                    ? "Attendance mode"
                    : activePanel === "holidayAttendance"
                      ? "Holiday rule"
                      : activePanel === "trackTime"
                        ? "Track in & out"
                        : activePanel === "autoApprove"
                          ? "Auto approve"
                          : activePanel === "previousDays"
                            ? "Mark absent"
                            : "Working hours"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#667085] hover:bg-[#F8FAFC] hover:text-[#0F0F1A]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto bg-[#F8FAFC] px-6 py-5">
              {activePanel === "attendanceMode" ? (
                <div className="space-y-3">
                  {options.attendanceModes.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => patchTemplate({ attendanceMode: option.value })}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                        template.attendanceMode === option.value
                          ? "border-[#4F7FFF] bg-[#EFF6FF]"
                          : "border-[#E2E8F0] bg-white hover:border-[#AFC4FF]"
                      }`}
                    >
                      <p className="text-[14px] font-black text-[#0F0F1A]">{option.label}</p>
                      <p className="mt-1 text-[12px] font-medium leading-5 text-[#667085]">{option.description}</p>
                    </button>
                  ))}
                </div>
              ) : null}

              {activePanel === "holidayAttendance" ? (
                <div className="space-y-3">
                  {options.holidayAttendance.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => patchTemplate({ holidayAttendance: option.value })}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                        template.holidayAttendance === option.value
                          ? "border-[#4F7FFF] bg-[#EFF6FF]"
                          : "border-[#E2E8F0] bg-white hover:border-[#AFC4FF]"
                      }`}
                    >
                      <p className="text-[14px] font-black text-[#0F0F1A]">{option.label}</p>
                      <p className="mt-1 text-[12px] font-medium leading-5 text-[#667085]">{option.description}</p>
                    </button>
                  ))}
                </div>
              ) : null}

              {activePanel === "autoApprove" ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-white px-4 py-4">
                    <div>
                      <p className="text-[14px] font-black text-[#0F0F1A]">Enable Auto Approval</p>
                      <p className="mt-1 text-[12px] font-medium text-[#667085]">
                        Automatically approve attendance items after the selected days.
                      </p>
                    </div>
                    <Toggle
                      checked={template.autoApproveAttendance}
                      onChange={(autoApproveAttendance) => patchTemplate({ autoApproveAttendance })}
                    />
                  </div>
                  <SelectField
                    label="Approve after"
                    value={template.autoApproveAfterDays}
                    options={options.approvalAfterDays}
                    onChange={(autoApproveAfterDays) => patchTemplate({ autoApproveAfterDays })}
                  />
                </div>
              ) : null}

              {activePanel === "trackTime" ? (
                <div className="space-y-3">
                  {[
                    {
                      key: "trackInOutTime",
                      label: "Track time",
                      description: "Track in and out time of your staff.",
                    },
                    {
                      key: "noAttendanceWithoutPunchOut",
                      label: "Punch-out required",
                      description: "Punch out is required to mark attendance.",
                    },
                    {
                      key: "allowMultiplePunches",
                      label: "Multi-punch",
                      description: "Allow staff to check in multiple times within a shift.",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                    className="flex items-center justify-between gap-5 rounded-xl border border-[#E2E8F0] bg-white px-4 py-4"
                  >
                      <div className="min-w-0">
                        <p className="text-[14px] font-black text-[#0F0F1A]">{item.label}</p>
                        <p className="mt-1 text-[12px] font-medium leading-5 text-[#667085]">{item.description}</p>
                      </div>
                      <Toggle
                        checked={Boolean(template[item.key as keyof Template])}
                        onChange={(checked) => patchTemplate({ [item.key]: checked } as Partial<Template>)}
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              {activePanel === "previousDays" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-white px-4 py-4">
                    <div>
                      <p className="text-[14px] font-black text-[#0F0F1A]">Mark Absent on Previous Days</p>
                      <p className="mt-1 text-[12px] font-medium leading-5 text-[#667085]">
                        Old attendance with no action will be marked absent. The last two days are not affected.
                      </p>
                    </div>
                    <Toggle
                      checked={template.markAbsentPreviousDays}
                      onChange={(markAbsentPreviousDays) => patchTemplate({ markAbsentPreviousDays })}
                    />
                  </div>
                </div>
              ) : null}

              {activePanel === "workingHours" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    label="Set Rule"
                    value={template.effectiveWorkingHourRule}
                    options={options.effectiveWorkingHourRules}
                    onChange={(effectiveWorkingHourRule) => patchTemplate({ effectiveWorkingHourRule })}
                  />
                  <NumberField
                    label="Late after mins"
                    value={template.lateAfterMinutes}
                    onChange={(lateAfterMinutes) => patchTemplate({ lateAfterMinutes })}
                  />
                  <NumberField
                    label="Half-day after mins"
                    value={template.halfDayAfterMinutes}
                    onChange={(halfDayAfterMinutes) => patchTemplate({ halfDayAfterMinutes })}
                  />
                  <NumberField
                    label="Overtime after mins"
                    value={template.overtimeAfterMinutes}
                    onChange={(overtimeAfterMinutes) => patchTemplate({ overtimeAfterMinutes })}
                  />
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-3 border-t border-[#E5EAF2] bg-white px-6 py-4">
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="h-10 rounded-lg border border-[#D0D7E2] bg-white px-5 text-[13px] font-bold text-[#344054]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-[#EEF2F6] bg-white/95 px-5 py-5 shadow-[0_-10px_30px_rgba(15,23,42,0.06)] backdrop-blur">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="ml-auto flex h-10 w-[168px] items-center justify-center rounded-lg bg-[#2F67E8] text-[13px] font-bold text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </footer>
    </div>
  );
}
