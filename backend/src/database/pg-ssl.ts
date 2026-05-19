import type { ConnectionOptions } from "tls";

/** Supabase (and similar hosts) need TLS; Node may reject their cert chain without this. */
export function pgSslOption(databaseUrl: string): ConnectionOptions | undefined {
  if (!/supabase\.co/i.test(databaseUrl)) return undefined;
  return { rejectUnauthorized: false };
}
