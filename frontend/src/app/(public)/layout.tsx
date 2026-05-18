import { DM_Sans } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
});

/**
 * Marketing pages are full-bleed and include their own chrome (nav).
 * DM Sans matches the marketing design system.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className={dmSans.className}>{children}</div>;
}
