import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/format";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, ShoppingBag, Users, Package, DollarSign } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Admin Dashboard — FRAG AVENUE" }] }),
  component: AdminDashboard,
});

const STATUS_COLORS: Record<string, string> = {
  pending: "#C9A961", confirmed: "#8C7853", processing: "#D4AF37",
  in_progress: "#F3E5AB", shipped: "#A78A4A", delivered: "#22c55e",
  resolved: "#0ea5e9", cancelled: "#ef4444",
};

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [ordersRes, productsRes, profilesRes] = await Promise.all([
        supabase.from("orders").select("id, total, status, created_at, order_items(product_name, quantity, unit_price, brand_name)").order("created_at", { ascending: false }),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      const orders = ordersRes.data ?? [];
      const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
      const aov = orders.length ? totalRevenue / orders.length : 0;

      // monthly buckets (last 12 months)
      const now = new Date();
      const months: { label: string; revenue: number; orders: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString("en-US", { month: "short" });
        months.push({ label, revenue: 0, orders: 0 });
      }
      orders.forEach((o) => {
        const od = new Date(o.created_at);
        const idx = (now.getFullYear() - od.getFullYear()) * 12 + (now.getMonth() - od.getMonth());
        const slot = months[11 - idx];
        if (slot) { slot.revenue += Number(o.total); slot.orders += 1; }
      });

      // status distribution
      const statusMap = new Map<string, number>();
      orders.forEach((o) => statusMap.set(o.status, (statusMap.get(o.status) ?? 0) + 1));
      const statusData = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));

      // top brands
      const brandMap = new Map<string, number>();
      orders.forEach((o) => (o.order_items ?? []).forEach((it: { brand_name: string | null; quantity: number; unit_price: number }) => {
        const name = it.brand_name ?? "Unknown";
        brandMap.set(name, (brandMap.get(name) ?? 0) + it.quantity * Number(it.unit_price));
      }));
      const topBrands = Array.from(brandMap.entries()).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue).slice(0, 6);

      return {
        totalRevenue, totalOrders: orders.length, aov,
        totalProducts: productsRes.count ?? 0,
        totalCustomers: profilesRes.count ?? 0,
        months, statusData, topBrands,
        recentOrders: orders.slice(0, 8),
      };
    },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <header className="mb-8">
        <p className="text-[11px] track-luxury text-[color:var(--gold)]">Overview</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">Dashboard</h1>
      </header>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading analytics…</p> : data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Stat icon={<DollarSign className="h-4 w-4" />} label="Revenue" value={formatBDT(data.totalRevenue)} />
            <Stat icon={<ShoppingBag className="h-4 w-4" />} label="Orders" value={data.totalOrders.toString()} />
            <Stat icon={<TrendingUp className="h-4 w-4" />} label="Avg Order" value={formatBDT(Math.round(data.aov))} />
            <Stat icon={<Package className="h-4 w-4" />} label="Products" value={data.totalProducts.toString()} />
            <Stat icon={<Users className="h-4 w-4" />} label="Customers" value={data.totalCustomers.toString()} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="admin-card p-5 lg:col-span-2">
              <h3 className="mb-4 font-display text-lg">Revenue — Last 12 Months</h3>
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={data.months}>
                    <CartesianGrid stroke="rgba(212,175,55,0.08)" strokeDasharray="3 3" />
                    <XAxis dataKey="label" stroke="#888" fontSize={11} />
                    <YAxis stroke="#888" fontSize={11} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 4 }} />
                    <Line type="monotone" dataKey="revenue" stroke="var(--gold)" strokeWidth={2} dot={{ fill: "var(--gold)" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="admin-card p-5">
              <h3 className="mb-4 font-display text-lg">Order Status</h3>
              <div className="h-72">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={data.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {data.statusData.map((s, i) => <Cell key={i} fill={STATUS_COLORS[s.name] ?? "#888"} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="admin-card p-5">
              <h3 className="mb-4 font-display text-lg">Top Brands by Revenue</h3>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={data.topBrands}>
                    <CartesianGrid stroke="rgba(212,175,55,0.08)" strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#888" fontSize={10} />
                    <YAxis stroke="#888" fontSize={10} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                    <Bar dataKey="revenue" fill="var(--gold)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="admin-card p-5">
              <h3 className="mb-4 font-display text-lg">Recent Orders</h3>
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1 thin-scroll">
                {data.recentOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between border-b border-border pb-2 text-sm last:border-0">
                    <div>
                      <div className="text-[10px] track-luxury text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</div>
                      <div className="font-medium">{(o as { order_number?: string }).order_number ?? o.id.slice(0, 8)}</div>
                    </div>
                    <div className="rounded-sm bg-[color:var(--gold)]/10 px-2 py-1 text-[10px] track-luxury text-[color:var(--gold)]">{o.status}</div>
                    <div className="font-medium">{formatBDT(Number(o.total))}</div>
                  </div>
                ))}
                {data.recentOrders.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="admin-card p-5">
      <div className="flex items-center gap-2 text-[10px] track-luxury text-muted-foreground">
        <span className="text-[color:var(--gold)]">{icon}</span> {label}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
