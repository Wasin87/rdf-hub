import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, X } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { useWishlist } from "@/stores/wishlist";
import { formatBDT, discountedPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — FRAG AVENUE" }] }),
  component: WishPage,
});

function WishPage() {
  const items = useWishlist((s) => s.items);
  const remove = useWishlist((s) => s.remove);
  return (
    <DashboardShell title="My Wishlist" description="Fragrances saved for future devotion.">
      {items.length === 0 ? (
        <div className="grid place-items-center rounded-sm border border-dashed border-border py-16 text-center">
          <Heart className="h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 font-display text-xl">Nothing saved yet</h3>
          <Link to="/shop" className="btn-liquid mt-5">Browse Fragrances</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const final = discountedPrice(it.basePrice, it.discountPercent);
            return (
              <div key={it.productId} className="card-luxury relative flex gap-3 p-4">
                <button onClick={() => remove(it.productId)} aria-label="Remove" className="absolute right-3 top-3 grid h-7 w-7 place-items-center text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                <img src={it.imageUrl} alt={it.productName} className="h-24 w-20 shrink-0 rounded-sm object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] track-luxury text-muted-foreground">{it.brandName}</div>
                  <Link to="/products/$slug" params={{ slug: it.productSlug }} className="line-clamp-2 text-sm font-medium hover:text-[color:var(--gold)]">{it.productName}</Link>
                  <div className="mt-2 text-sm text-[color:var(--gold)]">{formatBDT(final)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
