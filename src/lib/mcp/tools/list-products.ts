import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function anonClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_products",
  title: "List products",
  description:
    "Search or browse the FRAG AVENUE perfume catalog. Filter by search text, brand slug, category slug, or new/featured/discounted flags.",
  inputSchema: {
    search: z.string().trim().max(120).optional().describe("Optional search text matched against product name."),
    brand_slug: z.string().trim().max(80).optional(),
    category_slug: z.string().trim().max(80).optional(),
    is_new: z.boolean().optional(),
    is_featured: z.boolean().optional(),
    is_discounted: z.boolean().optional(),
    limit: z.number().int().min(1).max(50).optional().describe("Max products to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, brand_slug, category_slug, is_new, is_featured, is_discounted, limit }) => {
    const supabase = anonClient();
    let q = supabase
      .from("products")
      .select(
        "id, name, slug, base_price, discount_percent, is_new, is_featured, is_limited, brand:brands(name, slug), category:categories(name, slug)",
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (search) q = q.ilike("name", `%${search}%`);
    if (is_new) q = q.eq("is_new", true);
    if (is_featured) q = q.eq("is_featured", true);
    if (is_discounted) q = q.gt("discount_percent", 0);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    let rows = data ?? [];
    if (brand_slug) rows = rows.filter((r) => r.brand?.slug === brand_slug);
    if (category_slug) rows = rows.filter((r) => r.category?.slug === category_slug);
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { products: rows },
    };
  },
});
