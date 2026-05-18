import { NextResponse } from "next/server";

/**
 * Placeholder middleware for JWT route protection.
 * Later replace mock check with cookie access token verification.
 */
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding", "/onboarding/:path*"],
};
