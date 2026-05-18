import { renderTemplate } from "./template.service";
import { resolveOutboundMailer } from "./smtp-resolution.service";
import type {
  EmployeeInviteEmailParams,
  PasswordResetEmailParams,
  SendEmailInput,
  SendEmailResult,
  WelcomeEmailParams,
} from "./types";

/**
 * Business-facing email API. Resolves organization vs platform SMTP automatically.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const mailer = await resolveOutboundMailer(input.organizationId);
  if (!mailer) {
    const msg =
      "[email] No SMTP available (configure platform SMTP_* env or active organization SMTP). Skipping send.";
    console.warn(msg, { to: input.to, subject: input.subject, organizationId: input.organizationId });
    return { messageId: undefined, accepted: [], rejected: Array.isArray(input.to) ? input.to : [input.to] };
  }
  try {
    const info = await mailer.transport.sendMail({
      from: mailer.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    });
    console.info("[email] Sent", {
      messageId: info.messageId,
      to: input.to,
      subject: input.subject,
      via: mailer.source,
    });
    return {
      messageId: info.messageId,
      accepted: (info.accepted as string[]) ?? [],
      rejected: (info.rejected as string[]) ?? [],
    };
  } catch (err) {
    console.error("[email] sendMail failed:", err);
    throw err;
  }
}

export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<SendEmailResult> {
  const html = await renderTemplate("welcome", {
    userName: params.userName,
    organizationName: params.organizationName,
    loginUrl: params.loginUrl,
    temporaryPassword: params.temporaryPassword,
    temporaryPasswordExpiresInHours: params.temporaryPasswordExpiresInHours,
  });
  return sendEmail({
    organizationId: params.organizationId,
    to: params.to,
    subject: `Set up your ${params.organizationName} HRMS account`,
    html,
    text: params.temporaryPassword
      ? `Hi ${params.userName}, your company workspace for ${params.organizationName} is ready. Temporary password: ${params.temporaryPassword}. It expires in ${params.temporaryPasswordExpiresInHours ?? 24} hours. Complete setup: ${params.loginUrl}`
      : `Hi ${params.userName}, your company workspace for ${params.organizationName} is ready. Sign in: ${params.loginUrl}`,
  });
}

export async function sendEmployeeInviteEmail(
  params: EmployeeInviteEmailParams,
): Promise<SendEmailResult> {
  const html = await renderTemplate("invite", {
    employeeName: params.employeeName,
    organizationName: params.organizationName,
    inviteUrl: params.inviteUrl,
    invitedByName: params.invitedByName,
  });
  return sendEmail({
    organizationId: params.organizationId,
    to: params.to,
    subject: `You have been invited to ${params.organizationName} HRMS`,
    html,
    text: `Hi ${params.employeeName}, ${params.invitedByName} invited you to join ${params.organizationName} on the HRMS platform. Open: ${params.inviteUrl}`,
  });
}

export async function sendPasswordResetEmail(
  params: PasswordResetEmailParams,
): Promise<SendEmailResult> {
  const html = await renderTemplate("reset-password", {
    userName: params.userName,
    resetUrl: params.resetUrl,
    expiresInMinutes: params.expiresInMinutes,
  });
  return sendEmail({
    organizationId: params.organizationId,
    to: params.to,
    subject: "Reset your password",
    html,
    text: `Hi ${params.userName}, reset your password (link expires in ${params.expiresInMinutes} minutes): ${params.resetUrl}`,
  });
}
