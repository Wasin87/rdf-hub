import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag, Plus, Minus, X } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { useCart } from "@/stores/cart";
import { formatBDT } from "@/lib/format";
import { SafeImage } from "@/components/SafeImage";

export const Route = createFileRoute("/_authenticated/dashboard/cart")({
  head: () => ({ meta: [{ title: "Cart — FRAG AVENUE" }] }),
  component: CartPage,
});

function CartPage() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const subtotal = useCart((s) => s.subtotal());
  return (
    <DashboardShell title="My Cart" description="Review your selections before checkout.">
      {items.length === 0 ? (
        <div className="grid place-items-center rounded-sm border border-dashed border-border py-16 text-center">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 font-display text-xl">Your cart is empty</h3>
          <Link to="/shop" className="btn-liquid mt-5">Begin shopping</Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {items.map((i) => (
              <div key={i.variantId} className="flex gap-4 rounded-sm border border-border bg-card p-4">
                <SafeImage src={i.imageUrl} alt={i.productName} wrapperClassName="h-24 w-24 rounded-sm" className="h-24 w-24 object-cover" />
                <div className="flex flex-1 flex-col">
                  <div className="text-[10px] track-luxury text-muted-foreground">{i.brandName}</div>
                  <div className="font-medium">{i.productName}</div>
                  <div className="text-xs text-muted-foreground">{i.sizeLabel?.trim() ? i.sizeLabel : `${i.sizeMl}ml`}</div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center rounded-sm border border-border">
                      <button onClick={() => setQty(i.variantId, i.quantity - 1)} className="grid h-8 w-8 place-items-center hover:text-[color:var(--gold)]"><Minus className="h-3 w-3" /></button>
                      <span className="w-8 text-center text-xs">{i.quantity}</span>
                      <button onClick={() => setQty(i.variantId, i.quantity + 1)} className="grid h-8 w-8 place-items-center hover:text-[color:var(--gold)]"><Plus className="h-3 w-3" /></button>
                    </div>
                    <div className="font-medium text-[color:var(--gold)]">{formatBDT(i.price * i.quantity)}</div>
                  </div>
                </div>
                <button onClick={() => remove(i.variantId)} className="text-muted-foreground hover:text-destructive" aria-label="Remove"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <aside className="h-fit rounded-sm border border-[color:var(--gold)]/20 bg-section p-6">
            <div className="text-[10px] track-luxury text-muted-foreground">Subtotal</div>
            <div className="text-3xl font-semibold text-[color:var(--gold)]">{formatBDT(subtotal)}</div>
            <Link to="/checkout" className="btn-liquid mt-5 w-full">Proceed to Checkout</Link>
          </aside>
        </div>
      )}
    </DashboardShell>
  );
}
