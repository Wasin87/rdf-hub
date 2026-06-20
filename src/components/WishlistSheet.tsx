import { Link } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Heart, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWishlist } from "@/stores/wishlist";
import { formatBDT, discountedPrice } from "@/lib/format";

export function WishlistSheet() {
  const items = useWishlist((s) => s.items);
  const remove = useWishlist((s) => s.remove);
  const count = useWishlist((s) => s.count());
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button aria-label="Wishlist" className="relative grid h-9 w-9 place-items-center rounded-full text-foreground transition-all duration-300 hover:scale-110 hover:text-[color:var(--gold)]">
          <Heart className="h-[18px] w-[18px]" />
          <AnimatePresence>
            {count > 0 && (
              <motion.span key={count} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[color:var(--gold)] px-1 text-[9px] font-semibold text-[color:var(--gold-foreground)] shadow">{count}</motion.span>
            )}
          </AnimatePresence>
        </button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="font-display text-xl">Wishlist {count > 0 && <span className="text-sm font-normal text-muted-foreground">({count})</span>}</SheetTitle>
        </SheetHeader>
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-secondary"><Heart className="h-7 w-7 text-muted-foreground" /></div>
            <h3 className="font-display text-lg">Nothing saved yet</h3>
            <p className="text-sm text-muted-foreground">Tap the heart on any fragrance you love.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-1 py-4">
            {items.map((it) => {
              const final = discountedPrice(it.basePrice, it.discountPercent);
              return (
                <motion.div key={it.productId} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-3 border-b border-border/60 px-4 py-3 last:border-0">
                  <img src={it.imageUrl} alt={it.productName} className="h-16 w-16 rounded-sm object-cover" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] track-luxury text-muted-foreground">{it.brandName}</div>
                    <Link to="/products/$slug" params={{ slug: it.productSlug }} className="truncate text-sm font-medium hover:text-[color:var(--gold)]">{it.productName}</Link>
                    <div className="text-xs text-[color:var(--gold)]">{formatBDT(final)}</div>
                  </div>
                  <button onClick={() => remove(it.productId)} aria-label="Remove" className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                </motion.div>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
