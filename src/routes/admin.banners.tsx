import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, UploadCloud, Link2, Loader2, ImageOff, Edit3, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { appStorageImageUrl, IMAGE_BUCKETS, isAcceptedImage, normalizeStorageImageUrl, validateImageUrl } from "@/lib/catalog";
import { SafeImage } from "@/components/SafeImage";

type Banner = { id: string; title: string; subtitle: string | null; image_url: string; cta_text: string | null; cta_link: string | null; is_active: boolean; order_index: number };

const BUCKET = IMAGE_BUCKETS.products;

export const Route = createFileRoute("/admin/banners")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Hero Banners — Admin FRAG AVENUE" }] }),
  component: AdminBanners,
});

type Mode = "upload" | "url";
type Draft = { title: string; subtitle: string; image_url: string; cta_text: string; cta_link: string; is_active: boolean; order_index: number };
const EMPTY: Draft = { title: "", subtitle: "", image_url: "", cta_text: "Shop Now", cta_link: "/shop", is_active: true, order_index: 0 };

function AdminBanners() {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const openCreate = () => {
    setEditingId(null);
    setDraft(EMPTY);
    setMode("upload");
    setFormOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditingId(b.id);
    setDraft({
      title: b.title,
      subtitle: b.subtitle ?? "",
      image_url: b.image_url,
      cta_text: b.cta_text ?? "",
      cta_link: b.cta_link ?? "",
      is_active: b.is_active,
      order_index: b.order_index,
    });
    setMode("url");
    setFormOpen(true);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const closeForm = () => { setFormOpen(false); setEditingId(null); setDraft(EMPTY); };

  const handleFile = async (file: File | null | undefined) => {
    if (!file) return;
    if (!isAcceptedImage(file)) { toast.error("Please choose a JPG, JPEG, PNG, or WEBP image"); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Image too large (max 8MB)"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `banners/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
      if (error) throw error;
      const imageUrl = appStorageImageUrl(BUCKET, path);
      await validateImageUrl(imageUrl);
      setDraft((d) => ({ ...d, image_url: imageUrl }));
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    if (!draft.title.trim()) return toast.error("Title is required");
    if (!draft.image_url.trim()) return toast.error("Banner image is required");
    setSaving(true);
    try {
      const imageUrl = normalizeStorageImageUrl(draft.image_url);
      await validateImageUrl(imageUrl);
      const payload = {
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim() || null,
        image_url: imageUrl,
        cta_text: draft.cta_text.trim() || null,
        cta_link: draft.cta_link.trim() || null,
        is_active: draft.is_active,
        order_index: draft.order_index ?? 0,
      };
      if (editingId) {
        const { error } = await supabase.from("banners").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Banner updated");
      } else {
        const { error } = await supabase.from("banners").insert(payload);
        if (error) throw error;
        toast.success("Banner added");
      }
      closeForm();
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
    <div className="p-4 sm:p-6 lg:p-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] track-luxury text-[color:var(--gold)]">Storefront</p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl">Hero Banners ({(q.data ?? []).length})</h1>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--gold)] bg-[color:var(--gold)] px-4 py-2 text-[11px] track-luxury text-[color:var(--gold-foreground)] shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl">
          <Plus className="h-3.5 w-3.5" /> Add Banner
        </button>
      </header>

      {formOpen && (
        <div className="mb-6 grid gap-4 rounded-lg border border-[color:var(--gold)]/30 bg-card p-5 shadow-xl lg:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg">{editingId ? "Edit Banner" : "New Banner"}</h3>
            </div>
            <Field label="Title" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
            <Field label="Subtitle" value={draft.subtitle} onChange={(v) => setDraft({ ...draft, subtitle: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="CTA Text" value={draft.cta_text} onChange={(v) => setDraft({ ...draft, cta_text: v })} />
              <Field label="CTA Link" value={draft.cta_link} onChange={(v) => setDraft({ ...draft, cta_link: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] track-luxury text-muted-foreground">Display Order</label>
                <input
                  type="number"
                  value={draft.order_index}
                  onChange={(e) => setDraft({ ...draft, order_index: Number(e.target.value) || 0 })}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xl focus:border-[color:var(--gold)] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] track-luxury text-muted-foreground">Status</label>
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, is_active: !draft.is_active })}
                  className={`h-10 w-full rounded-lg border px-3 text-xs font-semibold shadow-xl transition ${draft.is_active ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10 text-[color:var(--gold)]" : "border-border bg-background text-muted-foreground"}`}
                >
                  {draft.is_active ? "Active" : "Inactive"}
                </button>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2">
                <label className="text-[10px] track-luxury text-muted-foreground">Banner Image</label>
                <div className="ml-auto inline-flex overflow-hidden rounded-lg border border-border text-[10px] track-luxury shadow-xl">
                  <button type="button" onClick={() => setMode("upload")} className={`inline-flex items-center gap-1 px-2.5 py-1 ${mode === "upload" ? "bg-foreground text-background" : "text-muted-foreground"}`}>
                    <UploadCloud className="h-3 w-3" /> Upload
                  </button>
                  <button type="button" onClick={() => setMode("url")} className={`inline-flex items-center gap-1 px-2.5 py-1 ${mode === "url" ? "bg-foreground text-background" : "text-muted-foreground"}`}>
                    <Link2 className="h-3 w-3" /> URL
                  </button>
                </div>
              </div>

              {mode === "upload" ? (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-section px-4 py-6 text-center shadow-xl hover:border-[color:var(--gold)]/60"
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
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xl focus:border-[color:var(--gold)] focus:outline-none"
                />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button onClick={save} disabled={saving || uploading} className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--gold)] bg-[color:var(--gold)] px-4 py-2 text-[11px] track-luxury text-[color:var(--gold-foreground)] shadow-xl transition hover:-translate-y-0.5 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {editingId ? "Update" : "Create"}
              </button>
              <button onClick={closeForm} className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-[11px] track-luxury text-muted-foreground shadow-xl hover:text-foreground">Cancel</button>
            </div>
          </div>

          <div>
            <div className="mb-2 text-[10px] track-luxury text-muted-foreground">Live Preview</div>
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border bg-secondary shadow-xl">
              {draft.image_url ? (
                <SafeImage src={draft.image_url} alt="preview" wrapperClassName="h-full w-full" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-1 text-xs"><ImageOff className="h-5 w-5" /> No image yet</div>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-center p-5 text-white">
                {draft.title && <div className="font-display text-xl md:text-2xl">{draft.title}</div>}
                {draft.subtitle && <div className="mt-1 text-xs text-white/85">{draft.subtitle}</div>}
                {draft.cta_text && <div className="mt-3 w-fit rounded-lg bg-[color:var(--gold)] px-3 py-1 text-[10px] track-luxury text-[color:var(--gold-foreground)]">{draft.cta_text}</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(q.data ?? []).map((b) => (
          <div key={b.id} className="group overflow-hidden rounded-lg border border-border bg-card p-3 shadow-xl transition hover:-translate-y-0.5 hover:border-[color:var(--gold)]/40 hover:shadow-2xl">
            <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-border bg-secondary">
              <SafeImage src={b.image_url} alt={b.title} wrapperClassName="h-full w-full" className="h-full w-full object-cover" />
              <span className={`absolute left-2 top-2 rounded-lg border px-2 py-0.5 text-[9px] track-luxury shadow-xl backdrop-blur-sm ${b.is_active ? "border-[color:var(--gold)] bg-[color:var(--gold)]/90 text-[color:var(--gold-foreground)]" : "border-white/20 bg-black/60 text-white/80"}`}>
                {b.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="px-1 pb-1 pt-3">
              <div className="truncate font-display text-base">{b.title}</div>
              {b.subtitle && <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{b.subtitle}</p>}
              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  onClick={() => toggle(b)}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] track-luxury shadow-xl transition hover:-translate-y-0.5 ${b.is_active ? "border-destructive/40 bg-background text-destructive hover:bg-destructive/10" : "border-[color:var(--gold)] bg-[color:var(--gold)] text-[color:var(--gold-foreground)]"}`}
                >
                  {b.is_active ? <><XCircle className="h-3 w-3" /> Deactivate</> : <><CheckCircle2 className="h-3 w-3" /> Activate</>}
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEdit(b)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[10px] track-luxury text-muted-foreground shadow-xl transition hover:-translate-y-0.5 hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
                    title="Edit banner"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => remove(b.id)}
                    className="inline-flex items-center rounded-lg border border-border bg-background px-2.5 py-1.5 text-[10px] track-luxury text-muted-foreground shadow-xl transition hover:-translate-y-0.5 hover:border-destructive/50 hover:text-destructive"
                    title="Delete banner"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
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
      <input value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xl focus:border-[color:var(--gold)] focus:outline-none" />
    </div>
  );
}
