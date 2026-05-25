"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/services/http";

type LogoutControlProps = {
  /** compact = top nav / mobile; sidebar = full-width sidebar footer */
  variant?: "compact" | "sidebar" | "sidebar-hover";
  className?: string;
};

export function LogoutControl({ variant = "compact", className }: LogoutControlProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  const label = loggingOut ? "Signing out…" : variant === "compact" ? "Log out" : "Log out";

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-[#E8E5F0] bg-white px-3 py-1.5 text-[12px] font-bold text-[#6B6B80] transition hover:border-[#4F7FFF] hover:text-[#4F7FFF] disabled:opacity-60",
          className,
        )}
      >
        <LogOut className="h-3.5 w-3.5 shrink-0" />
        {label}
      </button>
    );
  }

  const base =
    variant === "sidebar-hover"
      ? "flex h-10 w-full items-center gap-3 overflow-hidden rounded-lg px-2.5 text-sm font-semibold text-[#6B7280] transition hover:bg-[#F7F8FC] hover:text-[#0F0F1A] disabled:opacity-60"
      : "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-60";

  return (
    <button type="button" onClick={handleLogout} disabled={loggingOut} className={cn(base, className)}>
      <LogOut className={cn("shrink-0", variant === "sidebar-hover" ? "h-5 w-5" : "h-4 w-4")} />
      <span
        className={cn(
          variant === "sidebar-hover" &&
            "whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover:opacity-100",
        )}
      >
        {label}
      </span>
    </button>
  );
}
