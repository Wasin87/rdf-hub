import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Sparkles, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { fetchProductBySlug, resolveImage } from "@/lib/catalog";
import { formatBDT, discountedPrice } from "@/lib/format";
import { useCart } from "@/stores/cart";
import { useWishlist } from "@/stores/wishlist";

export const Route = createFileRoute("/products/$slug")({
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
  errorComponent: () => <div className="container-luxury py-24 text-center"><h1 className="font-display text-3xl">Could not load this fragrance.</h1></div>,
  notFoundComponent: () => <div className="container-luxury py-24 text-center"><h1 className="font-display text-3xl">Fragrance not found.</h1><Link to="/shop" className="btn-liquid mt-6 inline-flex">Back to shop</Link></div>,
});

function ProductPage() {
  const { product: initial } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const { data: product = initial } = useQuery({
    queryKey: ["product", slug], queryFn: () => fetchProductBySlug(slug), initialData: initial,
  });

  const variants = useMemo(() => [...(product?.variants ?? [])].sort((a, b) => a.size_ml - b.size_ml), [product]);
  const [selectedId, setSelectedId] = useState(variants[2]?.id ?? variants[0]?.id);
  const [qty, setQty] = useState(1);

  if (!product) return null;
  const v = variants.find((x) => x.id === selectedId) ?? variants[0];
  const finalPrice = discountedPrice(v.price, product.discount_percent);
  const originalPrice = v.price;

  const add = useCart((s) => s.add);
  const toggleWish = useWishlist((s) => s.toggle);
  const isWished = useWishlist((s) => s.has(product.id));

  const onAdd = () => {
    add({
      productId: product.id, variantId: v.id, productSlug: product.slug,
      productName: product.name, brandName: product.brand?.name ?? "",
      sizeMl: v.size_ml, price: finalPrice, quantity: qty,
      imageUrl: resolveImage(product.image_url),
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
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="relative overflow-hidden rounded-sm bg-secondary">
          <img src={resolveImage(product.image_url)} alt={`${product.brand?.name} ${product.name}`} className="aspect-[4/5] w-full object-cover" />
          {product.discount_percent > 0 && (
            <span className="absolute left-4 top-4 rounded-sm bg-[color:var(--gold)] px-2 py-1 text-[10px] track-luxury text-[color:var(--gold-foreground)]">−{product.discount_percent}%</span>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="flex flex-col">
          <div className="text-[11px] track-luxury text-[color:var(--gold)]">{product.brand?.name}</div>
          <h1 className="mt-2 font-display text-4xl md:text-5xl">{product.name}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            {product.category && <span className="rounded-sm border border-[color:var(--gold)]/40 px-2 py-1 text-[10px] track-luxury text-[color:var(--gold)]">{product.category.name}</span>}
            {product.collection && <span className="rounded-sm border border-border px-2 py-1 text-[10px] track-luxury text-muted-foreground">{product.collection.name}</span>}
            {product.is_limited && <span className="rounded-sm bg-foreground px-2 py-1 text-[10px] track-luxury text-background">Limited</span>}
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-display text-4xl text-[color:var(--gold)]">{formatBDT(finalPrice)}</span>
            {product.discount_percent > 0 && <span className="text-base text-muted-foreground line-through">{formatBDT(originalPrice)}</span>}
            <span className="text-xs text-muted-foreground">/ {v.size_ml}ml</span>
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
              {variants.map((vr) => (
                <button key={vr.id} onClick={() => setSelectedId(vr.id)}
                  className={`min-w-16 rounded-sm border px-4 py-3 text-center transition-all ${selectedId === vr.id ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10 text-[color:var(--gold)]" : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"}`}>
                  <div className="text-sm font-medium">{vr.size_ml} ML</div>
                  <div className="mt-0.5 text-[10px]">{formatBDT(discountedPrice(vr.price, product.discount_percent))}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7 flex items-center gap-3">
            <div className="flex items-center rounded-sm border border-border">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-11 w-11 hover:text-[color:var(--gold)]">−</button>
              <span className="w-10 text-center text-sm">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="h-11 w-11 hover:text-[color:var(--gold)]">+</button>
            </div>
            <button onClick={onAdd} className="btn-liquid flex-1"><ShoppingBag className="h-3.5 w-3.5" /> Add to Cart</button>
            <button onClick={() => toggleWish({
              productId: product.id, productSlug: product.slug, productName: product.name,
              brandName: product.brand?.name ?? "", imageUrl: resolveImage(product.image_url),
              basePrice: product.base_price, discountPercent: product.discount_percent,
            })} aria-label="Wishlist" className={`grid h-12 w-12 place-items-center rounded-sm border ${isWished ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10 text-[color:var(--gold)]" : "border-border hover:border-[color:var(--gold)]"}`}>
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
    </div>
  );
}
