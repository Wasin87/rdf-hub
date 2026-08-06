/**
 * Order notification email template (server-only, no UI impact).
 */

export type OrderEmailItem = {
  product_name: string;
  brand_name: string | null;
  size_label: string | null;
  size_ml: number | null;
  unit_price: number;
  quantity: number;
};

export type OrderEmailData = {
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: OrderEmailItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  couponCode?: string | null;
  paymentMethod: string;
  txnId?: string | null;
  paymentPhone?: string | null;
  status: string;
  notes?: string | null;
  adminOrderLink?: string | null;
};

const GOLD = "#b8912f";
const INK = "#14110f";

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function bdt(n: number): string {
  return `৳ ${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function orderEmailSubject(orderNumber: string): string {
  return `New Order Received - ${orderNumber}`;
}

export function renderOrderEmailText(d: OrderEmailData): string {
  const lines = d.items.map(
    (i) =>
      `- ${i.product_name} (${i.size_label || `${i.size_ml ?? ""}ml`}) x${i.quantity} = ${bdt(i.unit_price * i.quantity)}`,
  );
  return [
    `New order ${d.orderNumber}`,
    `Date: ${d.createdAt}`,
    `Customer: ${d.customerName} / ${d.customerPhone}`,
    `Address: ${d.address}`,
    "",
    ...lines,
    "",
    `Subtotal: ${bdt(d.subtotal)}`,
    `Discount: ${bdt(d.discount)}`,
    `Shipping: ${bdt(d.shipping)}`,
    `Total: ${bdt(d.total)}`,
    `Payment: ${d.paymentMethod}`,
    `Status: ${d.status}`,
    d.adminOrderLink ? `Admin: ${d.adminOrderLink}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function renderOrderEmailHtml(d: OrderEmailData): string {
  const rows = d.items
    .map(
      (i) => `
      <tr>
        <td style="padding:12px 10px;border-bottom:1px solid #eee;font-size:14px;color:${INK};">
          <strong>${esc(i.product_name)}</strong>
          ${i.brand_name ? `<div style="font-size:12px;color:#777;">${esc(i.brand_name)}</div>` : ""}
        </td>
        <td style="padding:12px 10px;border-bottom:1px solid #eee;font-size:13px;color:#444;">${esc(i.size_label || (i.size_ml ? `${i.size_ml} ML` : "—"))}</td>
        <td align="center" style="padding:12px 10px;border-bottom:1px solid #eee;font-size:13px;color:#444;">${esc(i.quantity)}</td>
        <td align="right" style="padding:12px 10px;border-bottom:1px solid #eee;font-size:13px;color:#444;">${bdt(i.unit_price)}</td>
        <td align="right" style="padding:12px 10px;border-bottom:1px solid #eee;font-size:14px;color:${INK};font-weight:600;">${bdt(i.unit_price * i.quantity)}</td>
      </tr>`,
    )
    .join("");

  const totalRow = (label: string, value: string, strong = false) => `
    <tr>
      <td style="padding:6px 0;font-size:${strong ? "16px" : "13px"};color:${strong ? INK : "#666"};">${esc(label)}</td>
      <td align="right" style="padding:6px 0;font-size:${strong ? "18px" : "13px"};font-weight:${strong ? 700 : 500};color:${strong ? GOLD : INK};">${value}</td>
    </tr>`;

  return `<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(orderEmailSubject(d.orderNumber))}</title></head>
<body style="margin:0;padding:0;background:#f6f5f2;font-family:Inter,Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f5f2;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e8e4db;border-radius:6px;overflow:hidden;">
        <tr>
          <td style="background:${INK};padding:22px 24px;">
            <div style="color:${GOLD};font-size:20px;letter-spacing:3px;font-weight:700;">FRAG AVENUE</div>
            <div style="color:#d8d3c8;font-size:12px;letter-spacing:1px;margin-top:4px;">NEW ORDER NOTIFICATION</div>
          </td>
        </tr>
        <tr>
          <td style="padding:22px 24px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="display:inline-block;background:${GOLD};color:#fff;font-weight:700;font-size:15px;letter-spacing:1px;padding:8px 14px;border-radius:4px;">${esc(d.orderNumber)}</div>
                </td>
                <td align="right">
                  <div style="display:inline-block;background:#fff4d6;color:#8a6a00;font-weight:700;font-size:12px;letter-spacing:1px;padding:7px 12px;border-radius:999px;text-transform:uppercase;">${esc(d.status)}</div>
                </td>
              </tr>
            </table>
            <div style="margin-top:8px;font-size:12px;color:#888;">${esc(d.createdAt)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px;">
            <div style="font-size:12px;letter-spacing:2px;color:#999;text-transform:uppercase;margin-bottom:8px;">Customer</div>
            <div style="font-size:15px;color:${INK};font-weight:600;">${esc(d.customerName)}</div>
            <div style="font-size:14px;color:#444;">${esc(d.customerPhone)}</div>
            <div style="font-size:14px;color:#444;margin-top:6px;line-height:1.5;">${esc(d.address)}</div>
            ${d.notes ? `<div style="margin-top:8px;font-size:13px;color:#666;"><em>Notes: ${esc(d.notes)}</em></div>` : ""}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 24px 0;">
            <div style="font-size:12px;letter-spacing:2px;color:#999;text-transform:uppercase;margin-bottom:8px;">Products</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <thead>
                <tr style="background:#faf8f4;">
                  <th align="left" style="padding:10px;font-size:11px;letter-spacing:1px;color:#888;text-transform:uppercase;">Item</th>
                  <th align="left" style="padding:10px;font-size:11px;letter-spacing:1px;color:#888;text-transform:uppercase;">Variant</th>
                  <th align="center" style="padding:10px;font-size:11px;letter-spacing:1px;color:#888;text-transform:uppercase;">Qty</th>
                  <th align="right" style="padding:10px;font-size:11px;letter-spacing:1px;color:#888;text-transform:uppercase;">Price</th>
                  <th align="right" style="padding:10px;font-size:11px;letter-spacing:1px;color:#888;text-transform:uppercase;">Total</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${totalRow("Subtotal", bdt(d.subtotal))}
              ${d.discount > 0 ? totalRow(`Discount${d.couponCode ? ` (${d.couponCode})` : ""}`, `− ${bdt(d.discount)}`) : ""}
              ${totalRow("Shipping", d.shipping === 0 ? "Free" : bdt(d.shipping))}
              <tr><td colspan="2" style="border-top:1px solid #eee;height:8px;"></td></tr>
              ${totalRow("Total", bdt(d.total), true)}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 24px 20px;">
            <div style="background:#faf8f4;border:1px solid #eee7d9;border-radius:4px;padding:14px;">
              <div style="font-size:12px;letter-spacing:2px;color:#999;text-transform:uppercase;margin-bottom:6px;">Payment</div>
              <div style="font-size:14px;color:${INK};font-weight:600;text-transform:uppercase;">${esc(d.paymentMethod)}</div>
              ${d.txnId ? `<div style="font-size:13px;color:#444;margin-top:4px;">Txn ID: ${esc(d.txnId)}</div>` : ""}
              ${d.paymentPhone ? `<div style="font-size:13px;color:#444;">Paid from: ${esc(d.paymentPhone)}</div>` : ""}
            </div>
          </td>
        </tr>
        ${
          d.adminOrderLink
            ? `<tr><td align="center" style="padding:0 24px 26px;">
                <a href="${esc(d.adminOrderLink)}" style="display:inline-block;background:${INK};color:${GOLD};text-decoration:none;font-size:13px;letter-spacing:2px;padding:13px 26px;border-radius:4px;">VIEW ORDER IN ADMIN</a>
              </td></tr>`
            : ""
        }
        <tr><td style="background:#faf8f4;padding:16px 24px;text-align:center;font-size:11px;color:#999;">Frag Avenue · Automated order notification</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
