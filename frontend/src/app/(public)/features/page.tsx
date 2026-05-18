import Link from "next/link";

const features = [
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 22 22" aria-hidden>
        <circle cx="11" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" />
        <path d="M4 19c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
    title: "Employee Directory & Onboarding",
    description:
      "Centralise employee profiles, documents, and onboarding workflows. Role-based views ensure everyone sees exactly what they need.",
    tag: "Core HR",
    accentColor: "#4F7FFF",
    bgColor: "#EEF4FF",
    borderColor: "#BFDBFE",
    textColor: "#1D4ED8",
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 22 22" aria-hidden>
        <rect x="3" y="4" width="16" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
        <path d="M7 2v4M15 2v4M3 10h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
    title: "Shift Planning & Attendance Engine",
    description:
      "Build and publish shifts in minutes. Our real-time engine captures check-ins, overtime, and exceptions automatically.",
    tag: "Attendance",
    accentColor: "#16A34A",
    bgColor: "#F0FDF4",
    borderColor: "#BBF7D0",
    textColor: "#15803D",
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 22 22" aria-hidden>
        <path d="M4 11h14M11 4v14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <rect x="2.5" y="2.5" width="17" height="17" rx="3" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    ),
    title: "Leave Approvals & Balance Tracking",
    description:
      "Configurable leave policies, multi-level approval chains, and live balance dashboards for employees and managers.",
    tag: "Leave Mgmt",
    accentColor: "#7C3AED",
    bgColor: "#F5F3FF",
    borderColor: "#DDD6FE",
    textColor: "#6D28D9",
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 22 22" aria-hidden>
        <path d="M3 16l5-5 3.5 3.5 4.5-6L20 11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="2.5" y="2.5" width="17" height="17" rx="3" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    ),
    title: "Payroll-Ready Data Foundation",
    description:
      "Structured attendance exports, salary components, and integrations with leading payroll providers — ready on the 1st.",
    tag: "Payroll",
    accentColor: "#D97706",
    bgColor: "#FFFBEB",
    borderColor: "#FDE68A",
    textColor: "#B45309",
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 22 22" aria-hidden>
        <rect x="3" y="3" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.7" />
        <path d="M8 10.5l2 2.5 4-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Role-Based Access & Audit Support",
    description:
      "Granular permissions down to the field level. Full audit logs for compliance, with export support for statutory filings.",
    tag: "Security",
    accentColor: "#DB2777",
    bgColor: "#FDF2F8",
    borderColor: "#FBCFE8",
    textColor: "#BE185D",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] font-sans text-[#0F0F1A]">

      {/* Decorative BG */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-[#EEF4FF] via-[#F0EBFF] to-transparent opacity-60" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-[#F0FDF4] to-transparent opacity-50" />
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
          <Link href="/features" className="font-bold text-[#0F0F1A]">Features</Link>
          <Link href="/pricing" className="hover:text-[#0F0F1A] transition-colors">Pricing</Link>
          <Link href="/contact" className="hover:text-[#0F0F1A] transition-colors">Contact</Link>
        </div>
        <Link href="/signup">
          <button type="button" className="rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] px-5 py-2 text-[13px] font-semibold text-white shadow-md shadow-blue-200 hover:shadow-lg transition-all hover:-translate-y-px">
            Get started →
          </button>
        </Link>
      </nav>

      <section className="relative z-10 mx-auto max-w-5xl px-10 pb-28 pt-20">
        <div className="mb-16 max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#4F7FFF]/20 bg-white px-4 py-1.5 shadow-sm">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#4F7FFF]">Platform Features</span>
          </div>
          <h1 className="mb-5 text-[48px] font-black leading-[1.08] tracking-[-0.04em]">
            Everything your HR team needs,{" "}
            <span className="bg-gradient-to-r from-[#4F7FFF] via-[#7C3AED] to-[#EC4899] bg-clip-text text-transparent">
              nothing it doesn&apos;t
            </span>
          </h1>
          <p className="text-[16px] leading-relaxed text-[#6B6B80]">
            Built for lean HR teams managing growing workforces. Every feature is thoughtfully designed to reduce manual work.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`group relative rounded-3xl border bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${i === 0 ? "md:col-span-2" : ""}`}
              style={{ borderColor: "#E8E5F0" }}
            >
              {/* Colored accent left border on hover */}
              <div className="absolute left-0 top-6 bottom-6 w-1 rounded-full opacity-0 group-hover:opacity-100 transition-all" style={{ background: feature.accentColor }} />

              <div className={`flex gap-6 ${i === 0 ? "md:flex-row md:items-center" : "flex-col"}`}>
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border transition-all group-hover:scale-105" style={{ background: feature.bgColor, color: feature.accentColor, borderColor: feature.borderColor }}>
                    {feature.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mb-2.5 flex flex-wrap items-start justify-between gap-3">
                    <h2 className={`font-black text-[#0F0F1A] leading-snug ${i === 0 ? "text-[20px]" : "text-[15px]"}`}>{feature.title}</h2>
                    <span className="flex-shrink-0 rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: feature.bgColor, color: feature.textColor }}>
                      {feature.tag}
                    </span>
                  </div>
                  <p className={`leading-relaxed text-[#9CA3AF] ${i === 0 ? "text-[15px]" : "text-[13px]"}`}>{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA banner */}
        <div className="mt-16 overflow-hidden rounded-3xl border border-[#C4B5FD] bg-gradient-to-br from-[#F5F3FF] via-[#EEF4FF] to-[#FFF0F7] p-10 text-center shadow-lg">
          <div className="relative">
            <h3 className="mb-3 text-[26px] font-black text-[#0F0F1A] tracking-tight">Ready to streamline your HR operations?</h3>
            <p className="mb-8 text-[14.5px] text-[#9CA3AF]">Set up in under 30 minutes. No migration headaches.</p>
            <div className="flex justify-center gap-3">
              <Link href="/signup">
                <button type="button" className="rounded-2xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] px-8 py-3 text-[14px] font-bold text-white shadow-lg shadow-violet-200 transition-all hover:shadow-xl hover:-translate-y-px">
                  Start Free Trial
                </button>
              </Link>
              <Link href="/contact">
                <button type="button" className="rounded-2xl border-2 border-black/10 bg-white px-8 py-3 text-[14px] font-bold text-[#333] transition-all hover:border-black/20 hover:shadow-md hover:-translate-y-px">
                  Talk to Sales
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
