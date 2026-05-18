"use client";

import Link from "next/link";
import { useState } from "react";

type FormField = "name" | "email" | "company";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };
  const textFields: Array<{
    name: FormField;
    label: string;
    placeholder: string;
    type: "text" | "email";
  }> = [
    { name: "name", label: "Full Name", placeholder: "Ravi Kumar", type: "text" },
    { name: "email", label: "Work Email", placeholder: "ravi@company.com", type: "email" },
    { name: "company", label: "Company", placeholder: "Acme Pvt Ltd", type: "text" },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F0] font-sans text-[#0F0F1A]">

      {/* Decorative BG */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 right-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#FFF0F7] via-[#EDE9FE] to-transparent opacity-60" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-[#EEF4FF] to-transparent opacity-50" />
      </div>

      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between border-b border-black/[0.06] px-10 py-5 backdrop-blur-sm bg-[#F7F5F0]/80 sticky top-0">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] shadow-lg shadow-blue-200">
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden>
              <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" fill="white" />
              <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" fill="white" opacity="0.65" />
              <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" fill="white" opacity="0.65" />
              <rect x="9" y="9" width="5.5" height="5.5" rx="1.5" fill="white" />
            </svg>
          </div>
          <span className="text-[15px] font-bold tracking-[-0.02em] text-[#0F0F1A]">WorkforceOS</span>
        </Link>
        <div className="hidden items-center gap-8 text-[13.5px] text-[#6B6B80] font-medium md:flex">
          <Link href="/features" className="hover:text-[#0F0F1A] transition-colors">Features</Link>
          <Link href="/pricing" className="hover:text-[#0F0F1A] transition-colors">Pricing</Link>
          <Link href="/contact" className="font-bold text-[#0F0F1A]">Contact</Link>
        </div>
        <Link href="/signup">
          <button type="button" className="rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] px-5 py-2 text-[13px] font-semibold text-white shadow-md shadow-blue-200 hover:shadow-lg transition-all hover:-translate-y-px">
            Get started →
          </button>
        </Link>
      </nav>

      <section className="relative z-10 mx-auto max-w-5xl px-10 pb-28 pt-20">
        <div className="grid items-start gap-16 md:grid-cols-2">

          {/* Left column */}
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#EC4899]/20 bg-white px-4 py-1.5 shadow-sm">
              <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#DB2777]">Contact Sales</span>
            </div>
            <h1 className="mb-5 text-[46px] font-black leading-[1.06] tracking-[-0.04em]">
              Let&apos;s find the{" "}
              <span className="bg-gradient-to-r from-[#4F7FFF] via-[#7C3AED] to-[#EC4899] bg-clip-text text-transparent">
                right plan
              </span>{" "}
              for you
            </h1>
            <p className="mb-12 text-[15.5px] leading-relaxed text-[#6B6B80]">
              Book a 30-minute demo with our team. We&apos;ll walk you through WorkforceOS and help you get your team set up fast.
            </p>

            <div className="space-y-6">
              {[
                {
                  icon: (
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20" aria-hidden>
                      <path d="M10 2a5 5 0 100 10A5 5 0 0010 2zM3.5 18c0-2.485 2.91-4.5 6.5-4.5s6.5 2.015 6.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  ),
                  title: "Dedicated onboarding",
                  desc: "We migrate your data and set up your account with you.",
                  color: "#4F7FFF",
                  bg: "#EEF4FF",
                  border: "#BFDBFE",
                },
                {
                  icon: (
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20" aria-hidden>
                      <rect x="2" y="3" width="16" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
                      <path d="M2 8h16M6 13h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  ),
                  title: "Custom integrations",
                  desc: "Connect your payroll, ERP, and HRIS tools via our API.",
                  color: "#7C3AED",
                  bg: "#F5F3FF",
                  border: "#DDD6FE",
                },
                {
                  icon: (
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20" aria-hidden>
                      <path d="M10 2l2.4 5 5.5.8-4 3.9 1 5.5-4.9-2.6L5.1 17.2l1-5.5L2 7.8l5.5-.8L10 2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                    </svg>
                  ),
                  title: "Response in 24 hours",
                  desc: "Our sales team responds to every inquiry within one business day.",
                  color: "#D97706",
                  bg: "#FFFBEB",
                  border: "#FDE68A",
                },
              ].map(({ icon, title, desc, color, bg, border }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border shadow-sm transition-transform hover:scale-105" style={{ background: bg, color, borderColor: border }}>
                    {icon}
                  </div>
                  <div className="pt-1">
                    <p className="mb-0.5 text-[14px] font-bold text-[#0F0F1A]">{title}</p>
                    <p className="text-[13px] leading-relaxed text-[#9CA3AF]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form card */}
          <div className="rounded-3xl border border-black/[0.07] bg-white p-8 shadow-2xl shadow-violet-100/50">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 border-2 border-green-100">
                  <svg width="36" height="36" fill="none" viewBox="0 0 36 36" aria-hidden>
                    <path d="M7 18l7 7L29 10" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 className="mb-2 text-[22px] font-black text-[#0F0F1A]">Inquiry sent!</h2>
                <p className="text-[14px] text-[#9CA3AF]">We&apos;ll be in touch within one business day.</p>
              </div>
            ) : (
              <>
                <h2 className="mb-7 text-[19px] font-black text-[#0F0F1A]">Book a demo</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {textFields.map(({ name, label, placeholder, type }) => (
                    <div key={name}>
                      <label className="mb-2 block text-[11.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                        {label}
                      </label>
                      <input
                        type={type}
                        required
                        placeholder={placeholder}
                        value={form[name]}
                        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                        className="w-full rounded-xl border-2 border-[#E8E5F0] bg-[#FAFAFA] px-4 py-3 text-[14px] text-[#0F0F1A] font-medium transition-all placeholder:text-[#CACAD6] focus:border-[#7C3AED]/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="mb-2 block text-[11.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                      Message (optional)
                    </label>
                    <textarea
                      placeholder="Tell us about your team size and what you're looking for..."
                      rows={3}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full resize-none rounded-xl border-2 border-[#E8E5F0] bg-[#FAFAFA] px-4 py-3 text-[14px] text-[#0F0F1A] font-medium transition-all placeholder:text-[#CACAD6] focus:border-[#7C3AED]/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10"
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-2 w-full rounded-2xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] py-3.5 text-[14px] font-bold text-white shadow-lg shadow-violet-200 transition-all hover:shadow-xl hover:-translate-y-px"
                  >
                    Send Inquiry →
                  </button>
                  <p className="text-center text-[12px] text-[#CACAD6]">We never share your details. Privacy policy applies.</p>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
