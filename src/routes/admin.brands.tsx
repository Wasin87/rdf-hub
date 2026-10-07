import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit3, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Brand = { id: string; name: string; slug: string; description: string | null };

export const Route = createFileRoute("/admin/brands")({
  staticData: { sitemap: false },
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

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

  const startEdit = (b: Brand) => {
    setEditingId(b.id);
    setEditName(b.name);
    setEditDesc(b.description ?? "");
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    const { error } = await supabase.from("brands").update({ name: editName.trim(), slug: slugify(editName), description: editDesc || null }).eq("id", editingId);
    if (error) return toast.error(error.message);
    toast.success("Brand updated");
    setEditingId(null);
    qc.invalidateQueries({ queryKey: ["admin-brands"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete brand?")) return;
    const { error } = await supabase.from("brands").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-brands"] });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <header className="mb-6">
        <p className="text-[11px] track-luxury text-[color:var(--gold)]">Catalog</p>
        <h1 className="mt-1 font-display text-2xl sm:text-3xl">Brands ({(q.data ?? []).length})</h1>
      </header>

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-[color:var(--gold)]/30 bg-card shadow-xl p-4">
        <div className="flex-1 min-w-48">
          <label className="mb-1 block text-[10px] track-luxury text-muted-foreground">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background shadow-xl px-3 text-sm focus:border-[color:var(--gold)] focus:outline-none" />
        </div>
        <div className="flex-1 min-w-48">
          <label className="mb-1 block text-[10px] track-luxury text-muted-foreground">Description (optional)</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background shadow-xl px-3 text-sm focus:border-[color:var(--gold)] focus:outline-none" />
        </div>
        <button onClick={add} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[color:var(--gold)] bg-[color:var(--gold)] px-4 text-[11px] track-luxury text-[color:var(--gold-foreground)] shadow-xl transition hover:-translate-y-0.5"><Plus className="h-3.5 w-3.5" /> Add</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(q.data ?? []).map((b) => (
          <div key={b.id} className="rounded-lg border border-border bg-card shadow-xl p-4">
            {editingId === b.id ? (
              <div className="space-y-2">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xl focus:border-[color:var(--gold)] focus:outline-none" />
                <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Description" className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xl focus:border-[color:var(--gold)] focus:outline-none" />
                <div className="flex items-center gap-2 pt-1">
                  <button onClick={saveEdit} className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--gold)] bg-[color:var(--gold)] px-3 py-1.5 text-[10px] track-luxury text-[color:var(--gold-foreground)] shadow-xl"><Check className="h-3 w-3" /> Save</button>
                  <button onClick={() => setEditingId(null)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[10px] track-luxury text-muted-foreground shadow-xl"><X className="h-3 w-3" /> Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-lg">{b.name}</div>
                  <div className="truncate text-[10px] track-luxury text-muted-foreground">{b.slug}</div>
                  {b.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{b.description}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button onClick={() => startEdit(b)} className="inline-flex items-center rounded-lg border border-border bg-background p-1.5 text-muted-foreground shadow-xl transition hover:-translate-y-0.5 hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]" title="Edit"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => remove(b.id)} className="inline-flex items-center rounded-lg border border-border bg-background p-1.5 text-muted-foreground shadow-xl transition hover:-translate-y-0.5 hover:border-destructive/50 hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

