import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProducts from "./tools/list-products";
import getProduct from "./tools/get-product";
import listMyOrders from "./tools/list-my-orders";
import listMyWishlist from "./tools/list-my-wishlist";

// The OAuth issuer MUST be the direct Supabase host — the runtime SUPABASE_URL
// is the .lovable.cloud proxy on published sites, which mcp-js rejects (RFC 8414
// issuer mismatch). VITE_SUPABASE_PROJECT_ID is inlined by Vite at build time.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "frag-avenue-mcp",
  title: "FRAG AVENUE",
  version: "0.1.0",
  instructions:
    "Tools for the FRAG AVENUE perfume storefront. Use list_products / get_product to browse the catalog, and list_my_orders / list_my_wishlist to read the signed-in user's data.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProducts, getProduct, listMyOrders, listMyWishlist],
});
