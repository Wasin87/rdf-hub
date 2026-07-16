import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  code: z.string().trim().min(1).max(64),
  subtotal: z.number().nonnegative().max(10_000_000),
});

export const validateCouponFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc("validate_coupon", {
      _code: data.code,
      _subtotal: data.subtotal,
    });
    if (error) throw new Error(error.message || "Invalid coupon");
    const row = (Array.isArray(rows) ? rows[0] : rows) as
      | { code: string; discount: number | string }
      | null;
    if (!row) throw new Error("Coupon could not be applied");
    return { code: row.code, discount: Number(row.discount) };
  });
