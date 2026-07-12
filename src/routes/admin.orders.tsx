import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Search, Filter, Eye, Trash2, Copy, RefreshCw, X, KeyRound, Printer, Download,
  ChevronLeft, ChevronRight, PackageX, Check, Clock, Truck, Package, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/format";
import { SafeImage } from "@/components/SafeImage";

const ALL_STATUSES = [
  "pending", "confirmed", "processing", "in_progress", "shipped",
  "delivered", "resolved", "cancelled",
] as const;
type Status = typeof ALL_STATUSES[number];

const STATUS_STYLES: Record<Status, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  confirmed: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  processing: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
  in_progress: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  shipped: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30",
  delivered: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  resolved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  cancelled: "bg-rose-500/10 text-rose-600 border-rose-500/30",
};

const PAYMENT_STYLES: Record<string, string> = {
  bkash: "bg-pink-500/10 text-pink-600 border-pink-500/30",
  nagad: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  rocket: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  card: "bg-sky-500/10 text-sky-600 border-sky-500/30",
  cod: "bg-slate-500/10 text-slate-600 border-slate-500/30",
};

type OrderItem = {
  id: string; product_id: string | null; product_name: string; brand_name: string | null;
  size_ml: number | null; quantity: number; unit_price: number; image_url: string | null;
};
type Order = {
  id: string; order_number: string; status: Status; subtotal: number | null;
  shipping: number | null; total: number; payment_method: string | null;
  txn_id: string | null; payment_phone: string | null; otp: string | null;
  address_snapshot: Record<string, unknown> | null; notes: string | null;
  admin_notes: string | null; created_at: string; updated_at: string | null;
  order_items: OrderItem[];
};

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "Orders — Admin FRAG AVENUE" }] }),
  component: AdminOrders,
});

