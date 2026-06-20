import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Sparkles, ShieldCheck, Truck, Star, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  fetchProductBySlug,
  fetchRelatedProducts,
  fetchProductReviews,
  resolveImage,
  type Product,
} from "@/lib/catalog";
import { formatBDT, discountedPrice } from "@/lib/format";
import { useCart } from "@/stores/cart";
import { useWishlist } from "@/stores/wishlist";
import { ProductCard } from "@/components/ProductCard";
import { LuxuryLoader } from "@/components/Loader";

export const Route = createFileRoute("/products/$slug")({
  ssr: false,
  loader: async ({ params }) => {
    const product = await fetchProductBySlug(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.product.brand?.name ?? ""} ${loaderData.product.name} — RDF` : "Product — RDF" },
      { name: "description", content: loaderData?.product.description ?? "Luxury fragrance decant" },
      { property: "og:title", content: loaderData ? `${loaderData.product.name} — RDF` : "RDF" },
      { property: "og:image", content: loaderData ? resolveImage(loaderData.product.image_url) : undefined },
    ],
  }),
  component: ProductPage,
  pendingComponent: () => <LuxuryLoader label="Loading fragrance" />,
  errorComponent: ({ error }) => (
    <div className="container-luxury py-24 text-center">
      <h1 className="font-display text-3xl">Could not load this fragrance.</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error?.message}</p>
      <Link to="/shop" className="btn-liquid mt-6 inline-flex">Back to shop</Link>
    </div>
  ),
  notFoundComponent: () => (
    <div className="container-luxury py-24 text-center">
      <h1 className="font-display text-3xl">Fragrance not found.</h1>
      <Link to="/shop" className="btn-liquid mt-6 inline-flex">Back to shop</Link>
    </div>
  ),
});

function ProductPage() {
  const { product: initial } = Route.useLoaderData();
  const { slug } = Route.useParams();

  const { data: product = initial } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductBySlug(slug),
    initialData: initial,
  });

  const variants = useMemo(
    () => [...(product?.variants ?? [])].sort((a, b) => a.size_ml - b.size_ml),
    [product],
  );
  const [selectedId, setSelectedId] = useState(variants[2]?.id ?? variants[0]?.id);
  const [qty, setQty] = useState(1);

  const gallery = useMemo<string[]>(() => {
    if (!product) return [];
    const list: string[] = ((product.images ?? []) as Array<{ image_url: string; sort_order: number }>)
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => i.image_url);
    const primary = product.image_url ?? null;
    const merged = primary ? [primary, ...list.filter((u: string) => u !== primary)] : list;
    return merged.length > 0 ? merged : [product.image_url ?? ""];
  }, [product]);

  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const add = useCart((s) => s.add);
  const toggleWish = useWishlist((s) => s.toggle);
  const isWished = useWishlist((s) => (product ? s.has(product.id) : false));

  if (!product) return null;
  const v = variants.find((x) => x.id === selectedId) ?? variants[0];
  const finalPrice = v ? discountedPrice(v.price, product.discount_percent) : 0;

  const onAdd = () => {
    if (!v) return;
    add({
      productId: product.id,
      variantId: v.id,
      productSlug: product.slug,
      productName: product.name,
      brandName: product.brand?.name ?? "",
      sizeMl: v.size_ml,
      price: finalPrice,
      quantity: qty,
      imageUrl: resolveImage(gallery[0]),
    });
    toast.success("Added to cart", { description: `${product.name} • ${v.size_ml}ml × ${qty}` });
  };

  return (
    <div className="container-luxury py-10 lg:py-16">
      <nav className="mb-8 flex items-center gap-2 text-[11px] track-luxury text-muted-foreground">
        <Link to="/" className="hover:text-[color:var(--gold)]">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-[color:var(--gold)]">Shop</Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Gallery */}
        <div className="flex flex-col gap-3">
          <motion.button
            type="button"
            onClick={() => setLightbox(true)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative block overflow-hidden rounded-sm bg-secondary"
            aria-label="Open image"
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={gallery[active]}
                src={resolveImage(gallery[active])}
                alt={`${product.brand?.name ?? ""} ${product.name}`}
                className="aspect-[4/5] w-full object-cover"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              />
            </AnimatePresence>
            {product.discount_percent > 0 && (
              <span className="absolute left-4 top-4 rounded-sm bg-[color:var(--gold)] px-2 py-1 text-[10px] track-luxury text-[color:var(--gold-foreground)]">
                −{product.discount_percent}%
              </span>
            )}
            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setActive((i) => (i - 1 + gallery.length) % gallery.length); }}
                  className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/80 backdrop-blur hover:border-[color:var(--gold)]"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setActive((i) => (i + 1) % gallery.length); }}
                  className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/80 backdrop-blur hover:border-[color:var(--gold)]"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </motion.button>

          {gallery.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {gallery.map((url, i) => (
                <button
                  key={`${url}-${i}`}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`relative aspect-square overflow-hidden rounded-sm border bg-secondary transition-colors ${i === active ? "border-[color:var(--gold)]" : "border-border hover:border-foreground"}`}
                  aria-label={`Show image ${i + 1}`}
                >
                  <img src={resolveImage(url)} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="flex flex-col">
          <div className="text-[11px] track-luxury text-[color:var(--gold)]">{product.brand?.name}</div>
          <h1 className="mt-2 font-display text-4xl md:text-5xl">{product.name}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            {product.category && <span className="rounded-sm border border-[color:var(--gold)]/40 px-2 py-1 text-[10px] track-luxury text-[color:var(--gold)]">{product.category.name}</span>}
            {product.collection && <span className="rounded-sm border border-border px-2 py-1 text-[10px] track-luxury text-muted-foreground">{product.collection.name}</span>}
            {product.is_limited && <span className="rounded-sm bg-foreground px-2 py-1 text-[10px] track-luxury text-background">Limited</span>}
            {product.is_new && <span className="rounded-sm border border-foreground px-2 py-1 text-[10px] track-luxury">New</span>}
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-display text-4xl text-[color:var(--gold)]">{formatBDT(finalPrice)}</span>
            {product.discount_percent > 0 && v && (
              <span className="text-base text-muted-foreground line-through">{formatBDT(v.price)}</span>
            )}
            {v && <span className="text-xs text-muted-foreground">/ {v.size_ml}ml</span>}
          </div>

          <p className="mt-6 max-w-prose text-sm leading-relaxed text-muted-foreground">{product.description}</p>

          {(product.notes_top || product.notes_heart || product.notes_base) && (
            <div className="mt-6 grid gap-3 rounded-sm border border-border bg-section p-5 text-xs">
              {product.notes_top && <div><span className="track-luxury text-[color:var(--gold)]">Top </span><span className="text-foreground/85">{product.notes_top}</span></div>}
              {product.notes_heart && <div><span className="track-luxury text-[color:var(--gold)]">Heart </span><span className="text-foreground/85">{product.notes_heart}</span></div>}
              {product.notes_base && <div><span className="track-luxury text-[color:var(--gold)]">Base </span><span className="text-foreground/85">{product.notes_base}</span></div>}
            </div>
          )}

          <div className="mt-8">
            <div className="mb-3 text-[10px] track-luxury text-muted-foreground">Size</div>
            <div className="flex flex-wrap gap-2">
              {variants.map((vr) => {
                const isSel = selectedId === vr.id;
                const out = (vr.stock ?? 0) <= 0;
                return (
                  <button
                    key={vr.id}
                    onClick={() => !out && setSelectedId(vr.id)}
                    disabled={out}
                    className={`min-w-16 rounded-sm border px-4 py-3 text-center transition-all ${
                      isSel
                        ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10 text-[color:var(--gold)]"
                        : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                    } ${out ? "cursor-not-allowed opacity-40 line-through" : ""}`}
                  >
                    <div className="text-sm font-medium">{vr.size_ml} ML</div>
                    <div className="mt-0.5 text-[10px]">{formatBDT(discountedPrice(vr.price, product.discount_percent))}</div>
                  </button>
                );
              })}
            </div>
            {v && (
              <div className="mt-3 text-[11px] track-luxury text-muted-foreground">
                {v.stock > 0 ? <span className="text-[color:var(--gold)]">In stock · {v.stock} left</span> : <span className="text-destructive">Out of stock</span>}
              </div>
            )}
          </div>

          <div className="mt-7 flex items-center gap-3">
            <div className="flex items-center rounded-sm border border-border">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-11 w-11 hover:text-[color:var(--gold)]">−</button>
              <span className="w-10 text-center text-sm">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="h-11 w-11 hover:text-[color:var(--gold)]">+</button>
            </div>
            <button onClick={onAdd} disabled={!v || v.stock <= 0} className="btn-liquid flex-1 disabled:cursor-not-allowed disabled:opacity-50">
              <ShoppingBag className="h-3.5 w-3.5" /> <span className="sm:hidden">Cart</span><span className="hidden sm:inline">Add to Cart</span>
            </button>
            <button
              onClick={() =>
                toggleWish({
                  productId: product.id,
                  productSlug: product.slug,
                  productName: product.name,
                  brandName: product.brand?.name ?? "",
                  imageUrl: resolveImage(gallery[0]),
                  basePrice: product.base_price,
                  discountPercent: product.discount_percent,
                })
              }
              aria-label="Wishlist"
              className={`grid h-12 w-12 place-items-center rounded-sm border ${isWished ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10 text-[color:var(--gold)]" : "border-border hover:border-[color:var(--gold)]"}`}
            >
              <Heart className={`h-4 w-4 ${isWished ? "fill-current" : ""}`} />
            </button>
          </div>

          <div className="mt-9 grid grid-cols-3 gap-3 border-t border-border pt-7 text-[11px] text-muted-foreground">
            <div className="flex flex-col items-center gap-1.5 text-center"><ShieldCheck className="h-4 w-4 text-[color:var(--gold)]" /><span>100% Authentic</span></div>
            <div className="flex flex-col items-center gap-1.5 text-center"><Truck className="h-4 w-4 text-[color:var(--gold)]" /><span>Free over ৳5,000</span></div>
            <div className="flex flex-col items-center gap-1.5 text-center"><Sparkles className="h-4 w-4 text-[color:var(--gold)]" /><span>Decanted in-house</span></div>
          </div>
        </motion.div>
      </div>

      <ReviewsSection productId={product.id} />
      <RelatedSection product={product} />

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] grid place-items-center bg-background/95 p-4 backdrop-blur"
            onClick={() => setLightbox(false)}
          >
            <button onClick={() => setLightbox(false)} className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full border border-border bg-background/80" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
            <motion.img
              key={gallery[active]}
              src={resolveImage(gallery[active])}
              alt=""
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="max-h-[88vh] max-w-[88vw] rounded-sm object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {gallery.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setActive((i) => (i - 1 + gallery.length) % gallery.length); }} className="absolute left-6 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/80" aria-label="Previous"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); setActive((i) => (i + 1) % gallery.length); }} className="absolute right-6 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/80" aria-label="Next"><ChevronRight className="h-4 w-4" /></button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReviewsSection({ productId }: { productId: string }) {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: () => fetchProductReviews(productId),
  });

  const [zoom, setZoom] = useState<{ images: string[]; idx: number } | null>(null);

  const avg = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  }, [reviews]);

  const maskEmail = (email?: string | null) => {
    if (!email) return "";
    const [u, d] = email.split("@");
    if (!d) return email;
    const masked = u.length <= 2 ? u[0] + "*" : u.slice(0, 2) + "***";
    return `${masked}@${d}`;
  };

  return (
    <section className="mt-20 border-t border-border pt-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] track-luxury text-[color:var(--gold)]">Reviews</p>
          <h2 className="mt-1 font-display text-3xl">Customer Reviews</h2>
        </div>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <Stars value={avg} />
            <span className="text-sm text-muted-foreground">{avg.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
          </div>
        )}
      </div>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No reviews yet. Purchase &amp; receive this fragrance to share your experience.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((r) => (
            <article key={r.id} className="rounded-sm border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-medium">{r.author_name}</div>
                  {r.email && <div className="truncate text-[10px] text-muted-foreground">{maskEmail(r.email)}</div>}
                  {r.created_at && <div className="text-[10px] track-luxury text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</div>}
                </div>
                <Stars value={r.rating} />
              </div>
              {r.title && <h3 className="mt-3 font-display text-lg">{r.title}</h3>}
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
              {Array.isArray(r.images) && r.images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.images.map((url, i) => (
                    <button key={i} type="button" onClick={() => setZoom({ images: r.images!, idx: i })} className="h-16 w-16 overflow-hidden rounded-sm border border-border hover:border-[color:var(--gold)]">
                      <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <AnimatePresence>
        {zoom && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] grid place-items-center bg-background/95 p-4 backdrop-blur" onClick={() => setZoom(null)}>
            <button onClick={() => setZoom(null)} className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full border border-border bg-background/80" aria-label="Close"><X className="h-4 w-4" /></button>
            <motion.img key={zoom.images[zoom.idx]} src={zoom.images[zoom.idx]} initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} alt="" className="max-h-[88vh] max-w-[88vw] rounded-sm object-contain" onClick={(e) => e.stopPropagation()} />
            {zoom.images.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setZoom({ ...zoom, idx: (zoom.idx - 1 + zoom.images.length) % zoom.images.length }); }} className="absolute left-6 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/80" aria-label="Previous"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); setZoom({ ...zoom, idx: (zoom.idx + 1) % zoom.images.length }); }} className="absolute right-6 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/80" aria-label="Next"><ChevronRight className="h-4 w-4" /></button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-3.5 w-3.5 ${n <= Math.round(value) ? "fill-[color:var(--gold)] text-[color:var(--gold)]" : "text-muted-foreground"}`} />
      ))}
    </div>
  );
}

function RelatedSection({ product }: { product: Product }) {
  const { data: related = [] } = useQuery({
    queryKey: ["related-products", product.id],
    queryFn: () => fetchRelatedProducts(product.id, product.brand?.id ?? null, product.category?.id ?? null, 8),
  });

  const trackRef = useRef<HTMLDivElement>(null);
  if (!related.length) return null;

  return (
    <section className="mt-20">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-[11px] track-luxury text-[color:var(--gold)]">You may also love</p>
          <h2 className="mt-1 font-display text-3xl">Related Fragrances</h2>
        </div>
        <div className="hidden gap-2 md:flex">
          <button onClick={() => trackRef.current?.scrollBy({ left: -360, behavior: "smooth" })} className="grid h-10 w-10 place-items-center rounded-full border border-border hover:border-[color:var(--gold)]" aria-label="Scroll left">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => trackRef.current?.scrollBy({ left: 360, behavior: "smooth" })} className="grid h-10 w-10 place-items-center rounded-full border border-border hover:border-[color:var(--gold)]" aria-label="Scroll right">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div ref={trackRef} className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {related.map((p) => (
          <div key={p.id} className="w-[260px] flex-none snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
