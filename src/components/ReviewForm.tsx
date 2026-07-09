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

export function ReviewForm({ productId, productName, orderId, reviewId: reviewIdProp, initial, onClose, onSubmitted, onDeleted }: Props) {
  const { user } = useAuth();
  const [reviewId, setReviewId] = useState<string | null>(reviewIdProp ?? null);
  const isEdit = !!reviewId;
  const [rating, setRating] = useState(initial?.rating ?? 5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [existing, setExisting] = useState<string[]>(initial?.images ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(!reviewIdProp && !initial);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    if (reviewIdProp || initial || !user) { setLoading(false); return; }
    let alive = true;
    (async () => {
      const { data } = await supabase.from("reviews").select("id, rating, title, body, images").eq("product_id", productId).eq("user_id", user.id).maybeSingle();
      if (!alive) return;
      if (data) {
        setReviewId(data.id);
        setRating(data.rating);
        setTitle(data.title ?? "");
        setBody(data.body ?? "");
        setExisting(Array.isArray(data.images) ? (data.images as string[]) : []);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [productId, user, reviewIdProp, initial]);

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const room = 6 - (files.length + existing.length);
    const next = Array.from(list).filter((f) => f.type.startsWith("image/")).slice(0, Math.max(0, room));
    setFiles((prev) => [...prev, ...next]);
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));
  const removeExisting = (idx: number) => setExisting((prev) => prev.filter((_, i) => i !== idx));

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

      const images = [...existing, ...uploaded];

      if (isEdit && reviewId) {
        const { error } = await supabase.from("reviews").update({
          rating, title: title.trim() || null, body: body.trim(), images,
        }).eq("id", reviewId);
        if (error) throw error;
        toast.success("Review updated", { description: "Your changes will be re-reviewed." });
      } else {
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
          images,
        });
        if (error) throw error;
        toast.success("Review submitted", { description: "It will appear after admin approval." });
      }
      onSubmitted?.();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    if (!reviewId) return;
    if (!confirm("Delete this review permanently?")) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
      if (error) throw error;
      toast.success("Review deleted");
      onDeleted?.();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 p-3 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <div
        className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-sm border border-[color:var(--gold)]/30 bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-4 sm:p-5">
          <div className="min-w-0">
            <p className="text-[10px] track-luxury text-[color:var(--gold)]">{isEdit ? "Edit Review" : "Write Review"}</p>
            <h2 className="mt-1 truncate font-display text-xl">{productName}</h2>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-secondary" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div>
            <div className="mb-2 text-[10px] track-luxury text-muted-foreground">Your Rating</div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} className="p-0.5">
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
            <label className="flex h-16 cursor-pointer items-center justify-center gap-2 rounded-sm border border-dashed border-border text-xs text-muted-foreground hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]">
              <Upload className="h-4 w-4" /> Upload images
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            </label>
            {(existing.length + files.length) > 0 && (
              <div className="mt-3 grid grid-cols-6 gap-2">
                {existing.map((url, i) => (
                  <div key={`e-${i}`} className="relative aspect-square overflow-hidden rounded-sm border border-border">
                    <img src={url} alt="" className="h-full w-full object-cover" onError={(e) => { const el = e.currentTarget; el.style.display = "none"; }} />
                    <button onClick={() => removeExisting(i)} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-background/90"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                {files.map((f, i) => (
                  <div key={`n-${i}`} className="relative aspect-square overflow-hidden rounded-sm border border-border">
                    <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                    <button onClick={() => removeFile(i)} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-background/90"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-border bg-card p-4 sm:p-5">
          {isEdit && (
            <button onClick={remove} disabled={deleting || submitting} className="grid h-10 w-10 place-items-center rounded-sm border border-destructive/40 text-destructive hover:bg-destructive/10 disabled:opacity-50" title="Delete review">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          )}
          <button onClick={onClose} className="flex-1 rounded-sm border border-border py-2.5 text-xs track-luxury hover:border-foreground">Cancel</button>
          <button onClick={submit} disabled={submitting} className="btn-liquid flex-1 disabled:opacity-50">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {isEdit ? "Save Changes" : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}
