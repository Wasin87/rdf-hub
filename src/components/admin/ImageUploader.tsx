import { useCallback, useRef, useState } from "react";
import { GripVertical, Trash2, UploadCloud, Star, StarOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type UploadedImage = { id?: string; url: string; path?: string; sort_order: number };

const BUCKET = "product-images";

export function publicUrl(path: string) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export function ImageUploader({
  images,
  onChange,
  primaryUrl,
  onPrimaryChange,
}: {
  images: UploadedImage[];
  onChange: (next: UploadedImage[]) => void;
  primaryUrl?: string | null;
  onPrimaryChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dragIdx = useRef<number | null>(null);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!list.length) return;
      setBusy(true);
      try {
        const uploaded: UploadedImage[] = [];
        for (const file of list) {
          const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
          const path = `${crypto.randomUUID()}.${ext}`;
          const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
            cacheControl: "31536000",
            upsert: false,
            contentType: file.type,
          });
          if (error) throw error;
          uploaded.push({ url: publicUrl(path), path, sort_order: images.length + uploaded.length });
        }
        const next = [...images, ...uploaded];
        onChange(next);
        if (!primaryUrl && uploaded[0]) onPrimaryChange(uploaded[0].url);
        toast.success(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [images, onChange, onPrimaryChange, primaryUrl],
  );

  const removeAt = (i: number) => {
    const next = images.filter((_, idx) => idx !== i).map((img, idx) => ({ ...img, sort_order: idx }));
    onChange(next);
  };

  const onDragStart = (i: number) => (dragIdx.current = i);
  const onDrop = (i: number) => {
    const from = dragIdx.current;
    dragIdx.current = null;
    if (from == null || from === i) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    onChange(next.map((img, idx) => ({ ...img, sort_order: idx })));
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); upload(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border border-dashed px-6 py-10 text-center transition-colors ${
          dragOver ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10" : "border-border bg-section hover:border-[color:var(--gold)]/50"
        }`}
      >
        <UploadCloud className="h-6 w-6 text-[color:var(--gold)]" />
        <div className="text-sm font-medium">{busy ? "Uploading…" : "Drag & drop images or click to upload"}</div>
        <div className="text-[10px] text-muted-foreground">PNG, JPG, WEBP — first image becomes the primary</div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {images.map((img, i) => {
            const isPrimary = primaryUrl === img.url;
            return (
              <div
                key={img.url}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(i)}
                className={`group relative aspect-square overflow-hidden rounded-sm border ${
                  isPrimary ? "border-[color:var(--gold)] ring-1 ring-[color:var(--gold)]/40" : "border-border"
                }`}
              >
                <img
                  src={img.url}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const el = e.currentTarget;
                    if (el.dataset.fb !== "1") {
                      el.dataset.fb = "1";
                      el.src = "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><rect fill='#f2f2f2' width='120' height='120'/><text x='60' y='64' font-family='sans-serif' font-size='10' fill='#999' text-anchor='middle'>No image</text></svg>`);
                    }
                  }}
                />
                <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onPrimaryChange(img.url)}
                    className="rounded-sm bg-black/60 p-1 text-white hover:text-[color:var(--gold)]"
                    title={isPrimary ? "Primary" : "Set as primary"}
                  >
                    {isPrimary ? <Star className="h-3.5 w-3.5 fill-current" /> : <StarOff className="h-3.5 w-3.5" />}
                  </button>
                  <span className="rounded-sm bg-black/60 p-1 text-white"><GripVertical className="h-3.5 w-3.5" /></span>
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    className="rounded-sm bg-black/60 p-1 text-white hover:text-destructive"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {isPrimary && (
                  <span className="absolute left-2 top-2 rounded-sm bg-[color:var(--gold)] px-1.5 py-0.5 text-[9px] track-luxury text-[color:var(--gold-foreground)]">
                    Primary
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
