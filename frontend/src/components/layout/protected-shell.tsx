"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { LogoutControl } from "@/components/layout/logout-control";
import { apiBaseUrl, clearAuthSession } from "@/services/http";
import type { UserRole } from "@/types/rbac";

type MeResponse = {
  user: { id: number; email: string; organizationId: number; phone: string | null };
  organization: {
    id: number;
    name: string;
    slug: string;
    legalName: string | null;
    email: string | null;
    payableDaysPolicy?: string;
    standardWorkdayMinutes?: number;
  } | null;
  role: string | null;
  roleAssigned?: boolean;
  onboardingCompleted?: boolean;
  displayName: string;
  permissions: string[];
};

function toRole(r: string | null | undefined): UserRole | null {
  if (!r?.trim()) return null;
  const x = r.toUpperCase();
  if (x === "OWNER" || x === "ADMIN" || x === "HR" || x === "MANAGER" || x === "EMPLOYEE" || x === "OTHERS") return x;
  return null;
}

/** Personal onboarding tab updates the top bar name while typing (preview); `null` clears preview. */
export const ONBOARDING_HEADER_NAME_EVENT = "workforceos:onboarding-header-name";

type ProtectedShellProps = {
  children: React.ReactNode;
};

export function ProtectedShell({ children }: ProtectedShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [meLoadedPath, setMeLoadedPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  /** When set (including empty string), Personal tab overrides the nav name until cleared. */
  const [headerNamePreview, setHeaderNamePreview] = useState<string | undefined>(undefined);

  const loadMe = useCallback(async () => {
    setApiError(null);
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        clearAuthSession();
        router.replace("/login");
        return;
      }
      const data = (await res.json()) as MeResponse & { error?: string };
      if (!res.ok) {
        router.replace("/login");
        return;
      }
      setMe(data);
    } catch {
      setApiError(
        `Cannot reach the API at ${apiBaseUrl}. Start the backend (cd backend && npm run dev) and set NEXT_PUBLIC_API_URL in frontend/.env.local to the port it prints (e.g. 5003 or 5004), then restart the frontend.`,
      );
    }
  }, [router]);

  useEffect(() => {
    const onPreview = (e: Event) => {
      const p = (e as CustomEvent<{ preview: string | null }>).detail?.preview;
      setHeaderNamePreview(p === null ? undefined : p);
    };
    window.addEventListener(ONBOARDING_HEADER_NAME_EVENT, onPreview);
    return () => window.removeEventListener(ONBOARDING_HEADER_NAME_EVENT, onPreview);
  }, []);

  useEffect(() => {
    const currentPath = pathname;
    setLoading(true);
    const id = window.setTimeout(() => {
      void loadMe().finally(() => {
        setMeLoadedPath(currentPath);
        setLoading(false);
      });
    }, 0);
    return () => window.clearTimeout(id);
  }, [loadMe, pathname]);

  useEffect(() => {
    if (loading || !me) return;
    if (meLoadedPath !== pathname) return;
    const onOnboarding = pathname === "/onboarding" || pathname.startsWith("/onboarding/");
    if (onOnboarding) return;
    const needsOnboarding = !me.onboardingCompleted || !me.roleAssigned;
    if (needsOnboarding) {
      router.replace("/onboarding");
    }
  }, [loading, me, meLoadedPath, pathname, router]);

  useEffect(() => {
    const onOnboarding = pathname === "/onboarding" || pathname.startsWith("/onboarding/");
    if (!onOnboarding) {
      const t = window.setTimeout(() => setHeaderNamePreview(undefined), 0);
      return () => window.clearTimeout(t);
    }
  }, [pathname]);

  if (apiError) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#F7F5F0] px-6 text-center">
        <p className="max-w-md text-[14px] font-semibold text-[#0F0F1A]">API connection failed</p>
        <p className="max-w-lg text-[13px] font-medium leading-relaxed text-[#6B6B80]">{apiError}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void loadMe().finally(() => setLoading(false));
          }}
          className="rounded-lg bg-[#2563EB] px-4 py-2 text-[13px] font-bold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading || !me) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F7F5F0] text-[13px] font-medium text-[#6B6B80]">
        Loading…
      </div>
    );
  }

  const isOnboarding = pathname === "/onboarding" || pathname.startsWith("/onboarding/");
  const isSetup = pathname === "/dashboard/setup" || pathname.startsWith("/dashboard/setup/");

  const resolvedDisplayName =
    isOnboarding && headerNamePreview !== undefined
      ? headerNamePreview.trim() || me.displayName
      : me.displayName;

  const user = {
    id: String(me.user.id),
    name: resolvedDisplayName.trim() || me.displayName.trim() || me.user.email.split("@")[0] || "User",
    email: me.user.email,
    role: toRole(me.role),
  };

  if (isOnboarding) {
    return (
      <div className="relative flex min-h-dvh flex-col bg-[#F7F5F0] text-[#0F0F1A]">
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -top-40 -right-40 h-[700px] w-[700px] rounded-full bg-gradient-to-br from-[#D4E4FF] via-[#EDE9FE] to-transparent opacity-60" />
          <div className="absolute top-1/2 -left-32 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-[#FFF0D4] via-[#FFE4E4] to-transparent opacity-50" />
          <div className="absolute -bottom-20 right-1/4 h-[400px] w-[400px] rounded-full bg-gradient-to-tl from-[#D4FFE4] to-transparent opacity-40" />
        </div>

        <nav className="relative z-20 flex w-full shrink-0 items-center justify-between border-b border-black/[0.06] bg-[#F7F5F0]/85 px-4 py-2.5 backdrop-blur-sm sm:px-6 sm:py-3 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] shadow-lg shadow-blue-200">
              <svg width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden>
                <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" fill="white" />
                <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" fill="white" opacity="0.65" />
                <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" fill="white" opacity="0.65" />
                <rect x="9" y="9" width="5.5" height="5.5" rx="1.5" fill="white" />
              </svg>
            </div>
            <span className="truncate text-[15px] font-bold tracking-[-0.02em] text-[#0F0F1A]">WorkforceOS</span>
          </Link>

          <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] text-[11px] font-bold text-white shadow-md shadow-blue-200">
                {user.name
                  .split(" ")
                  .filter(Boolean)
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "?"}
              </span>
              <div className="min-w-0 text-right">
                <p className="truncate text-[13px] font-bold text-[#0F0F1A] sm:text-sm">{user.name}</p>
                <p className="hidden truncate text-[11px] font-medium text-[#6B6B80] sm:block">{user.email}</p>
              </div>
            </div>
            <LogoutControl variant="compact" />
          </div>
        </nav>

        <main className="relative z-10 flex-1 px-4 pb-12 pt-8 sm:px-6 sm:pt-10 lg:px-8">{children}</main>
      </div>
    );
  }

  const dashboardRole = toRole(me.role);
  const dashboardUser = {
    id: String(me.user.id),
    name: me.displayName.trim() || me.user.email.split("@")[0] || me.displayName,
    email: me.user.email,
    role: dashboardRole,
  };

  if (isSetup) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F0F1A]">
        <div className="fixed right-3 top-3 z-40 md:hidden">
          <LogoutControl variant="compact" />
        </div>
        <Sidebar role={dashboardRole} permissions={me.permissions} variant="hover" />
        <main className="min-h-screen pl-0 pt-12 md:pt-0 md:pl-16">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background md:flex">
      <Sidebar role={dashboardRole} permissions={me.permissions} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar userName={dashboardUser.name} role={dashboardRole} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
