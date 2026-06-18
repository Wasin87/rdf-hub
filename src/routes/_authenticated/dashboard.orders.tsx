import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatBDT } from "@/lib/format";
import { Package } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/orders")({
  head: () => ({ meta: [{ title: "Orders — RDF" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["my-orders", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, total, status, created_at, order_items(id, product_name, brand_name, size_ml, quantity, unit_price, image_url)")
        .eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <DashboardShell title="My Orders" description="Track and review every order you've placed.">
      {q.isLoading ? <p className="text-sm text-muted-foreground">Loading orders…</p> :
       (q.data?.length ?? 0) === 0 ? (
        <div className="grid place-items-center rounded-sm border border-dashed border-border py-16 text-center">
          <Package className="h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 font-display text-xl">No orders yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Discover something extraordinary.</p>
          <Link to="/shop" className="btn-liquid mt-5">Shop Now</Link>
        </div>
      ) : (
        <div className="space-y-5">
          {q.data!.map((o: { id: string; order_number: string; status: string; total: number; created_at: string; order_items: { id: string; image_url: string | null; brand_name: string | null; product_name: string; size_ml: number; quantity: number; unit_price: number }[] }) => (
            <div key={o.id} className="rounded-sm border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <div className="text-[10px] track-luxury text-muted-foreground">Order</div>
                  <div className="font-display text-lg">{o.order_number}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] track-luxury text-muted-foreground">Status</div>
                  <div className="text-sm font-medium text-[color:var(--gold)]">{o.status}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] track-luxury text-muted-foreground">Date</div>
                  <div className="text-sm">{new Date(o.created_at).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] track-luxury text-muted-foreground">Total</div>
                  <div className="font-display text-lg">{formatBDT(o.total)}</div>
                </div>
              </div>
              <div className="divide-y divide-border">
                {o.order_items.map((it) => (
                  <div key={it.id} className="flex items-center gap-4 py-3">
                    {it.image_url && <img src={it.image_url} alt={it.product_name} className="h-14 w-14 rounded-sm object-cover" />}
                    <div className="flex-1">
                      <div className="text-[10px] track-luxury text-muted-foreground">{it.brand_name}</div>
                      <div className="text-sm">{it.product_name}</div>
                      <div className="text-[11px] text-muted-foreground">{it.size_ml}ml × {it.quantity}</div>
                    </div>
                    <div className="text-sm">{formatBDT(it.unit_price * it.quantity)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
