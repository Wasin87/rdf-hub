import { useEffect, useState } from "react";
import { Star, X, Upload, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  productId: string;
  productName: string;
  orderId?: string | null;
  reviewId?: string | null;
  initial?: { rating: number; title: string | null; body: string; images: string[] } | null;
  onClose: () => void;
  onSubmitted?: () => void;
  onDeleted?: () => void;
};

const BUCKET = "review-images";

export function ReviewForm({ productId, productName, orderId, onClose, onSubmitted }: Props) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list).filter((f) => f.type.startsWith("image/")).slice(0, 6 - files.length);
    setFiles((prev) => [...prev, ...next].slice(0, 6));
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const submit = async () => {
    if (!user) { toast.error("Please sign in"); return; }
    if (!body.trim() || body.trim().length < 10) { toast.error("Review must be at least 10 characters"); return; }
    setSubmitting(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${productId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }

      const authorName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Customer";
      const { error } = await supabase.from("reviews").insert({
        product_id: productId,
        user_id: user.id,
        order_id: orderId ?? null,
        author_name: authorName,
        email: user.email ?? null,
        rating,
        title: title.trim() || null,
        body: body.trim(),
        images: uploaded,
      });
      if (error) throw error;
      toast.success("Review submitted", { description: "It will appear after admin approval." });
      onSubmitted?.();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-background/85 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-sm border border-[color:var(--gold)]/30 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full hover:bg-secondary" aria-label="Close"><X className="h-4 w-4" /></button>

        <p className="text-[10px] track-luxury text-[color:var(--gold)]">Write Review</p>
        <h2 className="mt-1 font-display text-2xl">{productName}</h2>

        <div className="mt-5">
          <div className="mb-2 text-[10px] track-luxury text-muted-foreground">Your Rating</div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} className="p-1">
                <Star className={`h-6 w-6 transition-colors ${(hover || rating) >= n ? "fill-[color:var(--gold)] text-[color:var(--gold)]" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-[10px] track-luxury text-muted-foreground">Review Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="A luxurious experience…" className="h-10 w-full rounded-sm border border-border bg-transparent px-3 text-sm focus:border-[color:var(--gold)] focus:outline-none" />
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-[10px] track-luxury text-muted-foreground">Your Review</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={1500} placeholder="Share notes, longevity, sillage…" className="w-full rounded-sm border border-border bg-transparent p-3 text-sm focus:border-[color:var(--gold)] focus:outline-none" />
          <div className="mt-1 text-[10px] text-muted-foreground">{body.length}/1500</div>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-[10px] track-luxury text-muted-foreground">Photos (optional, max 6)</label>
          <label className="flex h-20 cursor-pointer items-center justify-center gap-2 rounded-sm border border-dashed border-border text-xs text-muted-foreground hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]">
            <Upload className="h-4 w-4" /> Upload images
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
          </label>
          {files.length > 0 && (
            <div className="mt-3 grid grid-cols-6 gap-2">
              {files.map((f, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-sm border border-border">
                  <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => removeFile(i)} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-background/90"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-sm border border-border py-2.5 text-xs track-luxury hover:border-foreground">Cancel</button>
          <button onClick={submit} disabled={submitting} className="btn-liquid flex-1 disabled:opacity-50">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}
