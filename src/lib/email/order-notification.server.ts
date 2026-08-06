/**
 * Order notification sender (server-only).
 * Failures are logged and swallowed — order creation must never fail because of email.
 */
import { getSmtpConfig, getTransport } from "./smtp.server";
import {
  orderEmailSubject,
  renderOrderEmailHtml,
  renderOrderEmailText,
  type OrderEmailData,
} from "./order-template.server";

export type SendResult = { sent: boolean; reason?: string };

export async function sendOrderNotification(data: OrderEmailData): Promise<SendResult> {
  const config = getSmtpConfig();
  if (!config) {
    console.warn("[order-email] SMTP credentials not configured — skipping notification");
    return { sent: false, reason: "smtp_not_configured" };
  }

  try {
    const transport = getTransport(config);
    await transport.sendMail({
      from: config.from,
      to: config.to,
      replyTo: config.to,
      subject: orderEmailSubject(data.orderNumber),
      text: renderOrderEmailText(data),
      html: renderOrderEmailHtml(data),
    });
    console.log(`[order-email] notification sent for ${data.orderNumber}`);
    return { sent: true };
  } catch (error) {
    // Never log credentials — only the error message.
    console.error(
      `[order-email] failed for ${data.orderNumber}:`,
      error instanceof Error ? error.message : String(error),
    );
    return { sent: false, reason: "send_failed" };
  }
}
