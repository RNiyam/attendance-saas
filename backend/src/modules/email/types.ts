/**
 * Types for the email layer. Keeps Nodemailer details out of business callers.
 */
export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  /** When set, uses active organization SMTP if configured; else platform SMTP from .env */
  organizationId?: number;
};

export type SendEmailResult = {
  messageId: string | undefined;
  accepted: string[];
  rejected: string[];
};

export type WelcomeEmailParams = {
  organizationId?: number;
  to: string;
  userName: string;
  organizationName: string;
  loginUrl: string;
  temporaryPassword?: string;
  temporaryPasswordExpiresInHours?: number;
};

export type EmployeeInviteEmailParams = {
  organizationId?: number;
  to: string;
  employeeName: string;
  organizationName: string;
  inviteUrl: string;
  invitedByName: string;
};

export type PasswordResetEmailParams = {
  organizationId?: number;
  to: string;
  userName: string;
  resetUrl: string;
  expiresInMinutes: number;
};

export type OnboardingRoleWelcomeEmailParams = {
  organizationId?: number;
  to: string;
  userName: string;
  organizationName: string;
  role: string;
  loginUrl: string;
};
