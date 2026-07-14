import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Ticket, Plus, Edit3, Trash2, Copy, Search, RefreshCw, X, Percent, DollarSign,
  Calendar, Check, PowerOff, Power,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/format";

export const Route = createFileRoute("/admin/coupons")({
  head: () => ({ meta: [{ title: "Coupons — Admin FRAG AVENUE" }] }),
  component: AdminCoupons,
});

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order: number;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

type FormState = {
  id?: string;
  code: string;
  description: string;
  discount_type: "percent" | "fixed";
  discount_value: string;
  min_order: string;
  max_discount: string;
  usage_limit: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  code: "",
  description: "",
  discount_type: "percent",
  discount_value: "10",
  min_order: "0",
  max_discount: "",
  usage_limit: "",
  starts_at: "",
  expires_at: "",
  is_active: true,
};

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isExpired(c: Coupon) {
  return c.expires_at ? new Date(c.expires_at).getTime() < Date.now() : false;
}
function isScheduled(c: Coupon) {
  return c.starts_at ? new Date(c.starts_at).getTime() > Date.now() : false;
}
function couponBadge(c: Coupon): { label: string; cls: string } {
  if (!c.is_active) return { label: "Disabled", cls: "bg-secondary text-muted-foreground border-border" };
  if (isExpired(c)) return { label: "Expired", cls: "bg-rose-500/10 text-rose-600 border-rose-500/30" };
  if (isScheduled(c)) return { label: "Scheduled", cls: "bg-amber-500/10 text-amber-600 border-amber-500/30" };
  if (c.usage_limit && c.usage_count >= c.usage_limit) return { label: "Used up", cls: "bg-slate-500/10 text-slate-600 border-slate-500/30" };
  return { label: "Active", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" };
}

function AdminCoupons() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired" | "scheduled" | "disabled">("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Coupon | null>(null);

  const q = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Coupon[];
    },
  });

  const rows = useMemo(() => {
    let list = q.data ?? [];
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter((c) => c.code.toLowerCase().includes(s) || (c.description ?? "").toLowerCase().includes(s));
    }
    if (statusFilter !== "all") {
      list = list.filter((c) => {
        if (statusFilter === "disabled") return !c.is_active;
        if (statusFilter === "expired") return isExpired(c);
        if (statusFilter === "scheduled") return c.is_active && isScheduled(c);
        return c.is_active && !isExpired(c) && !isScheduled(c);
      });
    }
    return list;
  }, [q.data, search, statusFilter]);

  const stats = useMemo(() => {
    const list = q.data ?? [];
    return {
      total: list.length,
      active: list.filter((c) => c.is_active && !isExpired(c) && !isScheduled(c)).length,
      expired: list.filter((c) => isExpired(c)).length,
      used: list.reduce((s, c) => s + (c.usage_count ?? 0), 0),
    };
  }, [q.data]);



  const openNew = () => { setForm(emptyForm); setShowForm(true); };
  const openEdit = (c: Coupon) => {
    setForm({
      id: c.id,
      code: c.code,
      description: c.description ?? "",
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      min_order: String(c.min_order ?? 0),
      max_discount: c.max_discount != null ? String(c.max_discount) : "",
      usage_limit: c.usage_limit != null ? String(c.usage_limit) : "",
      starts_at: toLocalInput(c.starts_at),
      expires_at: toLocalInput(c.expires_at),
      is_active: c.is_active,
    });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    if (!code) return toast.error("Coupon code is required.");
    const value = Number(form.discount_value);
    if (!Number.isFinite(value) || value <= 0) return toast.error("Discount value must be greater than 0.");
    if (form.discount_type === "percent" && value > 100) return toast.error("Percent discount cannot exceed 100.");
    if (form.starts_at && form.expires_at && new Date(form.starts_at) >= new Date(form.expires_at))
      return toast.error("Expiry date must be after start date.");

    const payload = {
      code,
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: value,
      min_order: Number(form.min_order || 0),
      max_discount: form.max_discount ? Number(form.max_discount) : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active: form.is_active,
    };

    setSaving(true);
    try {
      if (form.id) {
        const { error } = await supabase.from("coupons").update(payload).eq("id", form.id);
        if (error) throw error;
        toast.success(`Coupon ${code} updated`);
      } else {
        const { error } = await supabase.from("coupons").insert(payload);
        if (error) throw error;
        toast.success(`Coupon ${code} created`);
      }
      setShowForm(false); setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Coupon) => {
    const { error } = await supabase.from("coupons").update({ is_active: !c.is_active }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(`Coupon ${!c.is_active ? "enabled" : "disabled"}`);
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  };

  const expireNow = async (c: Coupon) => {
    const { error } = await supabase.from("coupons").update({ expires_at: new Date().toISOString() }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(`Coupon ${c.code} expired`);
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  };

  const doDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from("coupons").delete().eq("id", deleting.id);
    if (error) return toast.error(error.message);
    toast.success(`Coupon ${deleting.code} deleted`);
    setDeleting(null);
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  };

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    toast.success(`${code} copied`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, icon: Ticket, tone: "text-foreground" },
          { label: "Active", value: stats.active, icon: Check, tone: "text-emerald-600" },
          { label: "Expired", value: stats.expired, icon: Calendar, tone: "text-rose-600" },
          { label: "Redemptions", value: stats.used, icon: Percent, tone: "text-[color:var(--gold)]" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="admin-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <Icon className={`h-4 w-4 ${s.tone}`} />
              </div>
              <div className={`mt-2 font-display text-2xl font-bold sm:text-3xl ${s.tone}`}>{s.value}</div>
            </div>
          );
        })}
      </div>


      <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-xl sm:p-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold sm:text-3xl">
              Coupons <span className="text-[color:var(--gold)]">({(q.data ?? []).length})</span>
            </h1>
            <button
              onClick={() => q.refetch()}
              disabled={q.isFetching}
              className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] disabled:opacity-50"
              aria-label="Refresh"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${q.isFetching ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={openNew}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[color:var(--gold)] px-4 py-2 text-xs font-semibold text-[color:var(--gold-foreground)] shadow-xl transition hover:scale-[1.02]"
            >
              <Plus className="h-3.5 w-3.5" /> New Coupon
            </button>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search code or description…"
                className="h-9 w-full min-w-[200px] rounded-xl border border-border bg-background pl-8 pr-3 text-xs focus:border-[color:var(--gold)] focus:outline-none sm:w-64"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="h-9 rounded-xl border border-border bg-background px-3 text-xs focus:border-[color:var(--gold)] focus:outline-none"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="expired">Expired</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>
      </div>

      {q.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-card shadow-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-border bg-card p-10 text-center shadow-xl">
          <Ticket className="h-10 w-10 text-[color:var(--gold)]" />
          <h3 className="mt-3 font-display text-xl">No coupons yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Create your first discount code to reward customers.</p>
          <button onClick={openNew} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[color:var(--gold)] px-4 py-2 text-xs font-semibold text-[color:var(--gold-foreground)] shadow-xl">
            <Plus className="h-3.5 w-3.5" /> New Coupon
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => {
            const badge = couponBadge(c);
            const pct = c.usage_limit ? Math.min(100, Math.round((c.usage_count / c.usage_limit) * 100)) : null;
            return (
              <div key={c.id} className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-xl transition hover:border-[color:var(--gold)]/40 hover:shadow-2xl">
                <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" aria-hidden />
                <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" aria-hidden />

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-[color:var(--gold)]/10 p-1.5 text-[color:var(--gold)]">
                        {c.discount_type === "percent" ? <Percent className="h-3.5 w-3.5" /> : <DollarSign className="h-3.5 w-3.5" />}
                      </span>
                      <span className="font-mono text-lg font-bold tracking-wider">{c.code}</span>
                      <button onClick={() => copyCode(c.code)} className="text-muted-foreground hover:text-[color:var(--gold)]" aria-label="Copy code" title="Copy">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {c.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>}
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${badge.cls}`}>{badge.label}</span>
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold text-[color:var(--gold)]">
                    {c.discount_type === "percent" ? `${c.discount_value}%` : formatBDT(Number(c.discount_value))}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Off</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <div>
                    <div className="uppercase tracking-wider">Min order</div>
                    <div className="font-medium text-foreground">{formatBDT(Number(c.min_order))}</div>
                  </div>
                  {c.max_discount != null && (
                    <div>
                      <div className="uppercase tracking-wider">Max discount</div>
                      <div className="font-medium text-foreground">{formatBDT(Number(c.max_discount))}</div>
                    </div>
                  )}
                  {c.starts_at && (
                    <div>
                      <div className="uppercase tracking-wider">Starts</div>
                      <div className="font-medium text-foreground">{new Date(c.starts_at).toLocaleDateString()}</div>
                    </div>
                  )}
                  {c.expires_at && (
                    <div>
                      <div className="flex items-center gap-1 uppercase tracking-wider"><Calendar className="h-3 w-3" /> Expires</div>
                      <div className="font-medium text-foreground">{new Date(c.expires_at).toLocaleDateString()}</div>
                    </div>
                  )}
                </div>

                {pct !== null && (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                      <span>Usage</span>
                      <span>{c.usage_count} / {c.usage_limit}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-[color:var(--gold)] transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  <button onClick={() => openEdit(c)} className="inline-flex items-center gap-1 rounded-xl border border-border px-2.5 py-1.5 text-[11px] font-semibold shadow-sm transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]">
                    <Edit3 className="h-3 w-3" /> Edit
                  </button>
                  <button onClick={() => toggleActive(c)} className="inline-flex items-center gap-1 rounded-xl border border-border px-2.5 py-1.5 text-[11px] font-semibold shadow-sm transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]">
                    {c.is_active ? <><PowerOff className="h-3 w-3" /> Disable</> : <><Power className="h-3 w-3" /> Enable</>}
                  </button>
                  {!isExpired(c) && (
                    <button onClick={() => expireNow(c)} className="inline-flex items-center gap-1 rounded-xl border border-amber-500/40 px-2.5 py-1.5 text-[11px] font-semibold text-amber-600 shadow-sm transition hover:bg-amber-500/10">
                      <Calendar className="h-3 w-3" /> Expire now
                    </button>
                  )}
                  <button onClick={() => setDeleting(c)} className="ml-auto inline-flex items-center gap-1 rounded-xl border border-destructive/40 px-2.5 py-1.5 text-[11px] font-semibold text-destructive shadow-sm transition hover:bg-destructive/10">
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm" onClick={() => !saving && setShowForm(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border p-5">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-[color:var(--gold)]" />
                <h2 className="font-display text-xl font-bold">{form.id ? "Edit Coupon" : "New Coupon"}</h2>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
              <Field label="Coupon code *">
                <div className="flex gap-2">
                  <input
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="SUMMER20"
                    className="h-10 flex-1 rounded-xl border border-border bg-background px-3 font-mono text-sm uppercase tracking-wider focus:border-[color:var(--gold)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, code: Math.random().toString(36).slice(2, 10).toUpperCase() })}
                    className="rounded-xl border border-border px-3 text-xs font-semibold hover:border-[color:var(--gold)]"
                  >
                    Random
                  </button>
                </div>
              </Field>
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="e.g. Summer sale 20% off"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-[color:var(--gold)] focus:outline-none"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Discount type">
                  <div className="grid grid-cols-2 gap-1 rounded-xl border border-border p-1">
                    {(["percent", "fixed"] as const).map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setForm({ ...form, discount_type: t })}
                        className={`rounded-lg py-1.5 text-xs font-semibold capitalize transition ${form.discount_type === t ? "bg-[color:var(--gold)] text-[color:var(--gold-foreground)] shadow" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {t === "percent" ? "% Percent" : "৳ Fixed"}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label={`Discount value *${form.discount_type === "percent" ? " (%)" : " (৳)"}`}>
                  <input
                    required type="number" min="0" step="0.01"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:border-[color:var(--gold)] focus:outline-none"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Minimum order (৳)">
                  <input
                    type="number" min="0" step="0.01"
                    value={form.min_order}
                    onChange={(e) => setForm({ ...form, min_order: e.target.value })}
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:border-[color:var(--gold)] focus:outline-none"
                  />
                </Field>
                <Field label="Max discount (৳)">
                  <input
                    type="number" min="0" step="0.01"
                    value={form.max_discount}
                    onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
                    placeholder="Optional"
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:border-[color:var(--gold)] focus:outline-none"
                  />
                </Field>
              </div>
              <Field label="Usage limit (total)">
                <input
                  type="number" min="1" step="1"
                  value={form.usage_limit}
                  onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                  placeholder="Unlimited"
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:border-[color:var(--gold)] focus:outline-none"
                />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Starts at">
                  <input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:border-[color:var(--gold)] focus:outline-none"
                  />
                </Field>
                <Field label="Expires at">
                  <input
                    type="datetime-local"
                    value={form.expires_at}
                    onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:border-[color:var(--gold)] focus:outline-none"
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="h-4 w-4 accent-[color:var(--gold)]"
                />
                <span className="text-sm font-medium">Active</span>
                <span className="ml-auto text-[11px] text-muted-foreground">Customers can apply this coupon</span>
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border bg-secondary/40 p-4">
              <button
                type="button" onClick={() => setShowForm(false)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:border-[color:var(--gold)]"
              >
                Cancel
              </button>
              <button
                type="submit" disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[color:var(--gold)] px-4 py-2 text-xs font-semibold text-[color:var(--gold-foreground)] shadow-xl transition hover:scale-[1.02] disabled:opacity-60"
              >
                <Check className="h-3.5 w-3.5" /> {saving ? "Saving…" : form.id ? "Save changes" : "Create coupon"}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm" onClick={() => setDeleting(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-destructive/10 text-destructive">
                <Trash2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold">Delete coupon</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            <p className="mt-4 rounded-xl bg-secondary p-3 font-mono text-sm">{deleting.code}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setDeleting(null)} className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:border-[color:var(--gold)]">Cancel</button>
              <button onClick={doDelete} className="rounded-xl bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground shadow-xl hover:opacity-90">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
