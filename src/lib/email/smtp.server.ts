/**
 * SMTP configuration + transport factory (server-only).
 * Credentials come exclusively from environment variables and are never logged.
 */
import nodemailer, { type Transporter } from "nodemailer";

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  to: string;
};

export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env["SMTP_HOST"] ?? "smtp.gmail.com";
  const port = Number(process.env["SMTP_PORT"] ?? 465);
  const secure = (process.env["SMTP_SECURE"] ?? "true") !== "false";
  const user = process.env["SMTP_USER"] ?? "";
  const pass = process.env["SMTP_PASS"] ?? "";
  const to = process.env["ORDER_NOTIFY_TO"] || user || "fragavenuebd@gmail.com";

  if (!user || !pass) return null;

  return {
    host,
    port,
    secure,
    user,
    pass,
    from: process.env["SMTP_FROM"] ?? `Frag Avenue <${user}>`,
    to,
  };
}

let cached: Transporter | null = null;

export function getTransport(config: SmtpConfig): Transporter {
  if (cached) return cached;
  cached = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  });
  return cached;
}
