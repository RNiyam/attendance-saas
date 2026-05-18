"use client";

import Link from "next/link";
import { ArrowLeft, ChevronDown, FileUp, ShieldCheck } from "lucide-react";

const inputClass =
  "h-11 w-full rounded-lg border-2 border-[#E8E5F0] bg-[#FAFAFA] px-3.5 text-[13px] font-medium text-[#0F0F1A] outline-none transition placeholder:text-[#CACAD6] focus:border-[#7C3AED]/50 focus:bg-white focus:ring-[3px] focus:ring-[#7C3AED]/10";

const documents = [
  {
    title: "Proprietor's PAN",
    subtitle: "Proprietorship's PAN Card",
  },
  {
    title: "Cancelled Cheque",
    subtitle: "Business or proprietor bank account cheque",
  },
  {
    title: "Identity Proof",
    subtitle: "Aadhaar, Driving License, Voter ID, or Passport",
  },
  {
    title: "GSTIN Certificate",
    subtitle: "Business GSTIN certificate",
  },
];

export default function KybSetupPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F7F5F0] text-[#0F0F1A]">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(212,228,255,0.52)_0%,rgba(247,245,240,0.94)_34%,rgba(255,240,212,0.36)_68%,rgba(255,255,255,0.72)_100%)]"
        aria-hidden
      />

      <main className="relative z-10 mx-auto w-full max-w-[1120px] px-4 pb-32 pt-8 sm:px-6 lg:pt-10">
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
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#4F7FFF]">Organization Setup</p>
                <h1 className="mt-1 text-[24px] font-black tracking-[-0.03em] text-[#0F0F1A] sm:text-[30px]">
                  KYB Details
                </h1>
                <p className="mt-2 max-w-2xl text-[13px] font-medium leading-relaxed text-[#6B6B80]">
                  Add business verification details before enabling finance and payment workflows.
                </p>
              </div>

              <div className="flex rounded-xl border border-[#E8E5F0] bg-white p-1 shadow-sm">
                {["1 KYB", "2 Business Functions", "3 Taxes & Compliance"].map((step, index) => (
                  <span
                    key={step}
                    className={`rounded-lg px-3 py-2 text-[12px] font-bold ${
                      index === 0 ? "bg-[#EFF6FF] text-[#4F7FFF]" : "text-[#9CA3AF]"
                    }`}
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8 px-5 py-6 sm:px-7 sm:py-7">
            <section>
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] text-white shadow-md shadow-blue-200">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-[17px] font-black text-[#0F0F1A]">Basic Details</h2>
                  <p className="text-[12px] font-medium text-[#9CA3AF]">Your business registration profile</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                    Business Type
                  </span>
                  <div className="relative">
                    <select className={`${inputClass} appearance-none pr-10`} defaultValue="Proprietorship">
                      <option>Proprietorship</option>
                      <option>Partnership</option>
                      <option>Private Limited</option>
                      <option>LLP</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                    GSTIN Number <span className="text-red-500">*</span>
                  </span>
                  <input className={inputClass} placeholder="Enter GSTIN number" />
                </label>
              </div>
            </section>

            <section>
              <h2 className="text-[17px] font-black text-[#0F0F1A]">Business Details</h2>
              <p className="mt-1 text-[12px] font-medium text-[#9CA3AF]">Legal and bank details used for verification</p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {[
                  ["Business Name", "Enter business name"],
                  ["Business Address", "Enter business address"],
                  ["Proprietor's PAN Number", "Enter proprietor's PAN number"],
                  ["Bank Account Number", "Enter account number"],
                  ["IFSC Code", "Enter IFSC code"],
                ].map(([label, placeholder]) => (
                  <label key={label} className="block">
                    <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                      {label} <span className="text-red-500">*</span>
                    </span>
                    <input className={inputClass} placeholder={placeholder} />
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-[17px] font-black text-[#0F0F1A]">Business Documents</h2>
              <p className="mt-1 text-[12px] font-medium text-[#9CA3AF]">
                Upload PDF, PNG, or JPEG files. Maximum file size is 10 MB.
              </p>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {documents.map((doc) => (
                  <div key={doc.title} className="rounded-xl border border-[#E8E5F0] bg-[#FAFAFA] p-4">
                    <h3 className="text-[14px] font-black text-[#0F0F1A]">{doc.title}</h3>
                    <p className="mt-1 text-[12px] font-medium text-[#9CA3AF]">{doc.subtitle}</p>
                    <label className="mt-4 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#DBEAFE] bg-[#EFF6FF] text-[13px] font-bold text-[#4F7FFF] transition hover:border-[#4F7FFF]/50 hover:bg-[#EAF2FF]">
                      <FileUp className="h-4 w-4" />
                      Upload File
                      <input type="file" className="sr-only" accept=".pdf,.png,.jpg,.jpeg" />
                    </label>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#E8E5F0] bg-[#F7F5F0]/95 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1120px] justify-end gap-3">
          <Link
            href="/dashboard/setup"
            className="flex h-10 w-28 items-center justify-center rounded-xl border-2 border-[#E8E5F0] bg-white text-[13px] font-bold text-[#6B6B80] transition hover:border-[#4F7FFF] hover:text-[#4F7FFF]"
          >
            Back
          </Link>
          <button
            type="button"
            className="flex h-10 w-40 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] text-[13px] font-black text-white shadow-lg shadow-[#4F7FFF]/20 transition hover:opacity-[0.97]"
          >
            Submit KYB
          </button>
        </div>
      </div>
    </div>
  );
}
