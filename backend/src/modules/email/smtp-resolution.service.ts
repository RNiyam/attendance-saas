import { and, eq } from "drizzle-orm";
import type { Transporter } from "nodemailer";
import { db } from "../../database";
import { smtpConfigurations } from "../../database/schema";
import { getEnv } from "../../config/env";
import { decryptSecret } from "../../utils/secret-crypto";
import { createTransportFromConfig, formatFromHeader } from "./smtp-transport.util";
import { getSmtpTransporter, smtpConfigured } from "./smtp.service";

export type ResolvedMailer = {
  transport: Transporter;
  from: string;
  source: "organization" | "platform";
};

/**
 * Picks organization SMTP when configured and active; otherwise platform .env SMTP.
 */
export async function resolveOutboundMailer(organizationId?: number | null): Promise<ResolvedMailer | null> {
  if (organizationId != null) {
    const [row] = await db
      .select()
      .from(smtpConfigurations)
      .where(and(eq(smtpConfigurations.organizationId, organizationId), eq(smtpConfigurations.isActive, true)))
      .limit(1);
    if (row) {
      try {
        const password = decryptSecret(row.passwordEncrypted);
        const transport = createTransportFromConfig({
          host: row.host,
          port: row.port,
          secure: row.secure,
          username: row.username,
          password,
        });
        return {
          transport,
          from: formatFromHeader(row.fromName, row.fromEmail),
          source: "organization",
        };
      } catch (e) {
        console.error("[email] Organization SMTP unavailable; falling back to platform SMTP:", e);
      }
    }
  }

  const from = getEnv().SMTP_FROM;
  if (!from || !smtpConfigured()) return null;
  return { transport: getSmtpTransporter(), from, source: "platform" };
}
