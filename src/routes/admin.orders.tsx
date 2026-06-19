import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/format";

const ALL_STATUSES = ["pending", "confirmed", "processing", "in_progress", "shipped", "delivered", "resolved", "cancelled"] as const;
type Status = typeof ALL_STATUSES[number];

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "Orders — Admin RDF" }] }),
  component: AdminOrders,
});

function AdminOrders() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Status | "all">("all");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", filter],
    queryFn: async () => {
      let q = supabase.from("orders").select("id, order_number, status, total, payment_method, txn_id, payment_phone, address_snapshot, notes, admin_notes, created_at, order_items(id, product_name, brand_name, size_ml, quantity, unit_price)").order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Order updated to ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] track-luxury text-[color:var(--gold)]">Operations</p>
          <h1 className="mt-1 font-display text-3xl">Orders</h1>
        </div>
        <div className="flex flex-wrap gap-1">
          {(["all", ...ALL_STATUSES] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`rounded-sm border px-3 py-1.5 text-[10px] track-luxury ${filter === s ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10 text-[color:var(--gold)]" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </header>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="space-y-4">
          {(data ?? []).map((o) => {
            type Addr = { full_name?: string; phone?: string; line1?: string; city?: string };
            const addr = o.address_snapshot as Addr;
            return (
              <div key={o.id} className="rounded-sm border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <div className="text-[10px] track-luxury text-muted-foreground">Order</div>
                    <div className="font-display text-lg">{o.order_number}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] track-luxury text-muted-foreground">Customer</div>
                    <div className="text-sm">{addr?.full_name}</div>
                    <div className="text-xs text-muted-foreground">{addr?.phone}</div>
                    <div className="text-xs text-muted-foreground">{addr?.line1}, {addr?.city}</div>
                  </div>
                  <div>
                    <div className="text-[10px] track-luxury text-muted-foreground">Payment</div>
                    <div className="text-sm uppercase">{o.payment_method}</div>
                    {o.txn_id && <div className="text-xs text-[color:var(--gold)]">TXN: {o.txn_id}</div>}
                    {o.payment_phone && <div className="text-xs text-muted-foreground">{o.payment_phone}</div>}
                  </div>
                  <div>
                    <div className="text-[10px] track-luxury text-muted-foreground">Total</div>
                    <div className="font-display text-lg">{formatBDT(Number(o.total))}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] track-luxury text-muted-foreground">Status</div>
                    <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value as Status)}
                      className="rounded-sm border border-border bg-background px-2 py-1.5 text-xs uppercase tracking-wider focus:border-[color:var(--gold)] focus:outline-none">
                      {ALL_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-3 divide-y divide-border text-sm">
                  {o.order_items.map((it) => (
                    <div key={it.id} className="flex items-center justify-between py-2">
                      <div>
                        <div className="text-[10px] track-luxury text-muted-foreground">{it.brand_name}</div>
                        <div>{it.product_name}</div>
                        <div className="text-xs text-muted-foreground">{it.size_ml}ml × {it.quantity}</div>
                      </div>
                      <div>{formatBDT(Number(it.unit_price) * it.quantity)}</div>
                    </div>
                  ))}
                </div>
                {o.notes && <p className="mt-3 rounded-sm border border-dashed border-border p-2 text-xs text-muted-foreground"><b>Customer note:</b> {o.notes}</p>}
              </div>
            );
          })}
          {(data ?? []).length === 0 && <p className="text-sm text-muted-foreground">No orders match this filter.</p>}
        </div>
      )}
    </div>
  );
}
