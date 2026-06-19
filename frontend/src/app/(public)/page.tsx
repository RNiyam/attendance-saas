import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#1A1A2E] font-sans overflow-hidden">
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-[#D4E4FF] via-[#EDE9FE] to-transparent opacity-60" />
        <div className="absolute top-1/2 -left-32 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#FFF0D4] via-[#FFE4E4] to-transparent opacity-50" />
        <div className="absolute -bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-tl from-[#D4FFE4] to-transparent opacity-40" />
        <svg className="absolute top-20 right-[15%] opacity-10" width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="55" stroke="#4F7FFF" strokeWidth="1" strokeDasharray="4 6" />
          <circle cx="60" cy="60" r="35" stroke="#A78BFA" strokeWidth="1" strokeDasharray="4 6" />
          <circle cx="60" cy="60" r="15" stroke="#4F7FFF" strokeWidth="1" />
        </svg>
        <svg className="absolute bottom-32 left-[10%] opacity-10" width="80" height="80" viewBox="0 0 80 80" fill="none">
          <rect x="10" y="10" width="60" height="60" rx="8" stroke="#F59E0B" strokeWidth="1" strokeDasharray="4 6" />
          <rect x="25" y="25" width="30" height="30" rx="4" stroke="#F59E0B" strokeWidth="1" />
        </svg>
      </div>

      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between px-10 py-5 backdrop-blur-sm bg-[#F7F5F0]/80 border-b border-black/[0.06] sticky top-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] shadow-lg shadow-blue-200">
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden>
              <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" fill="white" />
              <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" fill="white" opacity="0.65" />
              <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" fill="white" opacity="0.65" />
              <rect x="9" y="9" width="5.5" height="5.5" rx="1.5" fill="white" />
            </svg>
          </div>
          <span className="text-[15px] font-bold tracking-[-0.02em] text-[#0F0F1A]">WorkforceOS</span>
        </div>
        <div className="hidden items-center gap-8 text-[13.5px] text-[#6B6B80] font-medium md:flex">
          <Link href="/features" className="hover:text-[#0F0F1A] transition-colors">Features</Link>
          <Link href="/pricing" className="hover:text-[#0F0F1A] transition-colors">Pricing</Link>
          <Link href="/contact" className="hover:text-[#0F0F1A] transition-colors">Contact</Link>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/login">
            <button type="button" className="px-4 py-2 text-[13px] font-medium text-[#6B6B80] hover:text-[#0F0F1A] transition-colors rounded-lg hover:bg-black/5">
              Sign in
            </button>
          </Link>
          <Link href="/signup">
            <button type="button" className="rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] px-5 py-2 text-[13px] font-semibold text-white shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 transition-all hover:-translate-y-px">
              Get started →
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-10 pb-24 pt-20">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#4F7FFF]/25 bg-white px-4 py-1.5 shadow-sm shadow-blue-100">
          <span className="flex h-1.5 w-1.5 animate-pulse rounded-full bg-[#4F7FFF]" />
          <span className="text-[11.5px] font-semibold uppercase tracking-wider text-[#4F7FFF]">Now in public beta</span>
        </div>

        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="space-y-8">
            <h1 className="text-[58px] font-black leading-[1.04] tracking-[-0.04em] text-[#0F0F1A]">
              HR & Attendance{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-[#4F7FFF] via-[#7C3AED] to-[#EC4899] bg-clip-text text-transparent">
                  for modern
                </span>
              </span>
              {" "}teams
            </h1>
            <p className="max-w-[420px] text-[17px] leading-[1.7] text-[#6B6B80]">
              WorkforceOS brings employees, attendance, shifts, leaves, payroll, and compliance into one beautiful unified platform.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/signup">
                <button type="button" className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] px-7 py-3.5 text-[14px] font-bold text-white shadow-xl shadow-blue-200 transition-all hover:shadow-2xl hover:shadow-blue-300 hover:-translate-y-0.5">
                  Start Free Trial
                  <svg width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </Link>
              <Link href="/features">
                <button type="button" className="flex items-center gap-2 rounded-2xl border-2 border-black/10 bg-white px-7 py-3.5 text-[14px] font-semibold text-[#333] shadow-sm transition-all hover:border-black/20 hover:shadow-md hover:-translate-y-0.5">
                  Explore Features
                </button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-6 pt-1">
              {["No credit card required", "14-day free trial", "Cancel anytime"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-[12.5px] text-[#8B8B9E] font-medium">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100">
                    <svg width="10" height="10" fill="none" viewBox="0 0 10 10" aria-hidden><path d="M2 5l1.8 1.8L8 3" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard preview card */}
          <div className="space-y-3">
            <div className="rounded-3xl border border-black/[0.07] bg-white p-7 shadow-2xl shadow-blue-100/50">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <p className="mb-0.5 text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Live Snapshot · Today</p>
                  <p className="text-[44px] font-black leading-none text-[#0F0F1A] tracking-tight">247</p>
                  <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">Total Employees</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EEF3FF] to-[#E5E4FF] shadow-sm">
                  <svg width="22" height="22" fill="none" viewBox="0 0 22 22" aria-hidden>
                    <circle cx="11" cy="8" r="3.5" stroke="#4F7FFF" strokeWidth="1.7" />
                    <path d="M4 19c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#4F7FFF" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Present", value: 220, color: "#16A34A", light: "#F0FDF4", border: "#BBF7D0" },
                  { label: "Late", value: 18, color: "#D97706", light: "#FFFBEB", border: "#FDE68A" },
                  { label: "On Leave", value: 9, color: "#7C3AED", light: "#F5F3FF", border: "#DDD6FE" },
                ].map(({ label, value, color, light, border }) => (
                  <div key={label} className="rounded-2xl p-4 border" style={{ backgroundColor: light, borderColor: border }}>
                    <p className="text-[26px] font-black leading-none" style={{ color }}>{value}</p>
                    <p className="mt-1.5 text-[11px] font-semibold" style={{ color }}>{label}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl overflow-hidden">
                <div className="flex h-2">
                  <div className="bg-green-500 transition-all" style={{ width: `${(220 / 247) * 100}%` }} />
                  <div className="bg-amber-400 transition-all" style={{ width: `${(18 / 247) * 100}%` }} />
                  <div className="bg-violet-500 transition-all" style={{ width: `${(9 / 247) * 100}%` }} />
                </div>
              </div>
              <p className="mt-2 text-[11px] font-medium text-[#C4C4D0]">Updated just now · 89% attendance rate</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Shifts today", value: "3 active", emoji: "🗓", bg: "#FFF7ED", border: "#FED7AA", text: "#C2410C" },
                { label: "Pending leaves", value: "4 requests", emoji: "📋", bg: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8" },
              ].map(({ label, value, emoji, bg, border, text }) => (
                <div key={label} className="flex items-center gap-3.5 rounded-2xl border p-4 shadow-sm" style={{ backgroundColor: bg, borderColor: border }}>
                  <span className="text-xl">{emoji}</span>
                  <div>
                    <p className="text-[14px] font-bold" style={{ color: text }}>{value}</p>
                    <p className="text-[11px] font-medium" style={{ color: text, opacity: 0.7 }}>{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div className="relative z-10 border-y border-black/[0.06] bg-white/70 backdrop-blur-sm px-10 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: "12,000+", label: "Employees managed" },
              { value: "98.2%", label: "Attendance accuracy" },
              { value: "4 min", label: "Average setup time" },
              { value: "500+", label: "Companies onboarded" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-[30px] font-black tracking-tight text-[#0F0F1A]">{value}</p>
                <p className="mt-1 text-[12px] font-medium text-[#9CA3AF] uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trusted by */}
      <div className="relative z-10 px-10 py-12">
        <p className="mb-7 text-center text-[11px] font-bold uppercase tracking-widest text-[#BABAC8]">Trusted by teams at</p>
        <div className="flex flex-wrap justify-center gap-10">
          {["Acme Corp", "Zyla Health", "Nexus Tech", "Orbit Labs", "Strata HQ"].map((name) => (
            <span key={name} className="text-[15px] font-bold text-[#CACACF] tracking-tight">{name}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
