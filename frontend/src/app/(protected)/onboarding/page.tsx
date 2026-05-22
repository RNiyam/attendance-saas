"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Camera, Check, Loader2 } from "lucide-react";
import FaceCapture from "@/components/FaceCapture";
import { ONBOARDING_HEADER_NAME_EVENT } from "@/components/layout/protected-shell";
import { apiBaseUrl } from "@/services/http";

type MeResponse = {
  user: { id: number; email: string; organizationId: number; phone: string | null };
  organization: { id: number; name: string; slug: string; legalName: string | null; email: string | null } | null;
  role: string;
  displayName: string;
};

type StateRow = { code: string; name: string };
type CityRow = { name: string };
type SectorRow = { code: string; name: string };
type SubRow = { code: string; name: string };

const inputClass =
  "h-11 w-full rounded-lg border-2 border-[#E8E5F0] bg-[#FAFAFA] px-3.5 text-[13px] font-medium text-[#0F0F1A] outline-none transition placeholder:text-[#CACAD6] focus:border-[#7C3AED]/50 focus:bg-white focus:ring-[3px] focus:ring-[#7C3AED]/10";

const selectClass = `${inputClass} appearance-none bg-[length:14px] bg-[right_12px_center] bg-no-repeat pr-10`;

const EMPLOYEE_BANDS = [
  { value: "lt_20" as const, label: "Less than 20" },
  { value: "20_100" as const, label: "20-100" },
  { value: "100_500" as const, label: "100-500" },
  { value: "gt_500" as const, label: "More than 500" },
];

