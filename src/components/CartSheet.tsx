import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingBag, Plus, Minus, X } from "lucide-react";
import { BiCartDownload } from "react-icons/bi";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/stores/cart";
import { formatBDT } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { SafeImage } from "@/components/SafeImage";

export function CartSheet() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const subtotal = useCart((s) => s.subtotal());
  const count = useCart((s) => s.count());
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const goCheckout = () => {
    setOpen(false);
    if (!user) navigate({ to: "/auth", search: { mode: "login", redirect: "/checkout" } as never });
    else navigate({ to: "/checkout" });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button aria-label="Cart" className="relative grid h-9 w-9 place-items-center rounded-full text-foreground transition-all duration-300 hover:scale-110 hover:text-[color:var(--gold)]">
          <ShoppingBag className="h-[18px] w-[18px]" />
          <AnimatePresence>
            {count > 0 && (
              <motion.span
                key={count}
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[color:var(--gold)] px-1 text-[9px] font-semibold text-[color:var(--gold-foreground)] shadow"
              >{count}</motion.span>
            )}
          </AnimatePresence>
        </button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="font-display text-xl">Your Cart {count > 0 && <span className="text-muted-foreground text-sm font-normal">({count})</span>}</SheetTitle>
        </SheetHeader>
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-secondary"><ShoppingBag className="h-7 w-7 text-muted-foreground" /></div>
            <div>
              <h3 className="font-display text-lg">Your cart is empty</h3>
              <p className="mt-1 text-sm text-muted-foreground">Begin your fragrance journey.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-1 py-4">
              {items.map((it) => (
                <motion.div
                  key={it.variantId}
                  layout
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="flex gap-3 border-b border-border/60 px-4 py-4 last:border-0"
                >
                  <SafeImage src={it.imageUrl} alt={it.productName} wrapperClassName="h-20 w-20 rounded-sm" className="h-20 w-20 object-cover" loading="lazy" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="text-[10px] track-luxury text-muted-foreground">{it.brandName}</div>
                    <Link to="/products/$slug" params={{ slug: it.productSlug }} className="truncate text-sm font-medium hover:text-[color:var(--gold)]">{it.productName}</Link>
                    <div className="text-xs text-muted-foreground">{it.sizeMl}ml</div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 rounded-sm border border-border">
                        <button onClick={() => setQty(it.variantId, it.quantity - 1)} className="grid h-7 w-7 place-items-center hover:text-[color:var(--gold)]" aria-label="Decrease"><Minus className="h-3 w-3" /></button>
                        <span className="min-w-5 text-center text-xs">{it.quantity}</span>
                        <button onClick={() => setQty(it.variantId, it.quantity + 1)} className="grid h-7 w-7 place-items-center hover:text-[color:var(--gold)]" aria-label="Increase"><Plus className="h-3 w-3" /></button>
                      </div>
                      <span className="text-sm font-medium text-[color:var(--gold)]">{formatBDT(it.price * it.quantity)}</span>
                    </div>
                  </div>
                  <button onClick={() => remove(it.variantId)} className="self-start text-muted-foreground hover:text-destructive" aria-label="Remove"><X className="h-4 w-4" /></button>
                </motion.div>
              ))}
            </div>
            <div className="border-t border-[color:var(--gold)]/30 bg-section/50 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs track-luxury text-muted-foreground">Subtotal</span>
                <span className="font-display text-xl text-[color:var(--gold)]">{formatBDT(subtotal)}</span>
              </div>
              <p className="mb-4 text-[11px] text-muted-foreground">Shipping calculated at checkout. Free over ৳ 5,000.</p>
              <button onClick={goCheckout} className="btn-liquid w-full">Checkout</button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
