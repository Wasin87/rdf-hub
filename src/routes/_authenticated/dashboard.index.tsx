import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, Heart, ShoppingBag, MapPin } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/stores/wishlist";
import { useCart } from "@/stores/cart";
import { formatBDT } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — FRAG AVENUE" }] }),
  component: Overview,
});

function Overview() {
  const { user } = useAuth();
  const wishlistCount = useWishlist((s) => s.count());
  const cartCount = useCart((s) => s.count());
  const cartSubtotal = useCart((s) => s.subtotal());

  const profileQ = useQuery({
    queryKey: ["profile", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });
  const ordersQ = useQuery({
    queryKey: ["orders", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("id, order_number, total, status, created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  const stats = [
    { Icon: Package, label: "Orders", value: ordersQ.data?.length ?? 0, href: "/dashboard/orders" },
    { Icon: Heart, label: "Wishlist", value: wishlistCount, href: "/dashboard/wishlist" },
    { Icon: ShoppingBag, label: "Cart", value: cartCount, href: "/dashboard/cart" },
    { Icon: MapPin, label: "Addresses", value: "—", href: "/dashboard/addresses" },
  ];

  return (
    <DashboardShell title={`Welcome, ${profileQ.data?.full_name?.split(" ")[0] ?? "there"}`} description="A summary of your account at a glance.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.href as never} className="card-luxury p-5">
            <s.Icon className="h-5 w-5 text-[color:var(--gold)]" />
            <div className="mt-3 text-[10px] track-luxury text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-3xl font-semibold">{s.value}</div>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-sm border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg">Recent Orders</h2>
            <Link to="/dashboard/orders" className="text-[10px] track-luxury text-[color:var(--gold)]">View all →</Link>
          </div>
          {(!ordersQ.data || ordersQ.data.length === 0) ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {ordersQ.data.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium">{o.order_number}</div>
                    <div className="text-[11px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{formatBDT(o.total)}</div>
                    <div className="text-[10px] track-luxury text-[color:var(--gold)]">{o.status}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-sm border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg">Cart Snapshot</h2>
          {cartCount === 0 ? (
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{cartCount} item{cartCount === 1 ? "" : "s"}, totaling</p>
              <p className="mt-1 text-3xl font-semibold text-[color:var(--gold)]">{formatBDT(cartSubtotal)}</p>
              <Link to="/checkout" className="btn-liquid mt-5 inline-flex">Checkout</Link>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
