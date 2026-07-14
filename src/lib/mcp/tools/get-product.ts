import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export default defineTool({
  name: "get_product",
  title: "Get product details",
  description:
    "Fetch full details for a single perfume by its slug: description, notes, variants (size/price/stock), brand, and category.",
  inputSchema: {
    slug: z.string().trim().min(1).max(120).describe("The product slug, e.g. \"fakhar\"."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }) => {
    const supabase = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("products")
      .select(
        `id, name, slug, description, notes_top, notes_heart, notes_base,
         base_price, discount_percent, is_new, is_featured, is_limited,
         brand:brands(name, slug), category:categories(name, slug),
         variants:product_variants(id, size_ml, price, stock)`,
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: `No product found for slug "${slug}".` }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { product: data },
    };
  },
});
