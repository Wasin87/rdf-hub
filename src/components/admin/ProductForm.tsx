import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ImageUploader, type UploadedImage } from "./ImageUploader";
import { VariantBuilder, type VariantDraft } from "./VariantBuilder";

type Mode = { kind: "create" } | { kind: "edit"; id: string };

export type ProductFormInitial = {
  id?: string;
  name?: string;
  slug?: string;
  brand_id?: string | null;
  category_id?: string | null;
  collection_id?: string | null;
  description?: string | null;
  notes_top?: string | null;
  notes_heart?: string | null;
  notes_base?: string | null;
  image_url?: string | null;
  base_price?: number;
  discount_percent?: number;
  is_new?: boolean;
  is_featured?: boolean;
  is_limited?: boolean;
  is_active?: boolean;
  images?: UploadedImage[];
  variants?: VariantDraft[];
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function ProductForm({ mode, initial }: { mode: Mode; initial?: ProductFormInitial }) {
  const navigate = useNavigate();
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugDirty, setSlugDirty] = useState(!!initial?.slug);
  const [brandId, setBrandId] = useState(initial?.brand_id ?? "");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [collectionId, setCollectionId] = useState(initial?.collection_id ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [notesTop, setNotesTop] = useState(initial?.notes_top ?? "");
  const [notesHeart, setNotesHeart] = useState(initial?.notes_heart ?? "");
  const [notesBase, setNotesBase] = useState(initial?.notes_base ?? "");
  const [basePrice, setBasePrice] = useState<number | string>(initial?.base_price ?? "");
  const [discount, setDiscount] = useState<number | string>(initial?.discount_percent ?? 0);
  const [isNew, setIsNew] = useState(initial?.is_new ?? false);
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured ?? false);
  const [isLimited, setIsLimited] = useState(initial?.is_limited ?? false);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [images, setImages] = useState<UploadedImage[]>(initial?.images ?? []);
  const [primary, setPrimary] = useState<string | null>(initial?.image_url ?? null);
  const [variants, setVariants] = useState<VariantDraft[]>(initial?.variants ?? []);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!slugDirty) setSlug(slugify(name)); }, [name, slugDirty]);

  const brandsQ = useQuery({ queryKey: ["all-brands"], queryFn: async () => {
    const { data, error } = await supabase.from("brands").select("id, name").order("name");
    if (error) throw error; return data ?? [];
  }});
  const catsQ = useQuery({ queryKey: ["all-categories"], queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("id, name").order("name");
    if (error) throw error; return data ?? [];
  }});
  const colsQ = useQuery({ queryKey: ["all-collections"], queryFn: async () => {
    const { data, error } = await supabase.from("collections").select("id, name").order("name");
    if (error) throw error; return data ?? [];
  }});

  const lowestPrice = useMemo(() => {
    const prices = variants.map((v) => Number(v.price)).filter((n) => Number.isFinite(n) && n > 0);
    return prices.length ? Math.min(...prices) : null;
  }, [variants]);

  const submit = async () => {
    if (!name.trim()) return toast.error("Name is required");
    if (!slug.trim()) return toast.error("Slug is required");
    const priceNum = Number(basePrice) || lowestPrice || 0;
    if (priceNum <= 0) return toast.error("Set a base price or add at least one variant with a price");

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slugify(slug),
        brand_id: brandId || null,
        category_id: categoryId || null,
        collection_id: collectionId || null,
        description: description || null,
        notes_top: notesTop || null,
        notes_heart: notesHeart || null,
        notes_base: notesBase || null,
        image_url: primary || images[0]?.url || null,
        base_price: priceNum,
        discount_percent: Math.min(100, Math.max(0, Number(discount) || 0)),
        is_new: isNew,
        is_featured: isFeatured,
        is_limited: isLimited,
        is_active: isActive,
      };

      let productId = mode.kind === "edit" ? mode.id : "";

      if (mode.kind === "create") {
        const { data, error } = await supabase.from("products").insert(payload).select("id").single();
        if (error) throw error;
        productId = data.id;
      } else {
        const { error } = await supabase.from("products").update(payload).eq("id", mode.id);
        if (error) throw error;
      }

      // Replace images & variants atomically (delete + insert)
      await supabase.from("product_images").delete().eq("product_id", productId);
      if (images.length) {
        const rows = images.map((img, idx) => ({
          product_id: productId,
          image_url: img.url,
          alt_text: name,
          sort_order: idx,
        }));
        const { error } = await supabase.from("product_images").insert(rows);
        if (error) throw error;
      }

      await supabase.from("product_variants").delete().eq("product_id", productId);
      const variantRows = variants
        .filter((v) => Number(v.size_ml) > 0 && Number(v.price) >= 0)
        .map((v) => ({
          product_id: productId,
          size_ml: Number(v.size_ml),
          price: Number(v.price),
          stock: Number(v.stock) || 0,
        }));
      if (variantRows.length) {
        const { error } = await supabase.from("product_variants").insert(variantRows);
        if (error) throw error;
      }

      toast.success(mode.kind === "create" ? "Product created" : "Product updated");
      navigate({ to: "/admin/products" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <Section title="Identity">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Product name *">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Bleu de Chanel Parfum" />
          </Field>
          <Field label="Slug *">
            <input value={slug} onChange={(e) => { setSlug(e.target.value); setSlugDirty(true); }} className={inputCls} placeholder="bleu-de-chanel-parfum" />
          </Field>
          <Field label="Brand">
            <select value={brandId ?? ""} onChange={(e) => setBrandId(e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {(brandsQ.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Category">
            <select value={categoryId ?? ""} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {(catsQ.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Collection">
            <select value={collectionId ?? ""} onChange={(e) => setCollectionId(e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {(colsQ.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Base price (BDT)">
              <input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className={inputCls} placeholder={lowestPrice ? String(lowestPrice) : "0"} />
            </Field>
            <Field label="Discount %">
              <input type="number" min={0} max={100} value={discount} onChange={(e) => setDiscount(e.target.value)} className={inputCls} />
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Images" description="Upload multiple images. The first is primary; click the star to change.">
        <ImageUploader images={images} onChange={setImages} primaryUrl={primary} onPrimaryChange={setPrimary} />
      </Section>

      <Section title="Variants" description="Sizes with their own price and stock. Lowest price drives the base price if left empty.">
        <VariantBuilder value={variants} onChange={setVariants} />
      </Section>

      <Section title="Description & Fragrance Notes">
        <div className="grid gap-4">
          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputCls} />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Top notes"><input value={notesTop} onChange={(e) => setNotesTop(e.target.value)} className={inputCls} /></Field>
            <Field label="Heart notes"><input value={notesHeart} onChange={(e) => setNotesHeart(e.target.value)} className={inputCls} /></Field>
            <Field label="Base notes"><input value={notesBase} onChange={(e) => setNotesBase(e.target.value)} className={inputCls} /></Field>
          </div>
        </div>
      </Section>

      <Section title="Flags">
        <div className="flex flex-wrap gap-3">
          <Toggle label="Active" on={isActive} onChange={setIsActive} />
          <Toggle label="Featured" on={isFeatured} onChange={setIsFeatured} />
          <Toggle label="New arrival" on={isNew} onChange={setIsNew} />
          <Toggle label="Limited edition" on={isLimited} onChange={setIsLimited} />
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-6 flex items-center justify-end gap-3 border-t border-border bg-background/95 px-6 py-4 backdrop-blur lg:-mx-10 lg:px-10">
        <button type="button" onClick={() => navigate({ to: "/admin/products" })} className="rounded-sm border border-border px-5 py-2.5 text-[11px] track-luxury">Cancel</button>
        <button
          type="button"
          disabled={saving}
          onClick={submit}
          className="rounded-sm bg-[color:var(--gold)] px-6 py-2.5 text-[11px] track-luxury text-[color:var(--gold-foreground)] disabled:opacity-50"
        >
          {saving ? "Saving…" : mode.kind === "create" ? "Create product" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

const inputCls = "h-10 w-full rounded-sm border border-border bg-background px-3 text-sm focus:border-[color:var(--gold)] focus:outline-none";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-sm border border-border bg-card p-5">
      <div className="mb-4">
        <h2 className="font-display text-xl">{title}</h2>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-[10px] track-luxury text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`rounded-sm border px-3 py-1.5 text-[11px] track-luxury ${on ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10 text-[color:var(--gold)]" : "border-border text-muted-foreground"}`}
    >
      {label}: {on ? "On" : "Off"}
    </button>
  );
}
