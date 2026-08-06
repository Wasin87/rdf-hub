import { supabase } from "@/integrations/supabase/client";

export type Variant = {
  id: string;
  product_id: string;
  size_ml: number;
  size_label: string | null;
  price: number;
  stock: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  notes_top: string | null;
  notes_heart: string | null;
  notes_base: string | null;
  image_url: string | null;
  base_price: number;
  discount_percent: number;
  is_new: boolean;
  is_featured: boolean;
  is_limited: boolean;
  is_hot: boolean;
  hot_until: string | null;
  view_count: number;
  created_at: string;
  brand: { id: string; name: string; slug: string } | null;
  category: { id: string; name: string; slug: string } | null;
  collection: { id: string; name: string; slug: string } | null;
  variants: Variant[];
  images?: ProductImage[];
};

export type ProductImage = { id: string; image_url: string; alt_text: string | null; sort_order: number };
export type Brand = { id: string; name: string; slug: string; description: string | null };
export type Category = { id: string; name: string; slug: string };
export type Collection = { id: string; name: string; slug: string; description: string | null };
export type Banner = { id: string; title: string; subtitle: string | null; image_url: string; cta_text: string | null; cta_link: string | null };
export type Review = { id: string; author_name: string; email?: string | null; rating: number; title: string | null; body: string; images?: string[]; created_at?: string };

export const IMAGE_BUCKETS = {
  products: "product-images",
  reviews: "review-images",
  avatars: "avatars",
} as const;

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export function isAcceptedImage(file: File) {
  return ACCEPTED_IMAGE_TYPES.includes(file.type.toLowerCase());
}

