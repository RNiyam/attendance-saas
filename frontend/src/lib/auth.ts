import type { UserRole } from "@/types/rbac";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

/**
 * Server components do not have the browser access token. The shell loads `/api/auth/me` on the client.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  return null;
}
