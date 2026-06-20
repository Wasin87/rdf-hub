import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/catalog";
import { resolveImage } from "@/lib/catalog";
import { formatBDT, discountedPrice } from "@/lib/format";
import { useCart } from "@/stores/cart";
import { useWishlist } from "@/stores/wishlist";

export function ProductCard({ product }: { product: Product }) {
  const variants = useMemo(() => [...product.variants].sort((a, b) => a.size_ml - b.size_ml), [product.variants]);
  const [selected, setSelected] = useState(variants[2]?.id ?? variants[0]?.id);
  const v = variants.find((x) => x.id === selected) ?? variants[0];

  const finalPrice = v ? discountedPrice(v.price, product.discount_percent) : 0;
  const addToCart = useCart((s) => s.add);
  const toggleWish = useWishlist((s) => s.toggle);
  const isWished = useWishlist((s) => s.has(product.id));

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!v) return;
    addToCart({
      productId: product.id,
      variantId: v.id,
      productSlug: product.slug,
      productName: product.name,
      brandName: product.brand?.name ?? "",
      sizeMl: v.size_ml,
      price: discountedPrice(v.price, product.discount_percent),
      quantity: 1,
      imageUrl: resolveImage(product.image_url),
    });
    toast.success("Added to cart", { description: `${product.name} • ${v.size_ml}ml` });
  };

  const onWish = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    toggleWish({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      brandName: product.brand?.name ?? "",
      imageUrl: resolveImage(product.image_url),
      basePrice: product.base_price,
      discountPercent: product.discount_percent,
    });
  };

  return (
    <motion.article className="card-luxury group/card relative flex flex-col">
      {(product.is_new || product.discount_percent > 0 || product.is_limited) && (
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
          {product.is_new && <span className="rounded-sm bg-foreground px-2 py-0.5 text-[9px] track-luxury text-background">New</span>}
          {product.discount_percent > 0 && <span className="rounded-sm bg-[color:var(--gold)] px-2 py-0.5 text-[9px] track-luxury text-[color:var(--gold-foreground)]">−{product.discount_percent}%</span>}
          {product.is_limited && <span className="rounded-sm border border-[color:var(--gold)] bg-background/80 px-2 py-0.5 text-[9px] track-luxury text-[color:var(--gold)]">Limited</span>}
        </div>
      )}

      <Link to="/products/$slug" params={{ slug: product.slug }} className="block">
        <ProductCardImage product={product} />
      </Link>

      {/* Desktop hover: wishlist top-right */}
      <motion.button
        onClick={onWish}
        aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
        initial={false}
        className={`absolute right-3 top-3 z-20 hidden lg:grid h-9 w-9 place-items-center rounded-full border border-[color:var(--gold)]/40 bg-background/85 backdrop-blur-md shadow-lg transition-all duration-300 opacity-0 scale-90 translate-y-1 group-hover/card:opacity-100 group-hover/card:scale-100 group-hover/card:translate-y-0 hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] ${isWished ? "text-[color:var(--gold)] !opacity-100 !scale-100" : "text-foreground"}`}
      >
        <Heart className={`h-4 w-4 ${isWished ? "fill-current" : ""}`} />
      </motion.button>

      {/* Desktop hover: cart bottom-right over image */}
      <motion.button
        type="button"
        onClick={onAdd}
        aria-label="Add to cart"
        className="absolute right-3 z-20 hidden lg:grid h-10 w-10 place-items-center rounded-full bg-[color:var(--gold)] text-[color:var(--gold-foreground)] shadow-xl transition-all duration-300 opacity-0 scale-90 hover:scale-110 group-hover/card:opacity-100 group-hover/card:scale-100"
        style={{ top: "calc(80% - 1.25rem)" }}
      >
        <ShoppingBag className="h-4 w-4" />
      </motion.button>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[10px] track-luxury text-muted-foreground">{product.brand?.name}</span>
          {product.category && <span className="rounded-sm border border-[color:var(--gold)]/30 px-1.5 py-px text-[8px] track-luxury text-[color:var(--gold)]">{product.category.name}</span>}
        </div>
        <Link to="/products/$slug" params={{ slug: product.slug }} className="line-clamp-1 font-display text-[1rem] font-medium leading-snug text-foreground transition-colors hover:text-[color:var(--gold)]">
          {product.name}
        </Link>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select size"
          className="mt-1 h-7 w-fit rounded-sm border border-border bg-transparent px-2 text-[10px] track-luxury text-muted-foreground focus:border-[color:var(--gold)] focus:outline-none"
        >
          {variants.map((vr) => <option key={vr.id} value={vr.id}>{vr.size_ml} ML</option>)}
        </select>
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="font-display text-lg text-[color:var(--gold)] truncate">{formatBDT(finalPrice)}</span>
            {product.discount_percent > 0 && v && (
              <span className="text-xs text-muted-foreground line-through">{formatBDT(v.price)}</span>
            )}
          </div>
          {/* Mobile/Tablet always-visible actions */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <button
              type="button"
              onClick={onWish}
              aria-label="Wishlist"
              className={`grid h-9 w-9 place-items-center rounded-sm border transition-all ${isWished ? "border-[color:var(--gold)] text-[color:var(--gold)]" : "border-border text-foreground hover:border-[color:var(--gold)]"}`}
            >
              <Heart className={`h-4 w-4 ${isWished ? "fill-current" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onAdd}
              aria-label="Add to cart"
              className="shrink-0 grid h-9 w-9 place-items-center rounded-sm bg-foreground text-background transition-all hover:bg-[color:var(--gold)] hover:text-[color:var(--gold-foreground)] active:scale-95"
            >
              <ShoppingBag className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function ProductCardImage({ product }: { product: Product }) {
  const images = useMemo(() => {
    const list = (product.images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order).map((i) => i.image_url);
    const primary = product.image_url ?? null;
    const merged = primary ? [primary, ...list.filter((u) => u !== primary)] : list;
    return merged.length > 0 ? merged : [product.image_url ?? ""];
  }, [product.images, product.image_url]);

  const [idx, setIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasMany = images.length > 1;

  const onEnter = () => {
    if (!hasMany) return;
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setIdx((i) => (i + 1) % images.length), 1100);
  };
  const onLeave = () => {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    setIdx(0);
  };
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  return (
    <div className="relative aspect-[4/5] overflow-hidden bg-secondary" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {images.map((url, i) => (
        <motion.img
          key={`${url}-${i}`}
          src={resolveImage(url)}
          alt={`${product.brand?.name ?? ""} ${product.name}`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          initial={false}
          animate={{ opacity: i === idx ? 1 : 0, scale: i === idx ? 1.02 : 1 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        />
      ))}
      {hasMany && (
        <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
          {images.map((_, i) => (
            <span key={i} className={`h-1 rounded-full transition-all ${i === idx ? "w-5 bg-[color:var(--gold)]" : "w-1.5 bg-background/60"}`} />
          ))}
        </div>
      )}
    </div>
  );
}
