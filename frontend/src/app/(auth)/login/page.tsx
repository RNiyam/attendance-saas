"use client";

import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { apiBaseUrl } from "@/services/http";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    const normalizedEmail = identifier.trim().toLowerCase();
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          identifier: normalizedEmail,
          password,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorMessage(data?.error ?? "Login failed. Please check your email and password.");
        return;
      }
      const orgSlug = data?.organization?.slug ?? "";
      if (data?.requiresPasswordChange) {
        router.push(
          `/complete-signup?org=${encodeURIComponent(orgSlug)}&email=${encodeURIComponent(normalizedEmail)}`,
        );
        return;
      }
      if (data?.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        // Clear any stale setup progress from a previous user's session
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith("setup:")) {
            localStorage.removeItem(key);
            i--; // Adjust index since we removed an item
          }
        }
      }
      if (data?.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
      if (orgSlug) localStorage.setItem("organizationCode", orgSlug);
      router.push("/onboarding");
    } catch {
      setErrorMessage("Network error while signing in.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border-2 border-[#E8E5F0] bg-[#FAFAFA] py-3 pl-11 pr-4 text-[14px] font-medium text-[#0F0F1A] outline-none transition placeholder:text-[#CACAD6] focus:border-[#7C3AED]/50 focus:bg-white focus:ring-[3px] focus:ring-[#7C3AED]/10";

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
      {/* Left — Face Scan Animation */}
      <section className="relative hidden flex-col justify-between overflow-hidden px-8 py-10 lg:flex xl:px-12 xl:py-14">
        <div className="flex w-full max-w-[28rem] flex-col items-start text-left">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6B6B80] transition-colors hover:text-[#0F0F1A]"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            Back to website
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <FaceScanner />
        </div>

        <div className="w-full max-w-[28rem]"></div>
      </section>

      {/* Right — sign-in form */}
      <section className="flex flex-col justify-center px-4 py-8 sm:px-8 lg:border-l lg:border-black/[0.06] lg:bg-white/60 lg:px-10 lg:backdrop-blur-sm xl:px-14">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6B6B80] transition-colors hover:text-[#0F0F1A] lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to website
        </Link>

        <div className="mx-auto w-full max-w-[400px]">
          <div className="mb-8 lg:mb-10">
            <h2 className="text-[28px] font-black tracking-[-0.03em] text-[#0F0F1A] sm:text-[32px]">Sign in</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[#6B6B80]">
              Use your work email or your first name. No organization code needed.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="identifier"
                className="mb-2 block text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]"
              >
                Work email or Name
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@company.com or John"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label htmlFor="password" className="text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                  Password
                </label>
                <Link href="/forgot-password" className="text-[12px] font-semibold text-[#4F7FFF] hover:text-[#3A6AEA]">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#9CA3AF] transition-colors hover:bg-[#F0F0F5] hover:text-[#6B6B80]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {errorMessage ? (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
                <p className="text-[13px] leading-relaxed text-red-700">{errorMessage}</p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] py-3.5 text-[14px] font-bold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-300 disabled:translate-y-0 disabled:opacity-70"
            >
              {submitting ? "Signing in…" : "Sign in"}
              {!submitting ? (
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden>
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </button>
          </form>

          <p className="mt-8 text-center text-[13px] text-[#6B6B80]">
            New to WorkforceOS?{" "}
            <Link href="/signup" className="font-bold text-[#4F7FFF] hover:text-[#3A6AEA]">
              Create your workspace
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

const FaceScanner = () => {
  const [scanState, setScanState] = useState<"aligning" | "scanning" | "success">("aligning");

  useEffect(() => {
    let timeout1: NodeJS.Timeout;
    let timeout2: NodeJS.Timeout;

    const runSequence = () => {
      setScanState("aligning");
      timeout1 = setTimeout(() => {
        setScanState("scanning");
      }, 2000);
      timeout2 = setTimeout(() => {
        setScanState("success");
      }, 4500);
    };

    runSequence();
    const interval = setInterval(runSequence, 8000);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan-laser {
          0%, 100% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          50% { top: 100%; opacity: 1; }
          90% { opacity: 1; }
        }
        .animate-scan-laser {
          animation: scan-laser 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}} />
      <div className="relative flex w-full flex-col items-center justify-center">
        <div className="mb-6 text-center">
          <h2 className="text-[28px] font-black tracking-[-0.03em] text-[#0F0F1A]">
            Biometric Access
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[#6B6B80]">
            Your face is your key to the workspace.
          </p>
        </div>
        
        {/* iPhone Frame Mockup with Floating Tags */}
        <div className="relative flex items-center justify-center">
          
          {/* Floating Tag 1 (Top Left) */}
          <div className={`absolute right-[calc(100%+1.5rem)] top-[20%] z-30 flex w-max items-center gap-3 rounded-2xl border border-white/40 bg-white/70 p-3.5 shadow-xl backdrop-blur-md transition-all duration-[800ms] ${scanState !== 'aligning' ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4F7FFF]/10 text-[#4F7FFF]">
              <Lock className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Security</p>
              <p className="text-[13px] font-bold text-[#0F0F1A]">AES-256 Encrypted</p>
            </div>
          </div>

          {/* Floating Tag 2 (Bottom Right) */}
          <div className={`absolute left-[calc(100%+1.5rem)] bottom-[20%] z-30 flex w-max items-center gap-3 rounded-2xl border border-white/40 bg-white/70 p-3.5 shadow-xl backdrop-blur-md transition-all duration-[800ms] delay-300 ${scanState === 'success' ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#16A34A]/10 text-[#16A34A]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Verification</p>
              <p className="text-[13px] font-bold text-[#0F0F1A]">Match 99.9%</p>
            </div>
          </div>

          {/* Floating Tag 3 (Top Right) */}
          <div className={`absolute left-[calc(100%+1.5rem)] top-[20%] z-30 flex w-max items-center gap-3 rounded-2xl border border-white/40 bg-white/70 p-3.5 shadow-xl backdrop-blur-md transition-all duration-[800ms] delay-150 ${scanState !== 'aligning' ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EC4899]/10 text-[#EC4899]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Liveness</p>
              <p className="text-[13px] font-bold text-[#0F0F1A]">Confirmed Live</p>
            </div>
          </div>

          <div className="relative h-[480px] w-[230px] rounded-[40px] border-[10px] border-[#1A1A1A] bg-black shadow-2xl overflow-hidden ring-4 ring-black/5">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 z-20 h-5 w-20 -translate-x-1/2 rounded-b-2xl bg-[#1A1A1A]"></div>
          
          {/* Screen UI */}
          <div className="relative h-full w-full overflow-hidden bg-black">
            {/* Face Image */}
            <div className="absolute inset-0 h-full w-full">
              <img 
                src="/images/realistic-face.png" 
                alt="Face scan" 
                className={`h-full w-full object-cover transition-transform duration-[4000ms] ease-in-out ${scanState === 'aligning' ? 'scale-110 translate-y-2' : scanState === 'scanning' ? 'scale-100 translate-y-0' : 'scale-105'}`}
              />
              {/* Success Overlay */}
              <div className={`absolute inset-0 bg-black/40 transition-opacity duration-500 ${scanState === 'success' ? 'opacity-100' : 'opacity-0'}`}></div>
            </div>

            {/* Scanning Elements */}
            {scanState !== 'success' && (
              <div className="absolute left-0 top-[35%] z-10 flex w-full justify-center">
                <div className={`relative h-20 w-48 rounded-xl border-2 transition-colors duration-500 ${scanState === 'scanning' ? 'border-[#4F7FFF]' : 'border-white/50'}`}>
                  {/* Corner accents */}
                  <div className="absolute -left-1 -top-1 h-4 w-4 border-l-4 border-t-4 border-[#4F7FFF] rounded-tl-xl"></div>
                  <div className="absolute -right-1 -top-1 h-4 w-4 border-r-4 border-t-4 border-[#4F7FFF] rounded-tr-xl"></div>
                  <div className="absolute -left-1 -bottom-1 h-4 w-4 border-b-4 border-l-4 border-[#4F7FFF] rounded-bl-xl"></div>
                  <div className="absolute -right-1 -bottom-1 h-4 w-4 border-b-4 border-r-4 border-[#4F7FFF] rounded-br-xl"></div>
                  
                  {/* Laser line */}
                  <div className="absolute left-0 top-0 h-0.5 w-full bg-[#4F7FFF] shadow-[0_0_8px_2px_rgba(79,127,255,0.6)] animate-scan-laser"></div>
                  
                  {/* Grid overlay when scanning */}
                  {scanState === 'scanning' && (
                    <div className="absolute inset-0 flex items-center justify-center p-1">
                      <div className="h-full w-full bg-[#4F7FFF]/20 animate-pulse border border-[#4F7FFF]/40 grid grid-cols-6 grid-rows-2 gap-[1px]">
                         {Array.from({ length: 12 }).map((_, i) => (
                           <div key={i} className="bg-[#4F7FFF]/10 border border-[#4F7FFF]/20"></div>
                         ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status Text at bottom of screen */}
            <div className="absolute bottom-8 left-0 right-0 z-20 flex flex-col items-center justify-center">
              {scanState === 'success' ? (
                <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-500">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#16A34A] shadow-[0_0_16px_rgba(22,163,74,0.6)]">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-white">Punch In Successful</h3>
                    <p className="text-[10px] text-white/80">Face Recognized</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-md">
                  <div className={`h-1.5 w-1.5 rounded-full ${scanState === 'scanning' ? 'animate-pulse bg-[#4F7FFF]' : 'bg-white'}`}></div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white">
                    {scanState === 'aligning' ? 'Aligning...' : 'Scanning...'}
                  </span>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
