const DEFAULT_API_PORT = process.env.NEXT_PUBLIC_API_PORT ?? "5003";

/**
 * Resolves API base URL for localhost vs phone/other device on same Wi‑Fi.
 * - Set NEXT_PUBLIC_API_URL in frontend/.env.local to override everything.
 * - If you open the app as http://192.168.x.x:3000, API calls use http://192.168.x.x:PORT automatically.
 */
function resolveApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;
    if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `${protocol}//${hostname}:${DEFAULT_API_PORT}`;
    }
  }

  return `http://localhost:${DEFAULT_API_PORT}`;
}

export const apiBaseUrl = resolveApiBaseUrl();

export function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  return headers;
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("organizationCode");
}

/** Revokes refresh session on the server and clears local auth tokens. */
export async function logout(): Promise<void> {
  if (typeof window === "undefined") return;

  const refreshToken = localStorage.getItem("refreshToken");
  if (refreshToken) {
    await fetch(`${apiBaseUrl}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined);
  }
  clearAuthSession();
}

async function refreshAccessToken() {
  if (typeof window === "undefined") return false;

  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return false;

  const res = await fetch(`${apiBaseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || typeof body.accessToken !== "string" || typeof body.refreshToken !== "string") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    return false;
  }

  localStorage.setItem("accessToken", body.accessToken);
  localStorage.setItem("refreshToken", body.refreshToken);
  return true;
}

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const withAuth = (headers?: HeadersInit): HeadersInit => ({
    ...authHeaders(),
    ...(headers ?? {}),
  });

  let res = await fetch(input, {
    ...init,
    headers: withAuth(init.headers),
  });
  if (res.status !== 401) return res;

  const refreshed = await refreshAccessToken();
  if (!refreshed) return res;

  res = await fetch(input, {
    ...init,
    headers: withAuth(init.headers),
  });
  return res;
}
