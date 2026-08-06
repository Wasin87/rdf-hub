import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  orderId: z.string().uuid(),
  origin: z.string().trim().max(200).optional(),
});

/**
 * Sends the "New Order Received" notification for an order the caller owns.
 * Always resolves — email problems never surface as order failures.
 */
export const notifyNewOrderFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    try {
      const { supabase, userId } = context;

      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", data.orderId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error || !order) return { sent: false, reason: "order_not_found" };
      if (order.status !== "pending") return { sent: false, reason: "not_pending" };

      const { data: items } = await supabase
        .from("order_items")
        .select("product_name, brand_name, size_label, size_ml, unit_price, quantity")
        .eq("order_id", order.id);

      const addr = (order.address_snapshot ?? {}) as Record<string, string | undefined>;
      const address = [addr["line1"], addr["line2"], addr["city"], addr["state"], addr["postal_code"], addr["country"]]
        .filter((p) => p && String(p).trim())
        .join(", ");

      const { sendOrderNotification } = await import("./order-notification.server");
      return await sendOrderNotification({
        orderNumber: order.order_number,
        createdAt: new Date(order.created_at).toLocaleString("en-US", { timeZone: "Asia/Dhaka" }) + " (Dhaka)",
        customerName: addr["full_name"] ?? "Customer",
        customerPhone: addr["phone"] ?? "—",
        address: address || "—",
        items: (items ?? []).map((i) => ({
          product_name: i.product_name,
          brand_name: i.brand_name,
          size_label: i.size_label,
          size_ml: i.size_ml,
          unit_price: Number(i.unit_price),
          quantity: Number(i.quantity),
        })),
        subtotal: Number(order.subtotal),
        shipping: Number(order.shipping),
        discount: Number(order.discount),
        total: Number(order.total),
        couponCode: order.coupon_code,
        paymentMethod: order.payment_method,
        txnId: order.txn_id,
        paymentPhone: order.payment_phone,
        status: order.status,
        notes: order.notes,
        adminOrderLink: data.origin ? `${data.origin}/admin/orders` : null,
      });
    } catch (error) {
      console.error(
        "[order-email] notification handler error:",
        error instanceof Error ? error.message : String(error),
      );
      return { sent: false, reason: "handler_error" };
    }
  });
