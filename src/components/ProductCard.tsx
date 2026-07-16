import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { IoCartOutline } from "react-icons/io5";
import { TbHeartPlus } from "react-icons/tb";
import { toast } from "sonner";
import type { Product } from "@/lib/catalog";
import { resolveImage } from "@/lib/catalog";
import { formatBDT, discountedPrice } from "@/lib/format";
import { useCart } from "@/stores/cart";
import { useWishlist } from "@/stores/wishlist";
import { SafeImage } from "@/components/SafeImage";

export function ProductCard({ product }: { product: Product }) {
  const variants = useMemo(() => [...product.variants].sort((a, b) => a.size_ml - b.size_ml), [product.variants]);
  const firstImage = useMemo(() => {
    const list = (product.images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order).map((img) => img.image_url);
    return product.image_url ?? list[0] ?? null;
  }, [product.image_url, product.images]);
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
      imageUrl: resolveImage(firstImage),
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
      imageUrl: resolveImage(firstImage),
      basePrice: product.base_price,
      discountPercent: product.discount_percent,
    });
  };

  return (
    <motion.article className="group/card relative flex flex-col overflow-hidden rounded-lg border border-border bg-card p-0 shadow-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
      {(product.is_new || product.discount_percent > 0 || product.is_limited) && (
        <div className="absolute left-2 top-2 z-10 flex flex-col gap-1 sm:left-3 sm:top-3 sm:gap-1.5">
          {product.is_new && <span className="rounded-full bg-foreground px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-background shadow-md sm:px-2.5 sm:py-1 sm:text-[9px]">New</span>}
          {product.discount_percent > 0 && <span className="rounded-full bg-destructive px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-destructive-foreground shadow-md sm:px-2.5 sm:py-1 sm:text-[9px]">−{product.discount_percent}%</span>}
          {product.is_limited && <span className="rounded-full bg-[color:var(--gold)] px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-[color:var(--gold-foreground)] shadow-md sm:px-2.5 sm:py-1 sm:text-[9px]">Limited</span>}
        </div>
      )}

      <Link to="/products/$slug" params={{ slug: product.slug }} className="relative block overflow-hidden">
        <ProductCardImage product={product} />
        {/* Desktop hover: Explore slides up from the bottom of the IMAGE only */}
        <span
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden lg:flex items-center justify-center gap-2 bg-foreground py-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-background opacity-0 translate-y-full transition-all duration-500 group-hover/card:opacity-100 group-hover/card:translate-y-0 group-hover/card:pointer-events-auto hover:bg-[color:var(--gold)] hover:text-[color:var(--gold-foreground)]"
        >
          <ArrowRight className="h-3.5 w-3.5" /> Explore
        </span>
      </Link>

      {/* Wishlist */}
      <button
        onClick={onWish}
        aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
        className={`absolute right-2 top-2 z-20 grid h-7 w-7 place-items-center rounded-full border border-border bg-background/90 backdrop-blur-md shadow-md transition-all duration-300 hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] active:scale-95 sm:right-3 sm:top-3 sm:h-9 sm:w-9 lg:opacity-0 lg:scale-90 lg:translate-y-1 group-hover/card:lg:opacity-100 group-hover/card:lg:scale-100 group-hover/card:lg:translate-y-0 ${isWished ? "text-[color:var(--gold)] lg:!opacity-100 lg:!scale-100" : "text-foreground"}`}
      >
        <TbHeartPlus className={`h-3 w-3 sm:h-4 sm:w-4 ${isWished ? "fill-current" : ""}`} />
      </button>

      <div className="flex flex-1 flex-col gap-1 p-2.5 sm:gap-1.5 sm:p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[9px] track-luxury text-muted-foreground sm:text-[10px]">{product.brand?.name}</span>
          {product.category && <span className="hidden rounded-full border border-border px-2 py-px text-[8px] track-luxury text-muted-foreground sm:inline">{product.category.name}</span>}
        </div>
        <Link to="/products/$slug" params={{ slug: product.slug }} className="line-clamp-1 font-display text-[13px] font-semibold leading-snug text-foreground transition-colors hover:text-[color:var(--gold)] sm:text-[15px] md:text-base">
          {product.name}
        </Link>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select size"
          className="mt-0.5 h-6 w-fit rounded-sm border border-border bg-transparent px-1.5 text-[9px] track-luxury text-muted-foreground focus:border-[color:var(--gold)] focus:outline-none sm:h-7 sm:px-2 sm:text-[10px]"
        >
          {variants.map((vr) => <option key={vr.id} value={vr.id}>{vr.size_ml} ML</option>)}
        </select>
        <div className="mt-0.5 flex items-center justify-between gap-2 sm:mt-1">
          <div className="flex items-baseline gap-1.5 min-w-0 sm:gap-2">
            <span className="text-sm font-bold text-[color:var(--gold)] truncate sm:text-base md:text-lg">{formatBDT(finalPrice)}</span>
            {product.discount_percent > 0 && v && (
              <span className="text-[10px] text-muted-foreground line-through sm:text-xs">{formatBDT(v.price)}</span>
            )}
          </div>
          <button
            type="button"
            onClick={onAdd}
            aria-label="Add to cart"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-foreground text-background transition-all duration-300 hover:scale-110 hover:bg-[color:var(--gold)] hover:text-[color:var(--gold-foreground)] active:scale-95 sm:h-9 sm:w-9 lg:opacity-0 lg:translate-y-1 group-hover/card:lg:opacity-100 group-hover/card:lg:translate-y-0"
          >
            <IoCartOutline className="h-4 w-4 sm:h-[19px] sm:w-[19px]" />
          </button>
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
    <div className="relative aspect-[1/1] overflow-hidden bg-secondary" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {images.map((url, i) => (
        <motion.div
          key={`${url}-${i}`}
          className="absolute inset-0 h-full w-full object-cover"
          initial={false}
          animate={{ opacity: i === idx ? 1 : 0, scale: i === idx ? 1.02 : 1 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <SafeImage src={url} alt={`${product.brand?.name ?? ""} ${product.name}`} wrapperClassName="h-full w-full" className="h-full w-full object-cover" loading="lazy" />
        </motion.div>
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
