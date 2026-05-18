import nodemailer, { type Transporter } from "nodemailer";

export type SmtpConnectionFields = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
};

export function createTransportFromConfig(c: SmtpConnectionFields): Transporter {
  return nodemailer.createTransport({
    host: c.host,
    port: c.port,
    secure: c.secure,
    auth: {
      user: c.username,
      pass: c.password,
    },
  });
}

export function formatFromHeader(fromName: string, fromEmail: string): string {
  const name = fromName.trim();
  const email = fromEmail.trim();
  if (!name) return email;
  return `${name} <${email}>`;
}

export async function verifyTransport(transport: Transporter): Promise<void> {
  await transport.verify();
}
