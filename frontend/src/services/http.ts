export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5003";

export function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  return headers;
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
