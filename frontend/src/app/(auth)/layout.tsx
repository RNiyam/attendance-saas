import Link from "next/link";
import { DM_Sans } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
});

function BrandMark() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] shadow-lg shadow-blue-200">
      <svg width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden>
        <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" fill="white" />
        <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" fill="white" opacity="0.65" />
        <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" fill="white" opacity="0.65" />
        <rect x="9" y="9" width="5.5" height="5.5" rx="1.5" fill="white" />
      </svg>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${dmSans.className} relative flex min-h-dvh flex-col overflow-hidden bg-[#F7F5F0] text-[#0F0F1A]`}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -right-40 h-[700px] w-[700px] rounded-full bg-gradient-to-br from-[#D4E4FF] via-[#EDE9FE] to-transparent opacity-60" />
        <div className="absolute top-1/2 -left-32 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-[#FFF0D4] via-[#FFE4E4] to-transparent opacity-50" />
        <div className="absolute -bottom-20 right-1/4 h-[400px] w-[400px] rounded-full bg-gradient-to-tl from-[#D4FFE4] to-transparent opacity-40" />
        <svg className="absolute top-24 right-[12%] opacity-[0.12]" width="100" height="100" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="55" stroke="#4F7FFF" strokeWidth="1" strokeDasharray="4 6" />
          <circle cx="60" cy="60" r="35" stroke="#A78BFA" strokeWidth="1" strokeDasharray="4 6" />
        </svg>
      </div>

      <nav className="relative z-20 flex shrink-0 items-center justify-between border-b border-black/[0.06] bg-[#F7F5F0]/85 px-4 py-3 backdrop-blur-sm sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <BrandMark />
          <span className="truncate text-[15px] font-bold tracking-[-0.02em] text-[#0F0F1A]">WorkforceOS</span>
        </Link>
        <div className="hidden items-center gap-8 text-[13.5px] font-medium text-[#6B6B80] md:flex">
          <Link href="/features" className="transition-colors hover:text-[#0F0F1A]">
            Features
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-[#0F0F1A]">
            Pricing
          </Link>
          <Link href="/contact" className="transition-colors hover:text-[#0F0F1A]">
            Contact
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-[13px] font-medium text-[#6B6B80] transition-colors hover:bg-black/5 hover:text-[#0F0F1A] sm:px-4"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] px-4 py-2 text-[13px] font-semibold text-white shadow-md shadow-blue-200 transition-all hover:-translate-y-px hover:shadow-lg hover:shadow-blue-300"
          >
            Get started →
          </Link>
        </div>
      </nav>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
