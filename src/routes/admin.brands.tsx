import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Brand = { id: string; name: string; slug: string; description: string | null };

export const Route = createFileRoute("/admin/brands")({
  head: () => ({ meta: [{ title: "Brands — Admin FRAG AVENUE" }] }),
  component: AdminBrands,
});

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function AdminBrands() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const q = useQuery({
    queryKey: ["admin-brands"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brands").select("id, name, slug, description").order("name");
      if (error) throw error;
      return (data ?? []) as Brand[];
    },
  });

  const add = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from("brands").insert({ name: name.trim(), slug: slugify(name), description: description || null });
    if (error) return toast.error(error.message);
    toast.success("Brand added");
    setName(""); setDescription("");
    qc.invalidateQueries({ queryKey: ["admin-brands"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete brand?")) return;
    const { error } = await supabase.from("brands").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-brands"] });
  };

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-6">
        <p className="text-[11px] track-luxury text-[color:var(--gold)]">Catalog</p>
        <h1 className="mt-1 font-display text-3xl">Brands</h1>
      </header>

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-[color:var(--gold)]/30 bg-card shadow-xl p-4">
        <div className="flex-1 min-w-48">
          <label className="mb-1 block text-[10px] track-luxury text-muted-foreground">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="h-10 w-full rounded-sm border border-border bg-background px-3 text-sm" />
        </div>
        <div className="flex-1 min-w-48">
          <label className="mb-1 block text-[10px] track-luxury text-muted-foreground">Description (optional)</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="h-10 w-full rounded-sm border border-border bg-background px-3 text-sm" />
        </div>
        <button onClick={add} className="btn-liquid h-10"><Plus className="h-3.5 w-3.5" /> Add</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(q.data ?? []).map((b) => (
          <div key={b.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card shadow-xl p-4">
            <div>
              <div className="font-display text-lg">{b.name}</div>
              <div className="text-[10px] track-luxury text-muted-foreground">{b.slug}</div>
              {b.description && <p className="mt-1 text-xs text-muted-foreground">{b.description}</p>}
            </div>
            <button onClick={() => remove(b.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
