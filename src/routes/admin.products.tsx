import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Edit3, Trash2, Eye, EyeOff, Plus, Copy, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/format";
import { resolveImage } from "@/lib/catalog";
import { SafeImage } from "@/components/SafeImage";

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "Products — Admin FRAG AVENUE" }] }),
  component: AdminProducts,
});

type Variant = { id: string; size_ml: number; price: number; stock: number };
type Row = {
  id: string; name: string; slug: string; image_url: string | null;
  base_price: number; discount_percent: number; is_active: boolean; is_featured: boolean; is_new: boolean;
  brand: { name: string } | null; category: { name: string } | null;
  variants: Variant[];
};

const LOW_STOCK = 5;

type SortKey = "newest" | "oldest" | "name_asc" | "name_desc" | "price_asc" | "price_desc" | "stock_asc" | "stock_desc";

function AdminProducts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const q = useQuery({
    queryKey: ["admin-products", search],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("id, name, slug, image_url, base_price, discount_percent, is_active, is_featured, is_new, brand:brands(name), category:categories(name), variants:product_variants(id, size_ml, price, stock)")
        .order("created_at", { ascending: false });
      if (search) query = query.ilike("name", `%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const rawRows = q.data ?? [];
  const rows = [...rawRows].sort((a, b) => {
    const stockA = (a.variants ?? []).reduce((s, v) => s + (v.stock || 0), 0);
    const stockB = (b.variants ?? []).reduce((s, v) => s + (v.stock || 0), 0);
    switch (sort) {
      case "name_asc": return a.name.localeCompare(b.name);
      case "name_desc": return b.name.localeCompare(a.name);
      case "price_asc": return a.base_price - b.base_price;
      case "price_desc": return b.base_price - a.base_price;
      case "stock_asc": return stockA - stockB;
      case "stock_desc": return stockB - stockA;
      case "oldest": return 0;
      default: return 0;
    }
  });
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const toggle = async (id: string, field: "is_active" | "is_featured" | "is_new", value: boolean) => {
    const patch = field === "is_active" ? { is_active: !value } : field === "is_featured" ? { is_featured: !value } : { is_new: !value };
    const { error } = await supabase.from("products").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const duplicate = async (id: string) => {
    try {
      const { data: src, error } = await supabase
        .from("products")
        .select("name, slug, brand_id, category_id, collection_id, description, notes_top, notes_heart, notes_base, image_url, base_price, discount_percent, is_new, is_featured, is_limited, is_active, variants:product_variants(size_ml, price, stock), images:product_images(image_url, alt_text, sort_order)")
        .eq("id", id).maybeSingle();
      if (error || !src) throw error || new Error("Not found");
      const newSlug = `${src.slug}-copy-${Math.random().toString(36).slice(2, 6)}`;
      const { variants = [], images = [], ...productCols } = src as any;
      const { data: created, error: insErr } = await supabase
        .from("products")
        .insert({ ...productCols, name: `${src.name} (Copy)`, slug: newSlug, is_active: false })
        .select("id").single();
      if (insErr) throw insErr;
      if (variants.length) {
        await supabase.from("product_variants").insert(variants.map((v: any) => ({ ...v, product_id: created.id })));
      }
      if (images.length) {
        await supabase.from("product_images").insert(images.map((i: any) => ({ ...i, product_id: created.id })));
      }
      toast.success("Duplicated");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Duplicate failed");
    }
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} product(s)? This cannot be undone.`)) return;
    const ids = Array.from(selected);
    const { error } = await supabase.from("products").delete().in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(`${ids.length} deleted`);
    setSelected(new Set());
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const bulkSetActive = async (active: boolean) => {
    if (selected.size === 0) return;
    const { error } = await supabase.from("products").update({ is_active: active }).in("id", Array.from(selected));
    if (error) return toast.error(error.message);
    toast.success(active ? "Activated" : "Deactivated");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] track-luxury text-[color:var(--gold)]">Catalog</p>
          <h1 className="mt-1 font-display text-3xl">Products</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…"
            className="h-10 w-full max-w-xs rounded-sm border border-border bg-background px-3 text-sm focus:border-[color:var(--gold)] focus:outline-none sm:w-64" />
          <Link to="/admin/add-product" className="inline-flex items-center gap-2 rounded-sm bg-[color:var(--gold)] px-4 py-2.5 text-[11px] track-luxury text-[color:var(--gold-foreground)] shadow-sm transition-transform hover:scale-[1.02]">
            <Plus className="h-3.5 w-3.5" /> Add Product
          </Link>
        </div>
      </header>

      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-sm border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/5 px-3 py-2 text-sm">
          <span className="text-[color:var(--gold)]">{selected.size} selected</span>
          <button onClick={() => bulkSetActive(true)} className="rounded-sm border border-border px-2 py-1 text-[10px] track-luxury hover:border-[color:var(--gold)]">Activate</button>
          <button onClick={() => bulkSetActive(false)} className="rounded-sm border border-border px-2 py-1 text-[10px] track-luxury hover:border-[color:var(--gold)]">Deactivate</button>
          <button onClick={bulkDelete} className="rounded-sm border border-destructive/40 px-2 py-1 text-[10px] track-luxury text-destructive hover:bg-destructive/10">Delete</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-[10px] track-luxury text-muted-foreground hover:text-foreground">Clear</button>
        </div>
      )}

      <div className="overflow-x-auto rounded-sm border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-section text-left text-[10px] track-luxury text-muted-foreground">
            <tr>
              <th className="p-3">
                <input type="checkbox" checked={allSelected} onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())} />
              </th>
              <th className="p-3"></th>
              <th className="p-3">Product</th>
              <th className="p-3">Brand</th>
              <th className="p-3">Category</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3 text-right">Stock</th>
              <th className="p-3">Flags</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const stock = (p.variants ?? []).reduce((s, v) => s + (v.stock || 0), 0);
              const variantCount = (p.variants ?? []).length;
              const low = variantCount > 0 && stock <= LOW_STOCK;
              const checked = selected.has(p.id);
              return (
                <tr key={p.id} className="border-b border-border/50 last:border-0">
                  <td className="p-3">
                    <input type="checkbox" checked={checked} onChange={(e) => {
                      const next = new Set(selected);
                      if (e.target.checked) next.add(p.id); else next.delete(p.id);
                      setSelected(next);
                    }} />
                  </td>
                  <td className="p-3"><SafeImage src={resolveImage(p.image_url)} alt="" wrapperClassName="h-12 w-12 rounded-sm" className="h-12 w-12 object-cover" /></td>
                  <td className="p-3">
                    <Link to="/products/$slug" params={{ slug: p.slug }} className="font-medium hover:text-[color:var(--gold)]">{p.name}</Link>
                    <div className="text-[10px] text-muted-foreground">{p.slug}</div>
                  </td>
                  <td className="p-3 text-muted-foreground">{p.brand?.name}</td>
                  <td className="p-3 text-muted-foreground">{p.category?.name}</td>
                  <td className="p-3 text-right font-medium">
                    {formatBDT(p.base_price)}
                    {p.discount_percent > 0 && <span className="ml-1 text-[10px] text-[color:var(--gold)]">-{p.discount_percent}%</span>}
                  </td>
                  <td className="p-3 text-right">
                    {variantCount === 0 ? (
                      <span className="text-[10px] text-muted-foreground">No variants</span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 ${low ? "text-destructive" : "text-foreground"}`}>
                        {low && <AlertTriangle className="h-3 w-3" />}
                        {stock} {low && <span className="text-[10px]">(Low)</span>}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <Flag label="Active" on={p.is_active} onClick={() => toggle(p.id, "is_active", p.is_active)} />
                      <Flag label="Featured" on={p.is_featured} onClick={() => toggle(p.id, "is_featured", p.is_featured)} />
                      <Flag label="New" on={p.is_new} onClick={() => toggle(p.id, "is_new", p.is_new)} />
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link to="/admin/edit-product/$id" params={{ id: p.id }} className="text-muted-foreground hover:text-[color:var(--gold)]" aria-label="Edit"><Edit3 className="h-4 w-4" /></Link>
                      <button onClick={() => duplicate(p.id)} className="text-muted-foreground hover:text-[color:var(--gold)]" aria-label="Duplicate"><Copy className="h-4 w-4" /></button>
                      <button onClick={() => remove(p.id)} className="text-muted-foreground hover:text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={9} className="p-6 text-center text-sm text-muted-foreground">No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Flag({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[9px] track-luxury ${on ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10 text-[color:var(--gold)]" : "border-border text-muted-foreground"}`}>
      {on ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />} {label}
    </button>
  );
}
