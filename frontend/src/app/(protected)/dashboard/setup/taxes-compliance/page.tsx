"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Check, Landmark } from "lucide-react";

const inputClass =
  "h-11 w-full rounded-lg border-2 border-[#E8E5F0] bg-[#FAFAFA] px-3.5 text-[13px] font-medium text-[#0F0F1A] outline-none transition placeholder:text-[#CACAD6] focus:border-[#7C3AED]/50 focus:bg-white focus:ring-[3px] focus:ring-[#7C3AED]/10";

export default function TaxesComplianceSetupPage() {
  const router = useRouter();
  const [tdsEnabled, setTdsEnabled] = useState(false);
  const [deductorType, setDeductorType] = useState<"employee" | "non_employee">("employee");
  const [saved, setSaved] = useState(false);

  const continueToSetup = () => {
    localStorage.setItem("setup:kybSkipped", "true");
    localStorage.setItem("setup:businessFunctionsDone", "true");
    localStorage.setItem("setup:taxesComplianceDone", "true");
    router.push("/dashboard/setup?taxesComplianceDone=true");
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
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#4F7FFF]">Taxes & Compliance</p>
                <h1 className="mt-1 text-[24px] font-black tracking-[-0.03em] text-[#0F0F1A] sm:text-[30px]">
                  Organisation Tax Details
                </h1>
                <p className="mt-2 max-w-2xl text-[13px] font-medium leading-relaxed text-[#6B6B80]">
                  Enable TDS only if your organisation needs Form 130 or Form 16 generation details.
                </p>
              </div>

              <div className="flex rounded-xl border border-[#E8E5F0] bg-white p-1 shadow-sm">
                {["KYB", "Business Functions", "Taxes & Compliance"].map((step, index) => (
                  <span
                    key={step}
                    className={`rounded-lg px-3 py-2 text-[12px] font-bold ${
                      index < 2 ? "bg-emerald-50 text-emerald-600" : "bg-[#EFF6FF] text-[#4F7FFF]"
                    }`}
                  >
                    {index < 2 ? "✓ " : "3 "}
                    {step}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-7 px-5 py-6 sm:px-7">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-[#E8E5F0] bg-[#FAFAFA] px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] text-white shadow-md shadow-blue-200">
                  <Landmark className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[15px] font-black text-[#0F0F1A]">Enable TDS for Organisation</p>
                  <p className="mt-0.5 text-[12px] font-medium text-[#9CA3AF]">
                    Turn this on to capture TAN, PAN, AO code, and deductor details.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={tdsEnabled}
                onClick={() => setTdsEnabled((value) => !value)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  tdsEnabled ? "bg-[#2563EB]" : "bg-[#A7AEC0]"
                }`}
              >
                <span
                  className={`absolute top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[#2563EB] transition ${
                    tdsEnabled ? "left-6" : "left-1"
                  }`}
                >
                  {tdsEnabled ? <Check className="h-3 w-3" /> : null}
                </span>
              </button>
            </div>

            {tdsEnabled ? (
              <div className="space-y-8">
                <section>
                  <h2 className="text-[17px] font-black text-[#0F0F1A]">Organisation Tax Details</h2>
                  <p className="mt-1 text-[12px] font-medium text-[#9CA3AF]">
                    Need details for Form 130 and Form 16 generation.
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                        PAN
                      </span>
                      <input className={inputClass} placeholder="AAAAA0000A" />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                        TAN
                      </span>
                      <input className={inputClass} placeholder="AAAA00000A" />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                        TDS Circle AO Code <span className="text-red-500">*</span>
                      </span>
                      <input className={inputClass} placeholder="AAA/AA/000/00" />
                    </label>
                  </div>
                </section>

                <section>
                  <h2 className="text-[17px] font-black text-[#0F0F1A]">Tax Deductor Details</h2>
                  <div className="mt-4">
                    <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                      Deductor Type <span className="text-red-500">*</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        ["employee", "Employee"],
                        ["non_employee", "Non Employee"],
                      ].map(([id, label]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setDeductorType(id as "employee" | "non_employee")}
                          className={`flex h-10 items-center gap-2 rounded-lg border-2 px-4 text-[13px] font-bold transition ${
                            deductorType === id
                              ? "border-[#4F7FFF] bg-[#EFF6FF] text-[#2563EB]"
                              : "border-[#E8E5F0] bg-white text-[#6B6B80]"
                          }`}
                        >
                          <span
                            className={`h-3.5 w-3.5 rounded-full border ${
                              deductorType === id ? "border-[#2563EB] bg-[#2563EB]" : "border-[#CACAD6]"
                            }`}
                          />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                        Deductor Name <span className="text-red-500">*</span>
                      </span>
                      <input className={inputClass} placeholder="John Doe" />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                        Deductor Father Name <span className="text-red-500">*</span>
                      </span>
                      <input className={inputClass} placeholder="Father's Name" />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSaved(true)}
                    className="mt-5 flex h-10 w-36 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] text-[13px] font-black text-white shadow-lg shadow-[#4F7FFF]/20 transition hover:opacity-[0.97]"
                  >
                    Save
                  </button>
                  {saved ? <p className="mt-3 text-[12px] font-semibold text-emerald-600">Tax details saved.</p> : null}
                </section>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#E8E5F0] bg-[#F7F5F0]/95 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1060px] justify-end gap-3">
          <Link
            href="/dashboard/setup/business-functions"
            className="flex h-10 w-28 items-center justify-center rounded-xl border-2 border-[#E8E5F0] bg-white text-[13px] font-bold text-[#6B6B80] transition hover:border-[#4F7FFF] hover:text-[#4F7FFF]"
          >
            Back
          </Link>
          <button
            type="button"
            onClick={continueToSetup}
            className="flex h-10 w-36 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] text-[13px] font-black text-white shadow-lg shadow-[#4F7FFF]/20 transition hover:opacity-[0.97]"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
