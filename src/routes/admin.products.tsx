import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Edit3, Trash2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/format";
import { resolveImage } from "@/lib/catalog";

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "Products — Admin RDF" }] }),
  component: AdminProducts,
});

type Row = {
  id: string; name: string; slug: string; image_url: string | null;
  base_price: number; discount_percent: number; is_active: boolean; is_featured: boolean; is_new: boolean;
  brand: { name: string } | null; category: { name: string } | null;
};

function AdminProducts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin-products", search],
    queryFn: async () => {
      let query = supabase.from("products").select("id, name, slug, image_url, base_price, discount_percent, is_active, is_featured, is_new, brand:brands(name), category:categories(name)").order("created_at", { ascending: false });
      if (search) query = query.ilike("name", `%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const toggle = async (id: string, field: "is_active" | "is_featured" | "is_new", value: boolean) => {
    const { error } = await supabase.from("products").update({ [field]: !value }).eq("id", id);
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

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] track-luxury text-[color:var(--gold)]">Catalog</p>
          <h1 className="mt-1 font-display text-3xl">Products</h1>
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…"
          className="h-10 w-full max-w-xs rounded-sm border border-border bg-background px-3 text-sm focus:border-[color:var(--gold)] focus:outline-none sm:w-64" />
      </header>

      <div className="overflow-x-auto rounded-sm border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-section text-left text-[10px] track-luxury text-muted-foreground">
            <tr>
              <th className="p-3"></th><th className="p-3">Product</th><th className="p-3">Brand</th><th className="p-3">Category</th>
              <th className="p-3 text-right">Price</th><th className="p-3">Flags</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((p) => editing === p.id ? (
              <EditRow key={p.id} product={p} onClose={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["admin-products"] }); }} />
            ) : (
              <tr key={p.id} className="border-b border-border/50 last:border-0">
                <td className="p-3"><img src={resolveImage(p.image_url)} alt="" className="h-12 w-12 rounded-sm object-cover" /></td>
                <td className="p-3">
                  <Link to="/products/$slug" params={{ slug: p.slug }} className="font-medium hover:text-[color:var(--gold)]">{p.name}</Link>
                  <div className="text-[10px] text-muted-foreground">{p.slug}</div>
                </td>
                <td className="p-3 text-muted-foreground">{p.brand?.name}</td>
                <td className="p-3 text-muted-foreground">{p.category?.name}</td>
                <td className="p-3 text-right font-medium">{formatBDT(p.base_price)}{p.discount_percent > 0 && <span className="ml-1 text-[10px] text-[color:var(--gold)]">-{p.discount_percent}%</span>}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    <Flag label="Active" on={p.is_active} onClick={() => toggle(p.id, "is_active", p.is_active)} />
                    <Flag label="Featured" on={p.is_featured} onClick={() => toggle(p.id, "is_featured", p.is_featured)} />
                    <Flag label="New" on={p.is_new} onClick={() => toggle(p.id, "is_new", p.is_new)} />
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setEditing(p.id)} className="text-muted-foreground hover:text-[color:var(--gold)]" aria-label="Edit"><Edit3 className="h-4 w-4" /></button>
                    <button onClick={() => remove(p.id)} className="text-muted-foreground hover:text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {(q.data ?? []).length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">No products found.</td></tr>
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

function EditRow({ product, onClose }: { product: Row; onClose: () => void }) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.base_price));
  const [discount, setDiscount] = useState(String(product.discount_percent));
  const save = async () => {
    const { error } = await supabase.from("products").update({
      name, base_price: parseFloat(price) || 0, discount_percent: Math.min(100, Math.max(0, parseInt(discount) || 0)),
    }).eq("id", product.id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    onClose();
  };
  return (
    <tr className="border-b border-[color:var(--gold)]/30 bg-section">
      <td className="p-3"><img src={resolveImage(product.image_url)} alt="" className="h-12 w-12 rounded-sm object-cover" /></td>
      <td className="p-3" colSpan={3}>
        <input value={name} onChange={(e) => setName(e.target.value)} className="h-9 w-full rounded-sm border border-border bg-background px-2 text-sm" />
      </td>
      <td className="p-3 text-right">
        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="h-9 w-24 rounded-sm border border-border bg-background px-2 text-sm" />
        <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="%" className="ml-1 h-9 w-14 rounded-sm border border-border bg-background px-2 text-sm" />
      </td>
      <td className="p-3 text-[10px] text-muted-foreground">Toggle flags via row buttons</td>
      <td className="p-3">
        <div className="flex justify-end gap-2">
          <button onClick={save} className="rounded-sm bg-[color:var(--gold)] px-3 py-1 text-[10px] track-luxury text-[color:var(--gold-foreground)]">Save</button>
          <button onClick={onClose} className="rounded-sm border border-border px-3 py-1 text-[10px] track-luxury">Cancel</button>
        </div>
      </td>
    </tr>
  );
}