export function appStorageImageUrl(bucket: string, path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export function getStoragePathFromAppUrl(url: string) {
  try {
    const parsed = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    // Legacy proxy URLs: /api/public/image?bucket=...&path=...
    if (parsed.pathname === "/api/public/image") {
      const bucket = parsed.searchParams.get("bucket");
      const path = parsed.searchParams.get("path");
      return bucket && path ? { bucket, path } : null;
    }
    // Native Supabase public URLs: .../storage/v1/object/public/<bucket>/<path>
    const marker = "/storage/v1/object/public/";
    const idx = parsed.pathname.indexOf(marker);
    if (idx !== -1) {
      const rest = parsed.pathname.slice(idx + marker.length);
      const slash = rest.indexOf("/");
      if (slash > 0) {
        return { bucket: decodeURIComponent(rest.slice(0, slash)), path: decodeURIComponent(rest.slice(slash + 1)) };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function normalizeStorageImageUrl(url: string) {
  const trimmed = url.trim();
  const parts = getStoragePathFromAppUrl(trimmed);
  if (parts) return appStorageImageUrl(parts.bucket, parts.path);
  return trimmed;
}

export function validateImageUrl(url: string) {
  return new Promise<void>((resolve, reject) => {
    if (!url.trim()) {
      reject(new Error("Image URL is required"));
      return;
    }
    const img = new Image();
    const timeout = window.setTimeout(() => {
      img.onload = null;
      img.onerror = null;
      reject(new Error("Image did not load in time"));
    }, 12000);
    img.onload = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    img.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("Image is not accessible"));
    };
    img.src = normalizeStorageImageUrl(url);
  });
}

const PRODUCT_SELECT = `
  id, name, slug, description, notes_top, notes_heart, notes_base, image_url,
  base_price, discount_percent, is_new, is_featured, is_limited, is_hot, hot_until, view_count, created_at,
  brand:brands(id, name, slug),
  category:categories(id, name, slug),
  collection:collections(id, name, slug),
  variants:product_variants(id, product_id, size_ml, size_label, price, stock),
  images:product_images(id, image_url, alt_text, sort_order)
`;

export async function fetchProducts(opts?: {
  brandSlug?: string;
  categorySlug?: string;
  collectionSlug?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  isDiscounted?: boolean;
  isLimited?: boolean;
  isHot?: boolean;
  search?: string;
  sort?: "latest" | "popular" | "price_asc" | "price_desc";
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}): Promise<{ data: Product[]; count: number }> {
  let q = supabase.from("products").select(PRODUCT_SELECT, { count: "exact" }).eq("is_active", true);

  if (opts?.isNew) q = q.eq("is_new", true);
  if (opts?.isFeatured) q = q.eq("is_featured", true);
  if (opts?.isLimited) q = q.eq("is_limited", true);
  if (opts?.isHot) q = q.eq("is_hot", true);
  if (opts?.isDiscounted) q = q.gt("discount_percent", 0);
  if (opts?.minPrice != null) q = q.gte("base_price", opts.minPrice);
  if (opts?.maxPrice != null) q = q.lte("base_price", opts.maxPrice);
  if (opts?.search) q = q.ilike("name", `%${opts.search}%`);

  switch (opts?.sort) {
    case "popular": q = q.order("view_count", { ascending: false }); break;
    case "price_asc": q = q.order("base_price", { ascending: true }); break;
    case "price_desc": q = q.order("base_price", { ascending: false }); break;
    default: q = q.order("created_at", { ascending: false });
  }

  if (opts?.limit) q = q.range(opts.offset ?? 0, (opts.offset ?? 0) + opts.limit - 1);

  const { data, error, count } = await q;
  if (error) throw error;
  let products = (data ?? []) as unknown as Product[];

  if (opts?.brandSlug) products = products.filter((p) => p.brand?.slug === opts.brandSlug);
  if (opts?.categorySlug) products = products.filter((p) => p.category?.slug === opts.categorySlug);
  if (opts?.collectionSlug) products = products.filter((p) => p.collection?.slug === opts.collectionSlug);

  return { data: products, count: count ?? products.length };
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase.from("products").select(PRODUCT_SELECT).eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data as unknown as Product | null;
}

export async function fetchRelatedProducts(productId: string, brandId: string | null, categoryId: string | null, limit = 8): Promise<Product[]> {
  let q = supabase.from("products").select(PRODUCT_SELECT).eq("is_active", true).neq("id", productId).limit(limit);
  if (brandId) q = q.eq("brand_id", brandId);
  else if (categoryId) q = q.eq("category_id", categoryId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

export async function fetchProductReviews(productId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews_public")
    .select("id, author_name, rating, title, body, images, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({ ...r, images: Array.isArray((r as { images?: unknown }).images) ? ((r as { images: string[] }).images) : [] })) as unknown as Review[];
}

export type OwnReview = { id: string; rating: number; title: string | null; body: string; images: string[]; is_approved: boolean; created_at: string };
export async function fetchMyReviewForProduct(productId: string, userId: string): Promise<OwnReview | null> {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, title, body, images, is_approved, created_at")
    .eq("product_id", productId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { ...data, images: Array.isArray(data.images) ? (data.images as string[]) : [] } as OwnReview;
}

export async function fetchBrands(): Promise<Brand[]> {
  const { data, error } = await supabase.from("brands").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("id, name, slug").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchCollections(): Promise<Collection[]> {
  const { data, error } = await supabase.from("collections").select("id, name, slug, description").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchBanners(): Promise<Banner[]> {
  const { data, error } = await supabase.from("banners").select("id, title, subtitle, image_url, cta_text, cta_link").eq("is_active", true).order("order_index");
  if (error) throw error;
  return data ?? [];
}

export async function fetchFeaturedReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews_public")
    .select("id, author_name, rating, title, body, created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []) as unknown as Review[];
}


// Resolve asset paths used in seed data to actual bundled URLs
import perfume1 from "@/assets/perfume-1.jpg";
import perfume2 from "@/assets/perfume-2.jpg";
import perfume3 from "@/assets/perfume-3.jpg";
import perfume4 from "@/assets/perfume-4.jpg";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";

const ASSET_MAP: Record<string, string> = {
  "/src/assets/perfume-1.jpg": perfume1,
  "/src/assets/perfume-2.jpg": perfume2,
  "/src/assets/perfume-3.jpg": perfume3,
  "/src/assets/perfume-4.jpg": perfume4,
  "/src/assets/hero-1.jpg": hero1,
  "/src/assets/hero-2.jpg": hero2,
  "/src/assets/hero-3.jpg": hero3,
};

// Legacy Vite-hashed asset URLs (e.g. "/assets/perfume-1-B7GN7VfJ.jpg") persisted
// in old order_items rows point to stale build hashes and 404. Map by base name
// back to the currently bundled asset so historical orders still render.
const LEGACY_ASSET_MAP: Record<string, string> = {
  "perfume-1": perfume1,
  "perfume-2": perfume2,
  "perfume-3": perfume3,
  "perfume-4": perfume4,
  "hero-1": hero1,
  "hero-2": hero2,
  "hero-3": hero3,
};

function resolveLegacyBundledAsset(url: string): string | null {
  const m = url.match(/^\/assets\/(perfume-\d+|hero-\d+)(?:-[A-Za-z0-9_-]+)?\.(?:jpe?g|png|webp)$/i);
  if (!m) return null;
  return LEGACY_ASSET_MAP[m[1].toLowerCase()] ?? null;
}

export function resolveImage(url: string | null | undefined): string {
  if (!url) return perfume1;
  if (ASSET_MAP[url]) return ASSET_MAP[url];
  const legacy = resolveLegacyBundledAsset(url);
  if (legacy) return legacy;
  return normalizeStorageImageUrl(url);
}

