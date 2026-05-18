import Link from "next/link";

function BrandMark() {
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#4F7FFF]">
      <svg width="14" height="14" fill="none" viewBox="0 0 14 14" aria-hidden>
        <rect x="1" y="1" width="5" height="5" rx="1" fill="white" />
        <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.6" />
        <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.6" />
        <rect x="8" y="8" width="5" height="5" rx="1" fill="white" />
      </svg>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0A0B0F] font-sans text-white">
      <nav className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <BrandMark />
          <span className="text-[15px] font-semibold tracking-tight">WorkforceOS</span>
        </Link>
        <div className="hidden items-center gap-7 text-[13px] text-white/50 md:flex">
          <Link href="/features" className="transition-colors hover:text-white">
            Features
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-white">
            Pricing
          </Link>
          <Link href="/contact" className="transition-colors hover:text-white">
            Contact
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login">
            <span className="rounded-lg px-3 py-1.5 text-[13px] text-white/60 transition-colors hover:bg-white/5 hover:text-white">
              Sign in
            </span>
          </Link>
          <Link href="/signup">
            <span className="rounded-lg bg-[#4F7FFF] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#3A6AEA] sm:px-4">
              Get started
            </span>
          </Link>
        </div>
      </nav>

      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16 pt-6 sm:px-8 sm:pt-8">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1 text-[13px] text-white/40 transition-colors hover:text-white sm:mb-8"
          >
            <span aria-hidden>←</span> Back to website
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
