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

  const onAdd = () => {
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
    <motion.article
      whileHover="hover"
      initial="initial"
      className="card-luxury group relative flex flex-col"
    >
      {(product.is_new || product.discount_percent > 0 || product.is_limited) && (
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
          {product.is_new && <span className="rounded-sm bg-foreground px-2 py-0.5 text-[9px] track-luxury text-background">New</span>}
          {product.discount_percent > 0 && <span className="rounded-sm bg-[color:var(--gold)] px-2 py-0.5 text-[9px] track-luxury text-[color:var(--gold-foreground)]">−{product.discount_percent}%</span>}
          {product.is_limited && <span className="rounded-sm border border-[color:var(--gold)] bg-background/80 px-2 py-0.5 text-[9px] track-luxury text-[color:var(--gold)]">Limited</span>}
        </div>
      )}
      <button
        onClick={onWish}
        aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
        className={`absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full border border-border bg-background/80 backdrop-blur transition-all hover:border-[color:var(--gold)] ${isWished ? "text-[color:var(--gold)]" : "text-muted-foreground"}`}
      >
        <Heart className={`h-3.5 w-3.5 ${isWished ? "fill-current" : ""}`} />
      </button>

      <Link to="/products/$slug" params={{ slug: product.slug }} className="block">
        <ProductCardImage product={product} onAdd={onAdd} />
      </Link>

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
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-display text-lg text-[color:var(--gold)]">{formatBDT(finalPrice)}</span>
          {product.discount_percent > 0 && v && (
            <span className="text-xs text-muted-foreground line-through">{formatBDT(v.price)}</span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function ProductCardImage({ product, onAdd }: { product: Product; onAdd: () => void }) {
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
          animate={{ opacity: i === idx ? 1 : 0, x: i === idx ? 0 : i < idx ? "-6%" : "6%", scale: i === idx ? 1.02 : 1 }}
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
      <motion.div
        variants={{ initial: { y: 20, opacity: 0 }, hover: { y: 0, opacity: 1 } }}
        transition={{ duration: 0.35 }}
        className="absolute inset-x-3 bottom-3 z-10"
      >
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAdd(); }}
          className="flex w-full items-center justify-center gap-2 rounded-sm bg-foreground py-2.5 text-[10px] track-luxury text-background transition-transform hover:scale-[1.02]"
        >
          <ShoppingBag className="h-3 w-3" /> Add to cart
        </button>
      </motion.div>
    </div>
  );
}
