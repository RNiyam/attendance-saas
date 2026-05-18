import { apiBaseUrl } from "./http";

const TOKEN_KEY = "platformAdminToken";

export function getPlatformAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setPlatformAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearPlatformAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function platformAdminHeaders(): HeadersInit {
  const token = getPlatformAdminToken();
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (token) (h as Record<string, string>).Authorization = `Bearer ${token}`;
  return h;
}

export async function platformAdminFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { ...platformAdminHeaders(), ...(init?.headers ?? {}) },
  });
  if (res.status === 401 && typeof window !== "undefined") {
    clearPlatformAdminToken();
    window.location.href = "/super-admin/login";
  }
  return res;
}
