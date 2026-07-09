import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatBDT } from "@/lib/format";
import { Package, Check, Clock, Truck, X, Sparkles, RefreshCw, Star } from "lucide-react";
import { ReviewForm } from "@/components/ReviewForm";
import { LuxuryLoader } from "@/components/Loader";

export const Route = createFileRoute("/_authenticated/dashboard/orders")({
  head: () => ({ meta: [{ title: "Orders — FRAG AVENUE" }] }),
  component: OrdersPage,
  pendingComponent: () => <LuxuryLoader label="Loading orders" />,
});

const TIMELINE: { key: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "pending", label: "Placed", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: Check },
  { key: "processing", label: "Processing", icon: RefreshCw },
  { key: "in_progress", label: "In Progress", icon: Sparkles },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Package },
  { key: "resolved", label: "Resolved", icon: Check },
];

function OrdersPage() {
  const { user } = useAuth();
  const [reviewing, setReviewing] = useState<{ productId: string; productName: string; orderId: string } | null>(null);
  const q = useQuery({
    queryKey: ["my-orders", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, total, status, payment_method, txn_id, created_at, order_items(id, product_id, product_name, brand_name, size_ml, quantity, unit_price, image_url)")
        .eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const reviewedQ = useQuery({
    queryKey: ["my-reviews", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("product_id, order_id").eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => `${r.order_id}:${r.product_id}`));
    },
  });

  return (
    <DashboardShell title="My Orders" description="Track and review every order you've placed.">
      {q.isLoading ? <LuxuryLoader label="Loading orders" /> :
       (q.data?.length ?? 0) === 0 ? (
        <div className="grid place-items-center rounded-sm border border-dashed border-border py-16 text-center">
          <Package className="h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 font-display text-xl">No orders yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Discover something extraordinary.</p>
          <Link to="/shop" className="btn-liquid mt-5">Shop Now</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {q.data!.map((o) => {
            const cancelled = o.status === "cancelled";
            const currentIdx = TIMELINE.findIndex((t) => t.key === o.status);
            return (
              <div key={o.id} className="rounded-sm border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <div className="text-[10px] track-luxury text-muted-foreground">Order</div>
                    <div className="font-display text-lg">{o.order_number}</div>
                  </div>
                  <div>
                    <div className="text-[10px] track-luxury text-muted-foreground">Payment</div>
                    <div className="text-xs uppercase">{o.payment_method}</div>
                    {o.txn_id && <div className="text-[10px] text-[color:var(--gold)]">TXN: {o.txn_id}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] track-luxury text-muted-foreground">Status</div>
                    <div className={`text-sm font-medium ${cancelled ? "text-destructive" : "text-[color:var(--gold)]"}`}>{o.status.replace("_", " ").toUpperCase()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] track-luxury text-muted-foreground">Date</div>
                    <div className="text-sm">{new Date(o.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] track-luxury text-muted-foreground">Total</div>
                    <div className="font-display text-lg">{formatBDT(Number(o.total))}</div>
                  </div>
                </div>

                {/* Timeline */}
                {!cancelled ? (
                  <div className="mt-5 mb-2 hidden md:block">
                    <div className="relative flex items-center justify-between">
                      <div className="absolute left-0 right-0 top-3.5 h-px bg-border" />
                      <div className="absolute left-0 top-3.5 h-px bg-[color:var(--gold)] transition-all"
                           style={{ width: `${currentIdx >= 0 ? (currentIdx / (TIMELINE.length - 1)) * 100 : 0}%` }} />
                      {TIMELINE.map((t, i) => {
                        const done = currentIdx >= i;
                        const Icon = t.icon;
                        return (
                          <div key={t.key} className="relative flex flex-col items-center">
                            <div className={`grid h-7 w-7 place-items-center rounded-full border-2 transition-all ${done ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-[color:var(--gold-foreground)]" : "border-border bg-card text-muted-foreground"}`}>
                              <Icon className="h-3 w-3" />
                            </div>
                            <span className={`mt-2 text-[9px] track-luxury ${done ? "text-[color:var(--gold)]" : "text-muted-foreground"}`}>{t.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <X className="h-4 w-4" /> This order was cancelled.
                  </div>
                )}

                <div className="mt-4 divide-y divide-border">
                  {o.order_items.map((it) => {
                    const canReview = o.status === "delivered" || o.status === "resolved";
                    const already = reviewedQ.data?.has(`${o.id}:${it.product_id}`) ?? false;
                    return (
                      <div key={it.id} className="flex flex-wrap items-center gap-4 py-3">
                        {it.image_url && (
                          <img
                            src={it.image_url}
                            alt={it.product_name}
                            className="h-14 w-14 rounded-sm object-cover"
                            onError={(e) => {
                              const el = e.currentTarget;
                              if (el.dataset.fb !== "1") { el.dataset.fb = "1"; el.src = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'><rect fill='#eee' width='60' height='60'/></svg>"); }
                            }}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] track-luxury text-muted-foreground">{it.brand_name}</div>
                          <div className="truncate text-sm">{it.product_name}</div>
                          <div className="text-[11px] text-muted-foreground">{it.size_ml}ml × {it.quantity}</div>
                        </div>
                        <div className="text-sm">{formatBDT(Number(it.unit_price) * it.quantity)}</div>
                        {canReview && it.product_id && (
                          already ? (
                            <button
                              onClick={() => setReviewing({ productId: it.product_id!, productName: it.product_name, orderId: o.id })}
                              className="inline-flex items-center gap-1 rounded-sm border border-[color:var(--gold)]/30 px-2 py-1 text-[10px] track-luxury text-[color:var(--gold)] hover:bg-[color:var(--gold)]/5"
                              title="Manage your review"
                            >
                              <Check className="h-3 w-3" /> Reviewed · Edit
                            </button>
                          ) : (
                            <button
                              onClick={() => setReviewing({ productId: it.product_id!, productName: it.product_name, orderId: o.id })}
                              className="inline-flex items-center gap-1.5 rounded-sm border border-[color:var(--gold)] bg-[color:var(--gold)]/5 px-3 py-1.5 text-[10px] track-luxury text-[color:var(--gold)] transition-colors hover:bg-[color:var(--gold)] hover:text-[color:var(--gold-foreground)]"
                            >
                              <Star className="h-3 w-3" /> Write Review
                            </button>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {reviewing && (
        <ReviewForm
          productId={reviewing.productId}
          productName={reviewing.productName}
          orderId={reviewing.orderId}
          onClose={() => setReviewing(null)}
          onSubmitted={() => reviewedQ.refetch()}
        />
      )}
    </DashboardShell>
  );
}
