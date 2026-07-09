import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, UploadCloud, Link2, Loader2, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Banner = { id: string; title: string; subtitle: string | null; image_url: string; cta_text: string | null; cta_link: string | null; is_active: boolean; order_index: number };

const BUCKET = "product-images";

export const Route = createFileRoute("/admin/banners")({
  head: () => ({ meta: [{ title: "Hero Banners — Admin FRAG AVENUE" }] }),
  component: AdminBanners,
});

type Mode = "upload" | "url";
type Draft = { title: string; subtitle: string; image_url: string; cta_text: string; cta_link: string; is_active: boolean; order_index: number };
const EMPTY: Draft = { title: "", subtitle: "", image_url: "", cta_text: "Shop Now", cta_link: "/shop", is_active: true, order_index: 0 };

function AdminBanners() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [mode, setMode] = useState<Mode>("upload");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const q = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banners").select("*").order("order_index");
      if (error) throw error;
      return (data ?? []) as Banner[];
    },
  });

  const handleFile = async (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image (JPG, PNG, WEBP)"); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Image too large (max 8MB)"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `banners/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      // Validate URL loads
      await new Promise<void>((res, rej) => {
        const img = new Image();
        img.onload = () => res();
        img.onerror = () => rej(new Error("Uploaded image is not accessible"));
        img.src = data.publicUrl;
      });
      setDraft((d) => ({ ...d, image_url: data.publicUrl }));
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const create = async () => {
    if (!draft.title.trim()) return toast.error("Title is required");
    if (!draft.image_url.trim()) return toast.error(mode === "upload" ? "Upload a banner image first" : "Enter an image URL");
    setSaving(true);
    try {
      const { error } = await supabase.from("banners").insert({
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim() || null,
        image_url: draft.image_url.trim(),
        cta_text: draft.cta_text.trim() || null,
        cta_link: draft.cta_link.trim() || null,
        is_active: draft.is_active,
        order_index: draft.order_index ?? 0,
      });
      if (error) throw error;
      toast.success("Banner added");
      setCreating(false);
      setDraft(EMPTY);
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      qc.invalidateQueries({ queryKey: ["banners"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete banner?")) return;
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-banners"] });
    qc.invalidateQueries({ queryKey: ["banners"] });
  };

  const toggle = async (b: Banner) => {
    const { error } = await supabase.from("banners").update({ is_active: !b.is_active }).eq("id", b.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-banners"] });
    qc.invalidateQueries({ queryKey: ["banners"] });
  };

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-6 flex flex-wrap items-center justify-between">
        <div>
          <p className="text-[11px] track-luxury text-[color:var(--gold)]">Storefront</p>
          <h1 className="mt-1 font-display text-3xl">Hero Banners</h1>
        </div>
        <button onClick={() => { setCreating(true); setDraft(EMPTY); setMode("upload"); }} className="btn-liquid"><Plus className="h-3.5 w-3.5" /> Add Banner</button>
      </header>

      {creating && (
        <div className="mb-6 grid gap-4 rounded-lg border border-[color:var(--gold)]/30 bg-card p-5 lg:grid-cols-2">
          <div className="space-y-3">
            <Field label="Title" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
            <Field label="Subtitle" value={draft.subtitle} onChange={(v) => setDraft({ ...draft, subtitle: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="CTA Text" value={draft.cta_text} onChange={(v) => setDraft({ ...draft, cta_text: v })} />
              <Field label="CTA Link" value={draft.cta_link} onChange={(v) => setDraft({ ...draft, cta_link: v })} />
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2">
                <label className="text-[10px] track-luxury text-muted-foreground">Banner Image</label>
                <div className="ml-auto inline-flex overflow-hidden rounded-sm border border-border text-[10px] track-luxury">
                  <button type="button" onClick={() => { setMode("upload"); setDraft((d) => ({ ...d, image_url: "" })); }} className={`inline-flex items-center gap-1 px-2.5 py-1 ${mode === "upload" ? "bg-foreground text-background" : "text-muted-foreground"}`}>
                    <UploadCloud className="h-3 w-3" /> Upload
                  </button>
                  <button type="button" onClick={() => { setMode("url"); setDraft((d) => ({ ...d, image_url: "" })); }} className={`inline-flex items-center gap-1 px-2.5 py-1 ${mode === "url" ? "bg-foreground text-background" : "text-muted-foreground"}`}>
                    <Link2 className="h-3 w-3" /> URL
                  </button>
                </div>
              </div>

              {mode === "upload" ? (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-sm border border-dashed border-border bg-section px-4 py-6 text-center hover:border-[color:var(--gold)]/60"
                >
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin text-[color:var(--gold)]" /> : <UploadCloud className="h-5 w-5 text-[color:var(--gold)]" />}
                  <div className="text-xs font-medium">{uploading ? "Uploading & validating…" : "Click to upload banner"}</div>
                  <div className="text-[10px] text-muted-foreground">JPG, PNG, WEBP · up to 8MB · 16:9 recommended</div>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/jpg" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
                </div>
              ) : (
                <input
                  value={draft.image_url}
                  onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                  placeholder="https://…"
                  className="h-10 w-full rounded-sm border border-border bg-background px-3 text-sm focus:border-[color:var(--gold)] focus:outline-none"
                />
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button onClick={create} disabled={saving || uploading} className="btn-liquid disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Create</button>
              <button onClick={() => { setCreating(false); setDraft(EMPTY); }} className="px-4 py-2 text-xs track-luxury text-muted-foreground">Cancel</button>
            </div>
          </div>

          <div>
            <div className="mb-2 text-[10px] track-luxury text-muted-foreground">Live Preview</div>
            <div className="relative aspect-[16/9] overflow-hidden rounded-sm border border-border bg-secondary">
              {draft.image_url ? (
                <img
                  src={draft.image_url}
                  alt="preview"
                  className="h-full w-full object-cover"
                  onError={(e) => { const el = e.currentTarget; el.style.display = "none"; el.parentElement?.setAttribute("data-broken", "1"); }}
                />
              ) : (
                <div className="grid h-full place-items-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-1 text-xs"><ImageOff className="h-5 w-5" /> No image yet</div>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-center p-5 text-white">
                {draft.title && <div className="font-display text-xl md:text-2xl">{draft.title}</div>}
                {draft.subtitle && <div className="mt-1 text-xs text-white/85">{draft.subtitle}</div>}
                {draft.cta_text && <div className="mt-3 w-fit rounded-sm bg-[color:var(--gold)] px-3 py-1 text-[10px] track-luxury text-[color:var(--gold-foreground)]">{draft.cta_text}</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(q.data ?? []).map((b) => (
          <div key={b.id} className="overflow-hidden rounded-sm border border-border bg-card">
            <div className="relative aspect-[16/9] bg-secondary">
              <img
                src={b.image_url}
                alt={b.title}
                className="h-full w-full object-cover"
                onError={(e) => { const el = e.currentTarget; if (el.dataset.fb !== "1") { el.dataset.fb = "1"; el.src = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 180'><rect fill='#eee' width='320' height='180'/><text x='160' y='96' font-family='sans-serif' font-size='14' fill='#999' text-anchor='middle'>Image unavailable</text></svg>"); } }}
              />
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
