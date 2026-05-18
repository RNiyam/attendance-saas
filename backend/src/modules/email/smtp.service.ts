import nodemailer, { type Transporter } from "nodemailer";
import { getEnv } from "../../config/env";

let transporter: Transporter | null = null;

function isSmtpConfigured(): boolean {
  const e = getEnv();
  return Boolean(e.SMTP_HOST && e.SMTP_PORT && e.SMTP_USER && e.SMTP_PASS && e.SMTP_FROM);
}

/**
 * Low-level Nodemailer transport. Callers use email.service for business emails.
 */
export function getSmtpTransporter(): Transporter {
  if (!isSmtpConfigured()) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.",
    );
  }
  if (transporter) return transporter;
  const e = getEnv();
  transporter = nodemailer.createTransport({
    host: e.SMTP_HOST!,
    port: e.SMTP_PORT!,
    secure: e.SMTP_PORT === 465,
    auth: {
      user: e.SMTP_USER!,
      pass: e.SMTP_PASS!,
    },
  });
  return transporter;
}

/**
 * Verifies SMTP credentials at startup (optional). Logs and rethrows on failure.
 */
export async function verifySmtpConnection(): Promise<boolean> {
  if (!isSmtpConfigured()) {
    console.warn("[smtp] Skipping verify: SMTP env vars not fully set");
    return false;
  }
  try {
    await getSmtpTransporter().verify();
    console.info("[smtp] Transporter verified successfully");
    return true;
  } catch (err) {
    console.error("[smtp] Transporter verification failed:", err);
    throw err;
  }
}

export function smtpConfigured(): boolean {
  return isSmtpConfigured();
}