const ORG_ROLES = [
  { id: "owner" as const, label: "Owner" },
  { id: "admin" as const, label: "Admin" },
  { id: "hr" as const, label: "HR" },
  { id: "others" as const, label: "Others" },
];

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (token) (h as Record<string, string>).Authorization = `Bearer ${token}`;
  return h;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"business" | "personal" | "face">("business");
  const [states, setStates] = useState<StateRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [sectors, setSectors] = useState<SectorRow[]>([]);
  const [subSectors, setSubSectors] = useState<SubRow[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createdEmployeeId, setCreatedEmployeeId] = useState<number | null>(null);
  const [capturingFace, setCapturingFace] = useState(false);
  const [faceRegistered, setFaceRegistered] = useState(false);

  const [organizationCode, setOrganizationCode] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [stateName, setStateName] = useState("");
  const [city, setCity] = useState("");
  const [sectorCode, setSectorCode] = useState("");
  const [sectorName, setSectorName] = useState("");
  const [subSectorCode, setSubSectorCode] = useState("");
  const [subSectorName, setSubSectorName] = useState("");
  const [employeeCountBand, setEmployeeCountBand] = useState<(typeof EMPLOYEE_BANDS)[number]["value"] | "">("");

  const [fullName, setFullName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [alternatePhoneDigits, setAlternatePhoneDigits] = useState("");
  const [alternateContactName, setAlternateContactName] = useState("");
  const [organizationRole, setOrganizationRole] = useState<(typeof ORG_ROLES)[number]["id"] | "">("");

  const loadMe = useCallback(async () => {
    let saved: any = null;
    if (typeof window !== "undefined") {
      try {
        const s = localStorage.getItem("onboarding_draft");
        if (s) saved = JSON.parse(s);
      } catch {}
    }

    const res = await fetch(`${apiBaseUrl}/api/auth/me`, { headers: authHeaders() });
    if (!res.ok) return;
    const data = (await res.json()) as MeResponse;
    const org = data.organization;
    const defaultBiz = (org?.legalName && org.legalName.trim()) || org?.name || "";
    setOrganizationCode(org?.slug ?? "");

    setBusinessName(saved?.businessName || defaultBiz);
    setFullName(saved?.fullName || data.displayName.trim() || "");
    setBusinessEmail(saved?.businessEmail || (org?.email ?? data.user.email ?? "").trim());

    const raw = (data.user.phone ?? "").replace(/\D/g, "");
    let ten = "";
    if (raw.length >= 10) {
      if (raw.length >= 12 && raw.startsWith("91")) ten = raw.slice(-10);
      else if (raw.length === 10) ten = raw;
      else ten = raw.slice(-10);
    }
    setAlternatePhoneDigits(saved?.alternatePhoneDigits || ten);

    if (saved) {
      if (saved.stateCode) setStateCode(saved.stateCode);
      if (saved.stateName) setStateName(saved.stateName);
      if (saved.city) setCity(saved.city);
      if (saved.sectorCode) setSectorCode(saved.sectorCode);
      if (saved.sectorName) setSectorName(saved.sectorName);
      if (saved.subSectorCode) setSubSectorCode(saved.subSectorCode);
      if (saved.subSectorName) setSubSectorName(saved.subSectorName);
      if (saved.employeeCountBand) setEmployeeCountBand(saved.employeeCountBand);
      if (saved.alternateContactName) setAlternateContactName(saved.alternateContactName);
      if (saved.organizationRole) setOrganizationRole(saved.organizationRole);
      if (saved.tab && saved.tab !== "face") setTab(saved.tab);
    } else {
      setAlternateContactName("");
      setOrganizationRole("");
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadMe();
    }, 0);
    return () => window.clearTimeout(id);
  }, [loadMe]);

  useEffect(() => {
    if (tab === "face") return;
    const draft = {
      tab,
      businessName,
      stateCode,
      stateName,
      city,
      sectorCode,
      sectorName,
      subSectorCode,
      subSectorName,
      employeeCountBand,
      fullName,
      businessEmail,
      alternatePhoneDigits,
      alternateContactName,
      organizationRole,
    };
    localStorage.setItem("onboarding_draft", JSON.stringify(draft));
  }, [
    tab,
    businessName,
    stateCode,
    stateName,
    city,
    sectorCode,
    sectorName,
    subSectorCode,
    subSectorName,
    employeeCountBand,
    fullName,
    businessEmail,
    alternatePhoneDigits,
    alternateContactName,
    organizationRole,
  ]);

  useEffect(() => {
    if (tab !== "personal") {
      window.dispatchEvent(new CustomEvent(ONBOARDING_HEADER_NAME_EVENT, { detail: { preview: null, emailPreview: null } }));
      return;
    }
    window.dispatchEvent(
      new CustomEvent(ONBOARDING_HEADER_NAME_EVENT, { detail: { preview: fullName, emailPreview: businessEmail } })
    );
    return () => {
      window.dispatchEvent(new CustomEvent(ONBOARDING_HEADER_NAME_EVENT, { detail: { preview: null, emailPreview: null } }));
    };
  }, [tab, fullName, businessEmail]);

  useEffect(() => {
    (async () => {
      const [sRes, secRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/reference/states`),
        fetch(`${apiBaseUrl}/api/reference/sectors`),
      ]);
      if (sRes.ok) {
        const j = (await sRes.json()) as { states: StateRow[] };
        setStates(j.states ?? []);
      }
      if (secRes.ok) {
        const j = (await secRes.json()) as { sectors: SectorRow[] };
        setSectors(j.sectors ?? []);
      }
    })();
  }, []);

  useEffect(() => {
    if (!stateCode) {
      const t = window.setTimeout(() => {
        setCities([]);
        setCity("");
      }, 0);
      return () => window.clearTimeout(t);
    }
    let cancelled = false;
    (async () => {
      setLoadingCities(true);
      const res = await fetch(`${apiBaseUrl}/api/reference/states/${encodeURIComponent(stateCode)}/cities`);
      if (!cancelled && res.ok) {
        const j = (await res.json()) as { cities: CityRow[] };
        setCities(j.cities ?? []);
      }
      if (!cancelled) setLoadingCities(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [stateCode]);

  useEffect(() => {
    if (!sectorCode) {
      const t = window.setTimeout(() => {
        setSubSectors([]);
        setSubSectorCode("");
        setSubSectorName("");
      }, 0);
      return () => window.clearTimeout(t);
    }
    let cancelled = false;
    (async () => {
      setLoadingSubs(true);
      const res = await fetch(
        `${apiBaseUrl}/api/reference/sectors/${encodeURIComponent(sectorCode)}/sub-sectors`,
      );
      if (!cancelled && res.ok) {
        const j = (await res.json()) as { subSectors: SubRow[] };
        setSubSectors(j.subSectors ?? []);
      }
      if (!cancelled) setLoadingSubs(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [sectorCode]);

  const businessValid =
    businessName.trim().length >= 2 &&
    stateCode &&
    city &&
    sectorCode &&
    sectorName &&
    subSectorCode &&
    subSectorName &&
    employeeCountBand;

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessEmail.trim());
  const personalValid =
    fullName.trim().length >= 2 &&
    emailOk &&
    /^\d{10}$/.test(alternatePhoneDigits) &&
    alternateContactName.trim().length >= 2 &&
    organizationRole !== "";

  const handleStateChange = (code: string) => {
    setStateCode(code);
    const st = states.find((s) => s.code === code);
    setStateName(st?.name ?? "");
    setCity("");
  };

  const handleSectorChange = (code: string) => {
    setSectorCode(code);
    const sc = sectors.find((s) => s.code === code);
    setSectorName(sc?.name ?? "");
    setSubSectorCode("");
    setSubSectorName("");
  };

  const goPersonal = () => {
    setError(null);
    if (!businessValid) {
      setError("Please complete all required business fields.");
      return;
    }
    setTab("personal");
  };

  const submitAll = async () => {
    setError(null);
    if (!organizationRole) {
      setError("Please select your role in the organization.");
      return;
    }
    if (!businessValid || !personalValid) {
      setError("Please complete all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/organization/onboarding`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          businessName: businessName.trim(),
          stateCode,
          stateName,
          city: city.trim(),
          sectorCode,
          sectorName,
          subSectorCode,
          subSectorName,
          employeeCountBand,
          fullName: fullName.trim(),
          businessEmail: businessEmail.trim().toLowerCase(),
          alternatePhone: alternatePhoneDigits,
          alternateContactName: alternateContactName.trim(),
          organizationRole,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "Could not save onboarding.");
        return;
      }
      localStorage.removeItem("onboarding_draft");
      if (j.employeeId) {
        setCreatedEmployeeId(j.employeeId);
        setTab("face");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Network error while saving.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFaceCapture = async (imageSrc: string) => {
    if (!createdEmployeeId) return;
    setCapturingFace(true);
    setError(null);
    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const file = new File([blob], "face.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("file", file);

      const fastApiResponse = await fetch("http://127.0.0.1:8000/extract-face", {
        method: "POST",
        body: formData,
      });

      if (!fastApiResponse.ok) {
        const errorData = await fastApiResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to extract face embedding");
      }

      const { embedding } = await fastApiResponse.json();

      const saveRes = await fetch(`${apiBaseUrl}/api/employees/${createdEmployeeId}/face`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ embedding, base64Image: imageSrc }),
      });

      if (!saveRes.ok) {
        const errorData = await saveRes.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save face to database");
      }

      setFaceRegistered(true);
      window.setTimeout(() => {
        router.push("/dashboard");
      }, 2500);
    } catch (e: any) {
      console.error("Face registration error:", e);
      setError(e.message || "Failed to register face.");
    } finally {
      setCapturingFace(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-lg pb-8">
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-[22px] font-black tracking-[-0.03em] text-[#0F0F1A] sm:text-[26px]">
          Hi <span aria-hidden>👋</span> Let&apos;s get familiar
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[#6B6B80] sm:text-sm">
          Basic info about you helps us know you better.
        </p>
      </div>

      <div className="mb-6 flex border-b border-[#E8E5F0]">
        <button
          type="button"
          onClick={() => setTab("business")}
          className={`relative flex flex-1 items-center justify-center gap-2 pb-3 text-[13px] font-semibold transition ${
            tab === "business" ? "text-[#4F7FFF]" : "text-[#9CA3AF] hover:text-[#0F0F1A]"
          }`}
        >
          {businessValid ? (
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#22C55E]"
              aria-hidden
            >
              <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path
                  d="M2.5 6L5 8.5L9.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          ) : (
            <span className="h-5 w-5 shrink-0" aria-hidden />
          )}
          <span>Business Details</span>
          {tab === "business" ? (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-[#4F7FFF] to-[#7C3AED]" />
          ) : null}
        </button>
          <button
            type="button"
            onClick={() => {
              if (businessValid) setTab("personal");
              else setError("Complete business details first.");
            }}
            className={`relative flex flex-1 items-center justify-center gap-2 pb-3 text-[13px] font-semibold transition ${
              tab === "personal" ? "text-[#4F7FFF]" : "text-[#9CA3AF] hover:text-[#0F0F1A]"
            }`}
          >
            {personalValid ? (
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#22C55E]"
                aria-hidden
              >
                <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path
                    d="M2.5 6L5 8.5L9.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            ) : (
              <span className="h-5 w-5 shrink-0" aria-hidden />
            )}
            <span>Personal Details</span>
            {tab === "personal" ? (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-[#4F7FFF] to-[#7C3AED]" />
            ) : null}
          </button>
          <button
            type="button"
            disabled={!createdEmployeeId && tab !== "face"}
            className={`relative flex-1 pb-3 text-[13px] font-semibold transition ${
              tab === "face" ? "text-[#4F7FFF]" : "text-[#9CA3AF] opacity-50"
            }`}
          >
            Face Registration
            {tab === "face" ? (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-[#4F7FFF] to-[#7C3AED]" />
            ) : null}
          </button>
        </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-800">
          {error}
        </p>
      ) : null}

      {tab === "business" ? (
        <div className="space-y-5 rounded-2xl border border-[#E8E5F0] bg-white p-6 shadow-lg shadow-black/[0.04] sm:p-8">
          <label className="block">
            <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              Business Name <span className="text-red-500">*</span>
            </span>
            <input
              className={inputClass}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Your company"
              autoComplete="organization"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                State <span className="text-red-500">*</span>
              </span>
              <select
                className={selectClass}
                value={stateCode}
                onChange={(e) => handleStateChange(e.target.value)}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236B6B80' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                }}
              >
                <option value="">Select State</option>
                {states.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                City <span className="text-red-500">*</span>
              </span>
              <select
                className={selectClass}
                disabled={!stateCode || loadingCities}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236B6B80' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                }}
              >
                <option value="">{loadingCities ? "Loading…" : "Select City"}</option>
                {cities.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                Sector <span className="text-red-500">*</span>
              </span>
              <select
                className={selectClass}
                value={sectorCode}
                onChange={(e) => handleSectorChange(e.target.value)}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236B6B80' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                }}
              >
                <option value="">Select Sector</option>
                {sectors.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                Sub Sector <span className="text-red-500">*</span>
              </span>
              <select
                className={selectClass}
                disabled={!sectorCode || loadingSubs}
                value={subSectorCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setSubSectorCode(code);
                  const row = subSectors.find((x) => x.code === code);
                  setSubSectorName(row?.name ?? "");
                }}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236B6B80' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                }}
              >
                <option value="">{loadingSubs ? "Loading…" : "Select Sub Sector"}</option>
                {subSectors.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <p className="mb-2 text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              How many employees are there in your business? <span className="text-red-500">*</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {EMPLOYEE_BANDS.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => setEmployeeCountBand(b.value)}
                  className={`rounded-full border-2 px-4 py-2 text-[12px] font-semibold transition ${
                    employeeCountBand === b.value
                      ? "border-[#4F7FFF] bg-[#EFF6FF] text-[#4F7FFF]"
                      : "border-[#E8E5F0] bg-[#FAFAFA] text-[#6B6B80] hover:border-[#CACAD6]"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={goPersonal}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] text-sm font-semibold text-white shadow-lg shadow-[#4F7FFF]/25 transition hover:opacity-[0.97]"
          >
            Next Step
          </button>
        </div>
      ) : tab === "personal" ? (
        <div className="space-y-5 rounded-2xl border border-[#E8E5F0] bg-white p-6 shadow-lg shadow-black/[0.04] sm:p-8">
          <label className="block">
            <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              Name <span className="text-red-500">*</span>
            </span>
            <input
              className={inputClass}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              autoComplete="name"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              Business Email <span className="text-red-500">*</span>
            </span>
            <input
              className={inputClass}
              type="email"
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
              placeholder="johndoe@work.com"
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              Alternate Phone Number <span className="text-red-500">*</span>
            </span>
            <div className="flex">
              <span className="flex h-11 shrink-0 items-center rounded-l-lg border-2 border-r-0 border-[#E8E5F0] bg-[#F3F4F6] px-3 text-[13px] font-semibold text-[#6B6B80]">
                +91
              </span>
              <input
                className={`${inputClass} rounded-l-none border-l-0 pl-3`}
                value={alternatePhoneDigits}
                onChange={(e) => setAlternatePhoneDigits(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="1234567890"
                inputMode="numeric"
                autoComplete="tel-national"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              Alternate Contact Name <span className="text-red-500">*</span>
            </span>
            <input
              className={inputClass}
              value={alternateContactName}
              onChange={(e) => setAlternateContactName(e.target.value)}
              placeholder="Jane Doe"
              autoComplete="name"
            />
          </label>

          <div>
            <p className="mb-2 text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              Describe your role in the organization <span className="text-red-500">*</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {ORG_ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setOrganizationRole(r.id)}
                  className={`rounded-full border-2 px-4 py-2 text-[12px] font-semibold transition ${
                    organizationRole === r.id
                      ? "border-[#4F7FFF] bg-[#EFF6FF] text-[#4F7FFF]"
                      : "border-[#E8E5F0] bg-[#FAFAFA] text-[#6B6B80] hover:border-[#CACAD6]"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={() => void submitAll()}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] text-sm font-semibold text-white shadow-lg shadow-[#4F7FFF]/25 transition hover:opacity-[0.97] disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save & Continue"}
          </button>
        </div>
      ) : (
        <div className="space-y-5 rounded-2xl border border-[#E8E5F0] bg-white p-6 shadow-lg shadow-black/[0.04] sm:p-8">
          {faceRegistered ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-[22px] font-black text-emerald-900">Face Registered Successfully!</h2>
              <p className="mt-2 text-[14px] text-emerald-700">
                You are fully set up. Redirecting to your dashboard...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-[20px] font-black text-[#0F0F1A]">Setup Face Attendance</h2>
                <p className="mt-1 text-[13px] text-[#6B6B80]">
                  Register your face now so you can easily clock in and out.
                </p>
              </div>

              {capturingFace ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-10 w-10 animate-spin text-[#4F7FFF]" />
                  <p className="mt-4 text-sm font-medium text-[#6B6B80]">Processing face...</p>
                </div>
              ) : (
                <FaceCapture onCapture={handleFaceCapture} />
              )}

            </>
          )}
        </div>
      )}
    </section>
  );
}