function AdminOrders() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [otpOrderId, setOtpOrderId] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [viewing, setViewing] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState<Order | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-orders-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, subtotal, shipping, total, payment_method, txn_id, payment_phone, otp, address_snapshot, notes, admin_notes, created_at, updated_at, order_items(id, product_id, product_name, brand_name, size_ml, quantity, unit_price, image_url)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Order[];
    },
  });

  const filtered = useMemo(() => {
    let list = data ?? [];
    if (statusFilter !== "all") list = list.filter((o) => o.status === statusFilter);
    if (paymentFilter !== "all") list = list.filter((o) => (o.payment_method ?? "").toLowerCase() === paymentFilter);
    if (dateFrom) list = list.filter((o) => new Date(o.created_at) >= new Date(dateFrom));
    if (dateTo) list = list.filter((o) => new Date(o.created_at) <= new Date(dateTo + "T23:59:59"));
    if (priceMin) list = list.filter((o) => Number(o.total) >= Number(priceMin));
    if (priceMax) list = list.filter((o) => Number(o.total) <= Number(priceMax));
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter((o) => {
        const addr = (o.address_snapshot ?? {}) as Record<string, string>;
        return [
          o.order_number, o.status, o.payment_method, o.txn_id, o.payment_phone,
          addr.full_name, addr.email, addr.phone, addr.city, addr.line1,
          ...o.order_items.map((it) => it.product_name),
          ...o.order_items.map((it) => it.brand_name ?? ""),
        ].filter(Boolean).some((v) => String(v).toLowerCase().includes(s));
      });
    }
    switch (sortBy) {
      case "oldest": list = [...list].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)); break;
      case "highest": list = [...list].sort((a, b) => Number(b.total) - Number(a.total)); break;
      case "lowest": list = [...list].sort((a, b) => Number(a.total) - Number(b.total)); break;
      default: list = [...list].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    }
    return list;
  }, [data, statusFilter, paymentFilter, dateFrom, dateTo, priceMin, priceMax, search, sortBy]);

  useEffect(() => { setPage(1); }, [search, statusFilter, paymentFilter, dateFrom, dateTo, priceMin, priceMax, sortBy, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageStart = (page - 1) * pageSize;
  const paged = filtered.slice(pageStart, pageStart + pageSize);

  const updateStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Order updated to ${status.replace("_", " ")}`);
    qc.invalidateQueries({ queryKey: ["admin-orders-all"] });
  };

  const generateOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    navigator.clipboard?.writeText(otp).catch(() => {});
    toast.success(`OTP generated: ${otp}`, { description: "Copied to clipboard." });
  };

  const setOtp = async () => {
    if (!otpOrderId.trim()) return toast.error("Enter an Order ID first.");
    if (!generatedOtp) return toast.error("Generate an OTP first.");
    const idOrNumber = otpOrderId.trim();
    const match = (data ?? []).find(
      (o) => o.order_number.toLowerCase() === idOrNumber.toLowerCase() || o.id === idOrNumber,
    );
    if (!match) return toast.error("Order not found.");
    const { error } = await supabase.from("orders").update({ otp: generatedOtp }).eq("id", match.id);
    if (error) return toast.error(error.message);
    toast.success(`OTP set for ${match.order_number}`);
    setOtpOrderId(""); setGeneratedOtp("");
    qc.invalidateQueries({ queryKey: ["admin-orders-all"] });
  };

  const doDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", deleting.id);
    if (error) return toast.error(error.message);
    toast.success(`Order ${deleting.order_number} cancelled`);
    setDeleting(null);
    qc.invalidateQueries({ queryKey: ["admin-orders-all"] });
  };

  const resetFilters = () => {
    setStatusFilter("all"); setPaymentFilter("all"); setDateFrom(""); setDateTo("");
    setPriceMin(""); setPriceMax(""); setSortBy("newest");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Toolbar */}
      <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-xl">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold sm:text-3xl">
              Orders <span className="text-[color:var(--gold)]">({(data ?? []).length})</span>
            </h1>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] disabled:opacity-50"
              aria-label="Refresh orders"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={generateOtp}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[color:var(--gold)] bg-[color:var(--gold)]/10 px-3 py-2 text-xs font-semibold text-[color:var(--gold)] shadow-xl transition hover:bg-[color:var(--gold)] hover:text-[color:var(--gold-foreground)]"
            >
              <KeyRound className="h-3.5 w-3.5" /> Generate OTP
              {generatedOtp && <span className="ml-1 rounded bg-background/60 px-1.5 py-0.5 font-mono text-[11px]">{generatedOtp}</span>}
            </button>
            <input
              value={otpOrderId} onChange={(e) => setOtpOrderId(e.target.value)}
              placeholder="Order ID"
              className="h-9 w-32 rounded-xl border border-border bg-background px-3 text-xs focus:border-[color:var(--gold)] focus:outline-none sm:w-40"
            />
            <button
              onClick={setOtp}
              className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3 py-2 text-xs font-semibold text-background shadow-xl transition hover:bg-[color:var(--gold)] hover:text-[color:var(--gold-foreground)]"
            >
              Set OTP
            </button>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orders…"
                className="h-9 w-full min-w-[180px] rounded-xl border border-border bg-background pl-8 pr-3 text-xs focus:border-[color:var(--gold)] focus:outline-none sm:w-56"
              />
            </div>
            <button
              onClick={() => setShowFilters((s) => !s)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${showFilters ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10 text-[color:var(--gold)]" : "border-border text-foreground hover:border-[color:var(--gold)]"}`}
            >
              <Filter className="h-3.5 w-3.5" /> Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <LabeledSelect label="Status" value={statusFilter} onChange={(v) => setStatusFilter(v as Status | "all")}
              options={[{ v: "all", l: "All statuses" }, ...ALL_STATUSES.map((s) => ({ v: s, l: s.replace("_", " ") }))]} />
            <LabeledSelect label="Payment" value={paymentFilter} onChange={setPaymentFilter}
              options={[{ v: "all", l: "All methods" }, { v: "bkash", l: "Bkash" }, { v: "nagad", l: "Nagad" }, { v: "rocket", l: "Rocket" }, { v: "card", l: "Card" }, { v: "cod", l: "Cash on Delivery" }]} />
            <LabeledSelect label="Sort by" value={sortBy} onChange={(v) => setSortBy(v as typeof sortBy)}
              options={[{ v: "newest", l: "Newest" }, { v: "oldest", l: "Oldest" }, { v: "highest", l: "Highest price" }, { v: "lowest", l: "Lowest price" }]} />
            <div className="grid grid-cols-2 gap-2">
              <LabeledInput label="From" type="date" value={dateFrom} onChange={setDateFrom} />
              <LabeledInput label="To" type="date" value={dateTo} onChange={setDateTo} />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:col-span-2">
              <LabeledInput label="Min ৳" type="number" value={priceMin} onChange={setPriceMin} placeholder="0" />
              <LabeledInput label="Max ৳" type="number" value={priceMax} onChange={setPriceMax} placeholder="∞" />
            </div>
            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-2 lg:justify-end">
              <button onClick={resetFilters} className="rounded-lg border border-border px-4 py-2 text-xs font-semibold hover:border-[color:var(--gold)]">Reset</button>
              <button onClick={() => setShowFilters(false)} className="rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background hover:bg-[color:var(--gold)] hover:text-[color:var(--gold-foreground)]">Apply</button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState onRefresh={() => refetch()} />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="sticky top-0 z-10 bg-secondary/70 backdrop-blur">
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    <Th>Order ID</Th><Th>Customer</Th><Th>Product</Th>
                    <Th className="text-center">Qty</Th><Th>Total</Th><Th>Payment</Th>
                    <Th>Order Date</Th><Th className="text-center">Info</Th>
                    <Th>OTP</Th><Th>Status</Th><Th className="text-center">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((o, i) => {
                    const addr = (o.address_snapshot ?? {}) as Record<string, string>;
                    const firstItem = o.order_items[0];
                    const moreCount = o.order_items.length - 1;
                    const created = new Date(o.created_at);
                    const pm = (o.payment_method ?? "").toLowerCase();
                    return (
                      <tr key={o.id} className={`border-t border-border transition-colors hover:bg-secondary/40 ${i % 2 ? "bg-background" : "bg-card"}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-semibold">{o.order_number}</span>
                            <button onClick={() => { navigator.clipboard?.writeText(o.order_number); toast.success("Order ID copied"); }}
                              className="text-muted-foreground hover:text-[color:var(--gold)]" aria-label="Copy order ID" title="Copy">
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">{addr.full_name || "—"}</div>
                          <div className="text-[11px] text-muted-foreground">{addr.email || addr.phone || ""}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {firstItem?.image_url ? (
                              <SafeImage src={firstItem.image_url} alt={firstItem.product_name}
                                wrapperClassName="h-12 w-12 shrink-0 rounded-md" className="h-12 w-12 rounded-md object-cover" />
                            ) : (
                              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-secondary text-muted-foreground">
                                <PackageX className="h-4 w-4" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="truncate text-xs font-medium">{firstItem?.product_name || "—"}</div>
                              {moreCount > 0 && <div className="text-[10px] text-muted-foreground">+{moreCount} more</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold">{o.order_items.reduce((s, it) => s + it.quantity, 0)}</td>
                        <td className="px-4 py-3 font-bold text-[color:var(--gold)]">{formatBDT(Number(o.total))}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${PAYMENT_STYLES[pm] ?? "bg-secondary text-muted-foreground border-border"}`}>
                            {o.payment_method || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs">{created.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                          <div className="text-[11px] text-muted-foreground">{created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => setViewing(o)} title="View details"
                            className="inline-grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]">
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          {o.otp ? (
                            <span className="rounded-md bg-[color:var(--gold)]/10 px-2 py-1 font-mono text-xs font-bold text-[color:var(--gold)]">{o.otp}</span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value as Status)}
                            className={`w-full min-w-[130px] rounded-lg border px-2 py-1.5 text-[11px] font-semibold uppercase focus:outline-none ${STATUS_STYLES[o.status] ?? ""}`}>
                            {ALL_STATUSES.map((s) => <option key={s} value={s} className="bg-background text-foreground">{s.replace("_", " ")}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setViewing(o)} title="Edit / View"
                              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleting(o)} title="Cancel order"
                              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-600">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-xs sm:flex-row">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">
                Showing <b className="text-foreground">{filtered.length === 0 ? 0 : pageStart + 1}</b>–
                <b className="text-foreground">{Math.min(pageStart + pageSize, filtered.length)}</b> of{" "}
                <b className="text-foreground">{filtered.length}</b>
              </span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-md border border-border bg-background px-2 py-1 focus:border-[color:var(--gold)] focus:outline-none">
                {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 hover:border-[color:var(--gold)] disabled:opacity-40">
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <span className="px-2">Page <b className="text-foreground">{page}</b> / {totalPages}</span>
              <input type="number" min={1} max={totalPages} value={page}
                onChange={(e) => setPage(Math.min(totalPages, Math.max(1, Number(e.target.value) || 1)))}
                className="h-8 w-16 rounded-md border border-border bg-background px-2 text-center focus:border-[color:var(--gold)] focus:outline-none" />
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 hover:border-[color:var(--gold)] disabled:opacity-40">
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </>
      )}

      {viewing && <OrderDetailsModal order={viewing} onClose={() => setViewing(null)} />}
      {deleting && (
        <ConfirmModal
          title="Cancel this order?"
          description={`Order ${deleting.order_number} will be marked as cancelled. This is a soft delete and cannot be undone from this screen.`}
          confirmLabel="Yes, cancel order"
          onConfirm={doDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

/* ---------- helpers ---------- */

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-left font-semibold ${className}`}>{children}</th>;
}

function LabeledSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-border bg-background px-2 text-xs capitalize focus:border-[color:var(--gold)] focus:outline-none">
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}
function LabeledInput({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-border bg-background px-2 text-xs focus:border-[color:var(--gold)] focus:outline-none" />
    </label>
  );
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-t border-border p-4 first:border-t-0">
          <div className="h-12 w-12 shrink-0 animate-pulse rounded-md bg-secondary" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded bg-secondary" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
          </div>
          <div className="h-8 w-24 animate-pulse rounded bg-secondary" />
        </div>
      ))}
    </div>
  );
}
function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-border bg-card py-20 text-center">
      <PackageX className="h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 font-display text-xl">No orders found</h3>
      <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters or search.</p>
      <button onClick={onRefresh} className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--gold)] px-4 py-2 text-xs font-semibold text-[color:var(--gold)] hover:bg-[color:var(--gold)] hover:text-[color:var(--gold-foreground)]">
        <RefreshCw className="h-3.5 w-3.5" /> Refresh
      </button>
    </div>
  );
}
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid place-items-center rounded-xl border border-rose-500/30 bg-rose-500/5 py-16 text-center">
      <h3 className="font-display text-xl text-rose-600">Couldn't load orders</h3>
      <p className="mt-1 text-sm text-muted-foreground">Something went wrong while fetching data.</p>
      <button onClick={onRetry} className="mt-4 rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background hover:bg-[color:var(--gold)] hover:text-[color:var(--gold-foreground)]">
        Retry
      </button>
    </div>
  );
}

/* ---------- Modals ---------- */

function useEscClose(onClose: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [onClose]);
}

function ConfirmModal({ title, description, confirmLabel, onConfirm, onClose }: {
  title: string; description: string; confirmLabel: string; onConfirm: () => void; onClose: () => void;
}) {
  useEscClose(onClose);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 animate-in fade-in" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg font-bold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary">Cancel</button>
          <button onClick={onConfirm} className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function OrderDetailsModal({ order, onClose }: { order: Order; onClose: () => void }) {
  useEscClose(onClose);
  const printRef = useRef<HTMLDivElement>(null);
  const addr = (order.address_snapshot ?? {}) as Record<string, string>;
  const created = new Date(order.created_at);
  const subtotal = Number(order.subtotal ?? order.order_items.reduce((s, it) => s + Number(it.unit_price) * it.quantity, 0));
  const shipping = Number(order.shipping ?? 0);
  const total = Number(order.total);

  const doPrint = () => {
    const html = printRef.current?.innerHTML ?? "";
    const w = window.open("", "_blank", "width=900,height=1000");
    if (!w) return;
    w.document.write(`<html><head><title>Invoice ${order.order_number}</title>
      <style>body{font-family:system-ui,sans-serif;padding:24px;color:#111}
      h1,h2,h3{margin:0 0 8px} table{width:100%;border-collapse:collapse;margin-top:8px}
      th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px}
      th{background:#f7f7f7} .gold{color:#b8860b}</style></head><body>${html}</body></html>`);
    w.document.close(); w.focus(); w.print();
  };
  const doDownload = () => {
    const blob = new Blob([`<html><body>${printRef.current?.innerHTML ?? ""}</body></html>`], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `invoice-${order.order_number}.html`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 animate-in fade-in" onClick={onClose}>
      <div className="my-8 w-full max-w-4xl rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-display text-xl font-bold">Order Details</h2>
            <p className="text-xs text-muted-foreground">Order <span className="font-mono font-semibold text-[color:var(--gold)]">#{order.order_number}</span></p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div ref={printRef} className="max-h-[calc(100vh-220px)] space-y-6 overflow-y-auto p-5">
          <Section title="Order Information">
            <KV rows={[
              ["Order ID", order.order_number],
              ["Order Date", created.toLocaleDateString()],
              ["Order Time", created.toLocaleTimeString()],
              ["Order Status", order.status.replace("_", " ")],
              ["Payment Method", order.payment_method ?? "—"],
              ["Transaction ID", order.txn_id ?? "—"],
              ["OTP", order.otp ?? "—"],
              ["Payment Phone", order.payment_phone ?? "—"],
              ["Subtotal", formatBDT(subtotal)],
              ["Delivery Charge", formatBDT(shipping)],
              ["Grand Total", formatBDT(total)],
            ]} />
          </Section>

          <Section title="Customer Information">
            <KV rows={[
              ["Customer Name", addr.full_name ?? "—"],
              ["Email", addr.email ?? "—"],
              ["Phone", addr.phone ?? "—"],
              ["Address", addr.line1 ?? "—"],
              ["City", addr.city ?? "—"],
              ["Area", addr.area ?? "—"],
              ["Postal Code", addr.postal_code ?? "—"],
            ]} />
          </Section>

          <Section title="Products">
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-3 text-left">Image</th>
                    <th className="p-3 text-left">Product</th>
                    <th className="p-3 text-left">Brand</th>
                    <th className="p-3 text-left">Size</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.order_items.map((it) => (
                    <tr key={it.id} className="border-t border-border">
                      <td className="p-3">
                        {it.image_url ? (
                          <SafeImage src={it.image_url} alt={it.product_name}
                            wrapperClassName="h-12 w-12 rounded-md" className="h-12 w-12 rounded-md object-cover" />
                        ) : <div className="h-12 w-12 rounded-md bg-secondary" />}
                      </td>
                      <td className="p-3 text-xs font-medium">{it.product_name}</td>
                      <td className="p-3 text-xs text-muted-foreground">{it.brand_name || "—"}</td>
                      <td className="p-3 text-xs">{it.size_ml ? `${it.size_ml} ml` : "—"}</td>
                      <td className="p-3 text-center text-xs">{it.quantity}</td>
                      <td className="p-3 text-right text-xs">{formatBDT(Number(it.unit_price))}</td>
                      <td className="p-3 text-right text-xs font-bold text-[color:var(--gold)]">{formatBDT(Number(it.unit_price) * it.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Shipping Timeline">
            <ShippingTimeline status={order.status} createdAt={order.created_at} />
          </Section>

          <Section title="Customer Note">
            <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
              {order.notes || "No Note"}
            </p>
          </Section>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border p-4">
          <button onClick={doPrint} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-semibold hover:border-[color:var(--gold)]">
            <Printer className="h-4 w-4" /> Print Invoice
          </button>
          <button onClick={doDownload} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-semibold hover:border-[color:var(--gold)]">
            <Download className="h-4 w-4" /> Download
          </button>
          <button onClick={onClose} className="rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background hover:bg-[color:var(--gold)] hover:text-[color:var(--gold-foreground)]">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-wider text-[color:var(--gold)]">{title}</h3>
      {children}
    </section>
  );
}
function KV({ rows }: { rows: [string, string][] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([k, v], i) => (
            <tr key={k} className={i % 2 ? "bg-secondary/40" : ""}>
              <td className="w-1/3 border-b border-border p-2.5 text-xs font-semibold text-muted-foreground">{k}</td>
              <td className="border-b border-border p-2.5 text-xs capitalize">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ShippingTimeline({ status, createdAt }: { status: Status; createdAt: string }) {
  const steps = [
    { key: "pending", label: "Placed", icon: Clock },
    { key: "confirmed", label: "Confirmed", icon: Check },
    { key: "processing", label: "Packed", icon: Package },
    { key: "in_progress", label: "Out for Delivery", icon: Sparkles },
    { key: "shipped", label: "Shipped", icon: Truck },
    { key: "delivered", label: "Delivered", icon: Check },
  ];
  const currentIdx = steps.findIndex((s) => s.key === status);
  const cancelled = status === "cancelled";
  if (cancelled) {
    return <p className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-rose-600">This order was cancelled.</p>;
  }
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 right-0 top-4 h-px bg-border" />
        <div className="absolute left-0 top-4 h-px bg-[color:var(--gold)] transition-all"
          style={{ width: `${currentIdx >= 0 ? (currentIdx / (steps.length - 1)) * 100 : 0}%` }} />
        {steps.map((s, i) => {
          const done = currentIdx >= i;
          const Icon = s.icon;
          return (
            <div key={s.key} className="relative z-10 flex flex-col items-center gap-1">
              <div className={`grid h-8 w-8 place-items-center rounded-full border-2 ${done ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-[color:var(--gold-foreground)]" : "border-border bg-card text-muted-foreground"}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span className={`text-[9px] uppercase tracking-wider ${done ? "text-[color:var(--gold)]" : "text-muted-foreground"}`}>{s.label}</span>
              {i === 0 && <span className="text-[9px] text-muted-foreground">{new Date(createdAt).toLocaleDateString()}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
