import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Banner = { id: string; title: string; subtitle: string | null; image_url: string; cta_text: string | null; cta_link: string | null; is_active: boolean; order_index: number };

export const Route = createFileRoute("/admin/banners")({
  head: () => ({ meta: [{ title: "Hero Banners — Admin FRAG AVENUE" }] }),
  component: AdminBanners,
});

function AdminBanners() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Partial<Banner>>({ title: "", subtitle: "", image_url: "", cta_text: "Shop Now", cta_link: "/shop", is_active: true, order_index: 0 });

  const q = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banners").select("*").order("order_index");
      if (error) throw error;
      return (data ?? []) as Banner[];
    },
  });

  const create = async () => {
    if (!draft.title || !draft.image_url) return toast.error("Title and image URL required");
    const { error } = await supabase.from("banners").insert({
      title: draft.title, subtitle: draft.subtitle ?? null, image_url: draft.image_url,
      cta_text: draft.cta_text ?? null, cta_link: draft.cta_link ?? null,
      is_active: draft.is_active ?? true, order_index: draft.order_index ?? 0,
    });
    if (error) return toast.error(error.message);
    toast.success("Banner added");
    setCreating(false);
    setDraft({ title: "", subtitle: "", image_url: "", cta_text: "Shop Now", cta_link: "/shop", is_active: true, order_index: 0 });
    qc.invalidateQueries({ queryKey: ["admin-banners"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete banner?")) return;
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-banners"] });
  };

  const toggle = async (b: Banner) => {
    const { error } = await supabase.from("banners").update({ is_active: !b.is_active }).eq("id", b.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-banners"] });
  };

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-6 flex flex-wrap items-center justify-between">
        <div>
          <p className="text-[11px] track-luxury text-[color:var(--gold)]">Storefront</p>
          <h1 className="mt-1 font-display text-3xl">Hero Banners</h1>
        </div>
        <button onClick={() => setCreating(true)} className="btn-liquid"><Plus className="h-3.5 w-3.5" /> Add Banner</button>
      </header>

      {creating && (
        <div className="mb-6 grid gap-3 rounded-sm border border-[color:var(--gold)]/30 bg-card p-5 sm:grid-cols-2">
          <Field label="Title" value={draft.title ?? ""} onChange={(v) => setDraft({ ...draft, title: v })} />
          <Field label="Subtitle" value={draft.subtitle ?? ""} onChange={(v) => setDraft({ ...draft, subtitle: v })} />
          <Field label="Image URL" value={draft.image_url ?? ""} onChange={(v) => setDraft({ ...draft, image_url: v })} className="sm:col-span-2" />
          <Field label="CTA Text" value={draft.cta_text ?? ""} onChange={(v) => setDraft({ ...draft, cta_text: v })} />
          <Field label="CTA Link" value={draft.cta_link ?? ""} onChange={(v) => setDraft({ ...draft, cta_link: v })} />
          <div className="flex items-center gap-3 sm:col-span-2">
            <button onClick={create} className="btn-liquid">Create</button>
            <button onClick={() => setCreating(false)} className="px-4 py-2 text-xs track-luxury text-muted-foreground">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(q.data ?? []).map((b) => (
          <div key={b.id} className="overflow-hidden rounded-sm border border-border bg-card">
            <div className="aspect-[16/9] bg-secondary">
              <img src={b.image_url} alt={b.title} className="h-full w-full object-cover" />
            </div>
            <div className="p-4">
              <div className="font-display text-lg">{b.title}</div>
              {b.subtitle && <p className="text-xs text-muted-foreground">{b.subtitle}</p>}
              <div className="mt-3 flex items-center justify-between gap-2">
                <button onClick={() => toggle(b)} className={`rounded-sm border px-2 py-1 text-[10px] track-luxury ${b.is_active ? "border-[color:var(--gold)] text-[color:var(--gold)]" : "border-border text-muted-foreground"}`}>
                  {b.is_active ? "Active" : "Inactive"}
                </button>
                <button onClick={() => remove(b.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {(q.data ?? []).length === 0 && !q.isLoading && <p className="text-sm text-muted-foreground">No banners yet.</p>}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, className = "" }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-[10px] track-luxury text-muted-foreground">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-sm border border-border bg-background px-3 text-sm focus:border-[color:var(--gold)] focus:outline-none" />
    </div>
  );
}
