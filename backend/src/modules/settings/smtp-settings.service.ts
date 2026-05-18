import { eq } from "drizzle-orm";
import { db } from "../../database";
import { smtpConfigurations } from "../../database/schema";
import { getEnv } from "../../config/env";
import { encryptSecret, decryptSecret } from "../../utils/secret-crypto";
import { createTransportFromConfig, formatFromHeader, verifyTransport } from "../email/smtp-transport.util";

export type OrgSmtpUpsertInput = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  /** Omit or empty to keep existing encrypted password */
  password?: string;
  fromEmail: string;
  fromName: string;
  isActive?: boolean;
};

export type OrgSmtpPublic = {
  configured: boolean;
  host: string | null;
  port: number | null;
  secure: boolean | null;
  username: string | null;
  fromEmail: string | null;
  fromName: string | null;
  isActive: boolean | null;
  hasPassword: boolean;
};

function requireEncryptionKey(): void {
  const k = getEnv().SMTP_SECRETS_ENCRYPTION_KEY;
  if (!k || k.length < 16) {
    const err = new Error(
      "SMTP_SECRETS_ENCRYPTION_KEY must be set in the server environment (min 16 characters) before saving organization SMTP.",
    );
    (err as { status?: number }).status = 503;
    throw err;
  }
}

export async function getOrganizationSmtpPublic(organizationId: number): Promise<OrgSmtpPublic> {
  const [row] = await db
    .select()
    .from(smtpConfigurations)
    .where(eq(smtpConfigurations.organizationId, organizationId))
    .limit(1);
  if (!row) {
    return {
      configured: false,
      host: null,
      port: null,
      secure: null,
      username: null,
      fromEmail: null,
      fromName: null,
      isActive: null,
      hasPassword: false,
    };
  }
  return {
    configured: true,
    host: row.host,
    port: row.port,
    secure: row.secure,
    username: row.username,
    fromEmail: row.fromEmail,
    fromName: row.fromName,
    isActive: row.isActive,
    hasPassword: Boolean(row.passwordEncrypted?.length),
  };
}

export async function upsertOrganizationSmtp(organizationId: number, input: OrgSmtpUpsertInput): Promise<void> {
  requireEncryptionKey();
  const [existing] = await db
    .select()
    .from(smtpConfigurations)
    .where(eq(smtpConfigurations.organizationId, organizationId))
    .limit(1);

  const passwordEncrypted =
    input.password && input.password.length > 0
      ? encryptSecret(input.password)
      : existing?.passwordEncrypted;
  if (!passwordEncrypted) {
    const err = new Error("SMTP password is required when creating settings for the first time.");
    (err as { status?: number }).status = 400;
    throw err;
  }

  const isActive = input.isActive ?? existing?.isActive ?? true;
  const values = {
    organizationId,
    host: input.host.trim(),
    port: input.port,
    secure: input.secure,
    username: input.username.trim(),
    passwordEncrypted,
    fromEmail: input.fromEmail.trim().toLowerCase(),
    fromName: input.fromName.trim(),
    isActive,
  };

  if (existing) {
    await db
      .update(smtpConfigurations)
      .set({
        host: values.host,
        port: values.port,
        secure: values.secure,
        username: values.username,
        passwordEncrypted: values.passwordEncrypted,
        fromEmail: values.fromEmail,
        fromName: values.fromName,
        isActive: values.isActive,
      })
      .where(eq(smtpConfigurations.id, existing.id));
  } else {
    await db.insert(smtpConfigurations).values(values);
  }
}

export type InlineSmtpTestInput = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  testRecipientEmail?: string;
};

export async function testSmtpInline(input: InlineSmtpTestInput): Promise<{ ok: true; message: string }> {
  const transport = createTransportFromConfig({
    host: input.host.trim(),
    port: input.port,
    secure: input.secure,
    username: input.username.trim(),
    password: input.password,
  });
  await verifyTransport(transport);
  if (input.testRecipientEmail?.trim()) {
    const from = formatFromHeader(input.fromName, input.fromEmail);
    await transport.sendMail({
      from,
      to: input.testRecipientEmail.trim(),
      subject: "WorkforceOS — SMTP test",
      text: "This is a test message from your organization SMTP settings.",
    });
    return { ok: true, message: "SMTP verified and test email sent." };
  }
  return { ok: true, message: "SMTP connection verified successfully." };
}

export async function testSavedOrganizationSmtp(
  organizationId: number,
  testRecipientEmail?: string,
): Promise<{ ok: true; message: string }> {
  requireEncryptionKey();
  const [row] = await db
    .select()
    .from(smtpConfigurations)
    .where(eq(smtpConfigurations.organizationId, organizationId))
    .limit(1);
  if (!row) {
    const err = new Error("No SMTP settings saved for this organization.");
    (err as { status?: number }).status = 400;
    throw err;
  }
  const password = decryptSecret(row.passwordEncrypted);
  return testSmtpInline({
    host: row.host,
    port: row.port,
    secure: row.secure,
    username: row.username,
    password,
    fromEmail: row.fromEmail,
    fromName: row.fromName,
    testRecipientEmail,
  });
}

export async function patchOrganizationSmtpActive(organizationId: number, isActive: boolean): Promise<void> {
  const [existing] = await db
    .select()
    .from(smtpConfigurations)
    .where(eq(smtpConfigurations.organizationId, organizationId))
    .limit(1);
  if (!existing) {
    const err = new Error("No SMTP settings to update.");
    (err as { status?: number }).status = 404;
    throw err;
  }
  await db.update(smtpConfigurations).set({ isActive }).where(eq(smtpConfigurations.id, existing.id));
}
