import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Truck, Save, Search, Plus, Trash2, X, Package, Gift, RefreshCw, ShieldCheck, Pencil,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/format";
import { SafeImage } from "@/components/SafeImage";

export const Route = createFileRoute("/admin/charge")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Delivery Charges — Admin FRAG AVENUE" }] }),
  component: AdminCharge,
});

type Settings = {
  id: string;
  default_charge: number;
  free_over_threshold: number;
  is_free_globally: boolean;
};

type Override = {
  id: string;
  product_id: string;
  charge: number;
  is_free: boolean;
  updated_at: string;
  products: { id: string; name: string; slug: string; image_url: string | null; brand_id: string | null } | null;
};

type ProductLite = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
};

function AdminCharge() {
  const qc = useQueryClient();

  /* ---------------- Global settings ---------------- */
  const settingsQ = useQuery({
    queryKey: ["delivery_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_settings" as never)
        .select("id, default_charge, free_over_threshold, is_free_globally")
        .eq("id", "global")
        .maybeSingle();
      if (error) throw error;
      return (data as Settings | null) ?? {
        id: "global", default_charge: 120, free_over_threshold: 5000, is_free_globally: false,
      };
    },
  });

  const [defCharge, setDefCharge] = useState<string>("");
  const [freeOver, setFreeOver] = useState<string>("");
  const [allFree, setAllFree] = useState<boolean>(false);
  const [savingGlobal, setSavingGlobal] = useState(false);

  // Sync form to data when it loads
  const settings = settingsQ.data;
  useMemo(() => {
    if (settings) {
      setDefCharge(String(settings.default_charge));
      setFreeOver(String(settings.free_over_threshold));
      setAllFree(!!settings.is_free_globally);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.id]);

  const saveGlobal = async () => {
    const dc = Number(defCharge);
    const fo = Number(freeOver);
    if (!Number.isFinite(dc) || dc < 0) return toast.error("Default charge must be 0 or more");
    if (!Number.isFinite(fo) || fo < 0) return toast.error("Free-over threshold must be 0 or more");
    setSavingGlobal(true);
    const { error } = await supabase
      .from("delivery_settings" as never)
      .upsert({
        id: "global",
        default_charge: dc,
        free_over_threshold: fo,
        is_free_globally: allFree,
      } as never, { onConflict: "id" });
    setSavingGlobal(false);
    if (error) return toast.error(error.message);
    toast.success("Global delivery settings saved");
    qc.invalidateQueries({ queryKey: ["delivery_settings"] });
  };

  /* ---------------- Product overrides ---------------- */
  const overridesQ = useQuery({
    queryKey: ["product_delivery_charges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_delivery_charges" as never)
        .select("id, product_id, charge, is_free, updated_at, products(id, name, slug, image_url, brand_id)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Override[];
    },
  });

  const [overrideSearch, setOverrideSearch] = useState("");
  const filteredOverrides = useMemo(() => {
    const list = overridesQ.data ?? [];
    const s = overrideSearch.trim().toLowerCase();
    if (!s) return list;
    return list.filter((o) => {
      const name = (o.products?.name ?? "").toLowerCase();
      const slug = (o.products?.slug ?? "").toLowerCase();
      return name.includes(s) || slug.includes(s);
    });
  }, [overridesQ.data, overrideSearch]);


  const updateOverride = async (id: string, patch: Partial<Pick<Override, "charge" | "is_free">>) => {
    const { error } = await supabase.from("product_delivery_charges" as never).update(patch as never).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["product_delivery_charges"] });
  };

  const deleteOverride = async (id: string) => {
    if (!confirm("Remove this override? Product will use the global charge.")) return;
    const { error } = await supabase.from("product_delivery_charges" as never).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Override removed");
    qc.invalidateQueries({ queryKey: ["product_delivery_charges"] });
  };

  /* ---------------- Edit override modal ---------------- */
  const [editing, setEditing] = useState<Override | null>(null);
  const [editCharge, setEditCharge] = useState<string>("0");
  const [editFree, setEditFree] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const openEdit = (o: Override) => {
    setEditing(o);
    setEditCharge(String(o.charge ?? 0));
    setEditFree(!!o.is_free);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const c = Number(editCharge);
    if (!editFree && (!Number.isFinite(c) || c < 0)) return toast.error("Charge must be 0 or more");
    setEditSaving(true);
    const { error } = await supabase
      .from("product_delivery_charges" as never)
      .update({ charge: editFree ? 0 : c, is_free: editFree } as never)
      .eq("id", editing.id);
    setEditSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Override updated");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["product_delivery_charges"] });
  };


  /* ---------------- Add override modal ---------------- */
  const [addOpen, setAddOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductLite | null>(null);
  const [newCharge, setNewCharge] = useState<string>("0");
  const [newFree, setNewFree] = useState(false);
  const [saving, setSaving] = useState(false);

  const productsQ = useQuery({
    queryKey: ["admin-products-lite", productSearch],
    enabled: addOpen,
    queryFn: async () => {
      const q = supabase
        .from("products")
        .select("id, name, slug, image_url")
        .order("name", { ascending: true })
        .limit(30);
      const s = productSearch.trim();
      const { data, error } = s
        ? await q.ilike("name", `%${s}%`)
        : await q;
      if (error) throw error;
      return (data ?? []) as unknown as ProductLite[];
    },
  });

  // Products that already have an override — hide from picker
  const alreadyOverridden = useMemo(
    () => new Set((overridesQ.data ?? []).map((o) => o.product_id)),
    [overridesQ.data],
  );
  const pickable = (productsQ.data ?? []).filter((p) => !alreadyOverridden.has(p.id));

  const resetAddForm = () => {
    setSelectedProduct(null); setProductSearch(""); setNewCharge("0"); setNewFree(false);
  };

  const saveOverride = async () => {
    if (!selectedProduct) return toast.error("Pick a product first");
    const c = Number(newCharge);
    if (!newFree && (!Number.isFinite(c) || c < 0)) return toast.error("Charge must be 0 or more");
    setSaving(true);
    const { error } = await supabase.from("product_delivery_charges" as never).insert({
      product_id: selectedProduct.id,
      charge: newFree ? 0 : c,
      is_free: newFree,
    } as never);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Delivery charge set for ${selectedProduct.name}`);
    setAddOpen(false);
    resetAddForm();
    qc.invalidateQueries({ queryKey: ["product_delivery_charges"] });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
            <Truck className="h-6 w-6 text-[color:var(--gold)]" /> Delivery Charges
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure a global charge and set per-product overrides. Highest applicable per-item charge is used per order.
          </p>
        </div>
        <button
          onClick={() => { settingsQ.refetch(); overridesQ.refetch(); }}
          className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
          aria-label="Refresh" title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${settingsQ.isFetching || overridesQ.isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Global settings card */}
      <section className="mb-8 rounded-xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[color:var(--gold)]/10 text-[color:var(--gold)]">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold">Global Delivery Settings</h2>
            <p className="text-xs text-muted-foreground">Applies to every product that has no override.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField
            label="Default Charge (৳)"
            value={defCharge}
            onChange={setDefCharge}
            disabled={allFree}
            hint="Applied when subtotal is below the free threshold."
          />
          <NumberField
            label="Free When Subtotal ≥ (৳)"
            value={freeOver}
            onChange={setFreeOver}
            disabled={allFree}
            hint="Set 0 to disable free-shipping threshold."
          />
          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted-foreground">Make All Deliveries Free</label>
            <button
              type="button"
              onClick={() => setAllFree((v) => !v)}
              className={`flex h-11 w-full items-center justify-between rounded-sm border px-3 text-sm transition ${allFree ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10 text-[color:var(--gold)]" : "border-border hover:border-[color:var(--gold)]/50"}`}
            >
              <span className="flex items-center gap-2"><Gift className="h-4 w-4" /> {allFree ? "Enabled — everything ships free" : "Disabled — charges apply"}</span>
              <span className={`inline-block h-5 w-9 rounded-full transition-colors ${allFree ? "bg-[color:var(--gold)]" : "bg-border"}`}>
                <span className={`block h-5 w-5 rounded-full bg-background shadow transition-transform ${allFree ? "translate-x-4" : ""}`} />
              </span>
            </button>
            <p className="mt-1 text-[11px] text-muted-foreground">Overrides everything below. Turn off to re-enable charges.</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 rounded-sm border border-dashed border-border p-3">
          <p className="text-xs text-muted-foreground">
            Preview: {allFree
              ? <span className="font-semibold text-emerald-600">All orders ship free</span>
              : (
                <>Under ৳ {Number(freeOver || 0).toLocaleString()} → <b className="text-[color:var(--gold)]">{formatBDT(Number(defCharge || 0))}</b>, otherwise <b className="text-emerald-600">Free</b></>
              )}
          </p>
          <button
            onClick={saveGlobal}
            disabled={savingGlobal || settingsQ.isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background transition hover:bg-[color:var(--gold)] hover:text-[color:var(--gold-foreground)] disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" /> {savingGlobal ? "Saving…" : "Save Global Settings"}
          </button>
        </div>
      </section>

      {/* Overrides */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <Package className="h-4 w-4 text-[color:var(--gold)]" /> Per-Product Overrides
              <span className="text-sm font-normal text-muted-foreground">({(overridesQ.data ?? []).length})</span>
            </h2>
            <p className="text-xs text-muted-foreground">Set a custom charge (or make it free) for a specific product.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={overrideSearch}
                onChange={(e) => setOverrideSearch(e.target.value)}
                placeholder="Search product name…"
                className="h-9 w-56 rounded-lg border border-border bg-background pl-8 pr-3 text-xs focus:border-[color:var(--gold)] focus:outline-none"
              />
            </div>
            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--gold)] px-3 py-2 text-xs font-semibold text-[color:var(--gold-foreground)] transition hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" /> Add Override
            </button>
          </div>
        </div>

        {overridesQ.isLoading ? (
          <div className="grid place-items-center py-16 text-sm text-muted-foreground">Loading overrides…</div>
        ) : filteredOverrides.length === 0 ? (
          <div className="grid place-items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
            <Package className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No product overrides yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">All products use the global charge above. Click Add Override to customise a specific product.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredOverrides.map((o) => (
              <article
                key={o.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-background/60 shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--gold)]/60 hover:shadow-xl"
              >
                <div className="flex items-start gap-3 p-4">
                  {o.products?.image_url ? (
                    <SafeImage
                      src={o.products.image_url}
                      alt={o.products?.name ?? ""}
                      wrapperClassName="h-16 w-16 shrink-0 rounded-lg"
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                      <Package className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${o.is_free ? "bg-emerald-500" : "bg-[color:var(--gold)]"}`} />
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                        {o.is_free ? "Free delivery" : "Custom charge"}
                      </span>
                    </div>
                    <h3 className="mt-1 truncate font-display text-sm font-bold leading-snug">
                      {o.products?.name ?? "Unknown product"}
                    </h3>
                    <p className="truncate text-[10px] text-muted-foreground">{o.products?.slug ?? "—"}</p>
                  </div>
                </div>

                <div className="mx-4 flex items-end justify-between rounded-lg border border-dashed border-border bg-secondary/30 px-3 py-2.5">
                  <div>
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Delivery</div>
                    <div className={`font-display text-xl font-bold ${o.is_free ? "text-emerald-600" : "text-[color:var(--gold)]"}`}>
                      {o.is_free ? "FREE" : formatBDT(o.charge)}
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-muted-foreground">
                    Updated<br />
                    {new Date(o.updated_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-border bg-card/40 p-3">
                  <button
                    onClick={() => openEdit(o)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-[11px] font-semibold transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => updateOverride(o.id, { is_free: !o.is_free })}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-semibold transition ${o.is_free ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "border-border hover:border-emerald-500/50 hover:text-emerald-600"}`}
                    title="Toggle free delivery"
                  >
                    <Gift className="h-3.5 w-3.5" /> {o.is_free ? "Free" : "Set Free"}
                  </button>
                  <button
                    onClick={() => deleteOverride(o.id)}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-600"
                    aria-label="Remove override"
                    title="Remove override"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Edit override modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 animate-in fade-in" onClick={() => setEditing(null)}>
          <div className="my-8 w-full max-w-md rounded-lg border border-border bg-card shadow-xl animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <h3 className="font-display text-lg font-bold">Edit Override</h3>
                <p className="text-xs text-muted-foreground">Update delivery charge for this product.</p>
              </div>
              <button onClick={() => setEditing(null)} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-3">
                {editing.products?.image_url ? (
                  <SafeImage src={editing.products.image_url} alt={editing.products?.name ?? ""}
                    wrapperClassName="h-11 w-11 rounded-md" className="h-11 w-11 rounded-md object-cover" />
                ) : <div className="grid h-11 w-11 place-items-center rounded-md bg-secondary"><Package className="h-4 w-4" /></div>}
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{editing.products?.name ?? "—"}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{editing.products?.slug}</div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted-foreground">Charge (৳)</label>
                  <input
                    type="number" min={0} step={1}
                    value={editCharge}
                    disabled={editFree}
                    onChange={(e) => setEditCharge(e.target.value)}
                    className="h-11 w-full rounded-sm border border-border bg-background px-3 text-sm focus:border-[color:var(--gold)] focus:outline-none disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted-foreground">Free Delivery</label>
                  <button
                    type="button"
                    onClick={() => setEditFree((v) => !v)}
                    className={`flex h-11 w-full items-center justify-between rounded-sm border px-3 text-sm transition ${editFree ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "border-border"}`}
                  >
                    <span className="flex items-center gap-2"><Gift className="h-4 w-4" /> {editFree ? "Free" : "Charge applies"}</span>
                    <span className={`inline-block h-5 w-9 rounded-full transition-colors ${editFree ? "bg-emerald-500" : "bg-border"}`}>
                      <span className={`block h-5 w-5 rounded-full bg-background shadow transition-transform ${editFree ? "translate-x-4" : ""}`} />
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border p-4">
              <button
                onClick={() => { if (editing) { deleteOverride(editing.id); setEditing(null); } }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => setEditing(null)} className="rounded-lg border border-border px-4 py-2 text-xs font-semibold hover:border-[color:var(--gold)]">
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={editSaving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--gold)] px-4 py-2 text-xs font-semibold text-[color:var(--gold-foreground)] hover:opacity-90 disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" /> {editSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Add override modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 animate-in fade-in" onClick={() => { setAddOpen(false); resetAddForm(); }}>
          <div className="my-8 w-full max-w-lg rounded-lg border border-border bg-card shadow-xl animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <h3 className="font-display text-lg font-bold">Add Product Override</h3>
                <p className="text-xs text-muted-foreground">Search by product name and set a custom charge.</p>
              </div>
              <button onClick={() => { setAddOpen(false); resetAddForm(); }} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              {selectedProduct ? (
                <div className="flex items-center justify-between rounded-lg border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/5 p-3">
                  <div className="flex items-center gap-3">
                    {selectedProduct.image_url ? (
                      <SafeImage src={selectedProduct.image_url} alt={selectedProduct.name}
                        wrapperClassName="h-10 w-10 rounded-md" className="h-10 w-10 rounded-md object-cover" />
                    ) : <div className="grid h-10 w-10 place-items-center rounded-md bg-secondary"><Package className="h-4 w-4" /></div>}
                    <div>
                      <div className="text-sm font-semibold">{selectedProduct.name}</div>
                      <div className="text-[11px] text-muted-foreground">{selectedProduct.slug}</div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedProduct(null)} className="text-xs text-muted-foreground hover:text-destructive">Change</button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      autoFocus
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Type product name…"
                      className="h-11 w-full rounded-sm border border-border bg-background pl-10 pr-3 text-sm focus:border-[color:var(--gold)] focus:outline-none"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto rounded-md border border-border">
                    {productsQ.isLoading ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">Searching…</div>
                    ) : pickable.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        {productSearch ? "No matching product without an override" : "Start typing to search"}
                      </div>
                    ) : pickable.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedProduct(p)}
                        className="flex w-full items-center gap-3 border-b border-border p-2.5 text-left last:border-0 hover:bg-secondary/50"
                      >
                        {p.image_url ? (
                          <SafeImage src={p.image_url} alt={p.name}
                            wrapperClassName="h-9 w-9 rounded-md" className="h-9 w-9 rounded-md object-cover" />
                        ) : <div className="grid h-9 w-9 place-items-center rounded-md bg-secondary"><Package className="h-4 w-4" /></div>}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-medium">{p.name}</div>
                          <div className="truncate text-[10px] text-muted-foreground">{p.slug}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted-foreground">Charge (৳)</label>
                  <input
                    type="number" min={0} step={1}
                    value={newCharge}
                    disabled={newFree}
                    onChange={(e) => setNewCharge(e.target.value)}
                    className="h-11 w-full rounded-sm border border-border bg-background px-3 text-sm focus:border-[color:var(--gold)] focus:outline-none disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted-foreground">Free Delivery</label>
                  <button
                    type="button"
                    onClick={() => setNewFree((v) => !v)}
                    className={`flex h-11 w-full items-center justify-between rounded-sm border px-3 text-sm transition ${newFree ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "border-border"}`}
                  >
                    <span className="flex items-center gap-2"><Gift className="h-4 w-4" /> {newFree ? "Free" : "Charge applies"}</span>
                    <span className={`inline-block h-5 w-9 rounded-full transition-colors ${newFree ? "bg-emerald-500" : "bg-border"}`}>
                      <span className={`block h-5 w-5 rounded-full bg-background shadow transition-transform ${newFree ? "translate-x-4" : ""}`} />
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border p-4">
              <button onClick={() => { setAddOpen(false); resetAddForm(); }} className="rounded-lg border border-border px-4 py-2 text-xs font-semibold hover:border-[color:var(--gold)]">
                Cancel
              </button>
              <button
                onClick={saveOverride}
                disabled={saving || !selectedProduct}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--gold)] px-4 py-2 text-xs font-semibold text-[color:var(--gold-foreground)] hover:opacity-90 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save Override"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NumberField({ label, value, onChange, disabled, hint }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted-foreground">{label}</label>
      <input
        type="number" min={0} step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-sm border border-border bg-background px-3 text-sm focus:border-[color:var(--gold)] focus:outline-none disabled:opacity-50"
      />
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
