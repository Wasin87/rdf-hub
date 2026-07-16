import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatBDT } from "@/lib/format";
import { Package, Check, Clock, Truck, X, Sparkles, RefreshCw, Star, ChevronDown } from "lucide-react";
import { ReviewForm } from "@/components/ReviewForm";
import { LuxuryLoader } from "@/components/Loader";
import { SafeImage } from "@/components/SafeImage";

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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

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
        <div className="overflow-hidden rounded-sm border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-secondary/50">
                <tr className="text-left text-[10px] track-luxury text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {q.data!.map((o) => {
                  const cancelled = o.status === "cancelled";
                  const currentIdx = TIMELINE.findIndex((t) => t.key === o.status);
                  const isOpen = expanded.has(o.id);
                  return (
                    <React.Fragment key={o.id}>
                      <tr className="border-t border-border transition-colors hover:bg-secondary/30">
                        <td className="px-4 py-4 font-medium">{o.order_number}</td>
                        <td className="px-4 py-4 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-4">
                          <div className="text-xs uppercase">{o.payment_method}</div>
                          {o.txn_id && <div className="text-[10px] text-[color:var(--gold)]">TXN: {o.txn_id}</div>}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center rounded-sm px-2 py-1 text-[10px] track-luxury ${cancelled ? "bg-destructive/10 text-destructive" : "bg-[color:var(--gold)]/10 text-[color:var(--gold)]"}`}>
                            {o.status.replace("_", " ").toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-semibold">{formatBDT(Number(o.total))}</td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => toggle(o.id)}
                            aria-expanded={isOpen}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
                          >
                            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="border-t border-border/60 bg-secondary/20">
                          <td colSpan={6} className="px-4 py-6">
                            {/* Progress line */}
                            {!cancelled ? (
                              <div className="mb-6">
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
                              <div className="mb-4 flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                                <X className="h-4 w-4" /> This order was cancelled.
                              </div>
                            )}

                            <div className="divide-y divide-border rounded-sm border border-border bg-card">
                              {o.order_items.map((it) => {
                                const canReview = o.status === "delivered" || o.status === "resolved";
                                const already = reviewedQ.data?.has(`${o.id}:${it.product_id}`) ?? false;
                                return (
                                  <div key={it.id} className="flex flex-wrap items-center gap-4 p-3">
                                    {it.image_url && (
                                      <SafeImage
                                        src={it.image_url}
                                        alt={it.product_name}
                                        wrapperClassName="h-14 w-14 rounded-sm"
                                        className="h-14 w-14 rounded-sm object-cover"
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
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
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
