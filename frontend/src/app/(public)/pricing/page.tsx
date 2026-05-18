import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "₹999",
    per: "per month",
    description: "Attendance tracking and basic HR for small teams getting started.",
    cta: "Start free trial",
    ctaHref: "/signup",
    featured: false,
    accentColor: "#4F7FFF",
    bgColor: "#F5F8FF",
    borderColor: "#C7D9FF",
    features: [
      "Up to 25 employees",
      "Attendance & check-in/out",
      "Basic employee directory",
      "Leave requests",
      "Email support",
    ],
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 22 22" aria-hidden>
        <rect x="3" y="3" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.7" />
        <path d="M8 11h6M11 8v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Growth",
    price: "₹2,499",
    per: "per month",
    description: "Shift workflows, multi-level approvals, and analytics for scaling teams.",
    cta: "Start free trial",
    ctaHref: "/signup",
    featured: true,
    accentColor: "#7C3AED",
    bgColor: "#FAF7FF",
    borderColor: "#C4B5FD",
    features: [
      "Up to 150 employees",
      "Everything in Starter",
      "Shift planning & scheduling",
      "Leave workflows & approvals",
      "Attendance reports",
      "Priority email & chat support",
    ],
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 22 22" aria-hidden>
        <path d="M3 16l5-5 3.5 3.5 4.5-6L20 11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "Enterprise",
    price: "Custom",
    per: "talk to us",
    description: "Payroll-ready data, SSO, advanced analytics, and dedicated support.",
    cta: "Talk to sales",
    ctaHref: "/contact",
    featured: false,
    accentColor: "#D97706",
    bgColor: "#FFFDF5",
    borderColor: "#FDE68A",
    features: [
      "Unlimited employees",
      "Everything in Growth",
      "Payroll integration",
      "SSO & advanced security",
      "Custom analytics",
      "Dedicated account manager",
    ],
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 22 22" aria-hidden>
        <path d="M11 2l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L2.5 8.2l5.9-.9L11 2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] font-sans text-[#0F0F1A]">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 left-1/3 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#EDE9FE] via-[#DBEAFE] to-transparent opacity-50" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-gradient-to-tl from-[#FEF3C7] to-transparent opacity-40" />
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
          <Link href="/pricing" className="font-bold text-[#0F0F1A]">Pricing</Link>
          <Link href="/contact" className="hover:text-[#0F0F1A] transition-colors">Contact</Link>
        </div>
        <Link href="/signup">
          <button type="button" className="rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] px-5 py-2 text-[13px] font-semibold text-white shadow-md shadow-blue-200 hover:shadow-lg transition-all hover:-translate-y-px">
            Get started →
          </button>
        </Link>
      </nav>

      <section className="relative z-10 mx-auto max-w-5xl px-10 pb-28 pt-20">
        <div className="mb-16 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/20 bg-white px-4 py-1.5 shadow-sm">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#7C3AED]">Simple Pricing</span>
          </div>
          <h1 className="mb-4 text-[48px] font-black leading-[1.08] tracking-[-0.04em]">
            Transparent plans,{" "}
            <span className="bg-gradient-to-r from-[#4F7FFF] via-[#7C3AED] to-[#EC4899] bg-clip-text text-transparent">
              zero surprises
            </span>
          </h1>
          <p className="mx-auto max-w-md text-[16px] leading-relaxed text-[#6B6B80]">
            Start free for 14 days. No credit card required. Upgrade when you&apos;re ready.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="relative flex flex-col rounded-3xl p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              style={{
                background: plan.featured
                  ? "linear-gradient(135deg, #FAF7FF 0%, #F0EBFF 100%)"
                  : "white",
                border: plan.featured
                  ? `2px solid ${plan.borderColor}`
                  : "1.5px solid #E8E5F0",
                boxShadow: plan.featured
                  ? "0 20px 60px -10px rgba(124,58,237,0.15)"
                  : "0 4px 20px -4px rgba(0,0,0,0.06)",
              }}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-gradient-to-r from-[#4F7FFF] to-[#7C3AED] px-4 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-md">
                    Most popular
                  </span>
                </div>
              )}

              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm" style={{ background: plan.bgColor, color: plan.accentColor, border: `1.5px solid ${plan.borderColor}` }}>
                {plan.icon}
              </div>

              <h2 className="mb-1.5 text-[17px] font-black text-[#0F0F1A]">{plan.name}</h2>
              <p className="mb-6 text-[12.5px] leading-relaxed text-[#9CA3AF]">{plan.description}</p>

              <div className="mb-7">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[38px] font-black tracking-tight text-[#0F0F1A]">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-[13px] font-medium text-[#9CA3AF]">/mo</span>}
                </div>
                <span className="text-[12px] font-medium text-[#BABAC8]">{plan.per}</span>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-[13.5px] text-[#4A4A5A] font-medium">
                    <div className="mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full" style={{ background: plan.bgColor }}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 12 12" aria-hidden>
                        <path d="M2.5 6l2 2.5L9.5 3.5" stroke={plan.accentColor} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href={plan.ctaHref}>
                <button
                  type="button"
                  className="w-full rounded-2xl py-3 text-[14px] font-bold transition-all hover:-translate-y-px"
                  style={plan.featured ? {
                    background: "linear-gradient(135deg, #4F7FFF 0%, #7C3AED 100%)",
                    color: "white",
                    boxShadow: "0 8px 24px -4px rgba(124,58,237,0.35)"
                  } : {
                    background: plan.bgColor,
                    color: plan.accentColor,
                    border: `1.5px solid ${plan.borderColor}`,
                  }}
                >
                  {plan.cta} →
                </button>
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            { q: "Can I switch plans?", a: "Yes, upgrade or downgrade anytime from your settings." },
            { q: "What counts as an employee?", a: "Any active profile in your WorkforceOS account." },
            { q: "Is data safe?", a: "SOC 2-compliant infrastructure, encrypted at rest and in transit." },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
              <p className="mb-2 text-[13.5px] font-bold text-[#0F0F1A]">{q}</p>
              <p className="text-[12.5px] leading-relaxed text-[#9CA3AF]">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
