import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X, Star, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Review = {
  id: string; product_id: string | null; author_name: string; rating: number;
  title: string | null; body: string; is_approved: boolean; is_featured: boolean; created_at: string;
};

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({ meta: [{ title: "Reviews — Admin FRAG AVENUE" }] }),
  component: AdminReviews,
});

function AdminReviews() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_reviews");
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });

  const update = async (id: string, patch: Partial<Review>) => {
    const { error } = await supabase.from("reviews").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  };
  const remove = async (id: string) => {
    if (!confirm("Delete review?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  };

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-6">
        <p className="text-[11px] track-luxury text-[color:var(--gold)]">Community</p>
        <h1 className="mt-1 font-display text-3xl">Reviews</h1>
      </header>
      <div className="space-y-3">
        {(q.data ?? []).map((r) => (
          <div key={r.id} className="rounded-lg border border-border bg-card shadow-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[10px] track-luxury text-muted-foreground">
                  <span>{r.author_name}</span>
                  <span>·</span>
                  <span>{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <div className="mt-1 flex items-center gap-1">
                  {[1,2,3,4,5].map((n) => <Star key={n} className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-[color:var(--gold)] text-[color:var(--gold)]" : "text-muted-foreground"}`} />)}
                </div>
                {r.title && <div className="mt-2 font-display text-lg">{r.title}</div>}
                <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => update(r.id, { is_approved: !r.is_approved })} className={`flex items-center gap-1 rounded-lg border px-2 py-1 shadow-xl text-[10px] track-luxury ${r.is_approved ? "border-green-500 text-green-500" : "border-border text-muted-foreground"}`}>
                  <Check className="h-3 w-3" /> {r.is_approved ? "Approved" : "Approve"}
                </button>
                <button onClick={() => update(r.id, { is_featured: !r.is_featured })} className={`flex items-center gap-1 rounded-lg border px-2 py-1 shadow-xl text-[10px] track-luxury ${r.is_featured ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10 text-[color:var(--gold)]" : "border-border text-muted-foreground"}`}>
                  <Star className="h-3 w-3" /> {r.is_featured ? "Featured" : "Feature"}
                </button>
                <button onClick={() => remove(r.id)} className="flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-[10px] track-luxury text-muted-foreground hover:border-destructive hover:text-destructive">
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {(q.data ?? []).length === 0 && !q.isLoading && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
      </div>
    </div>
  );
}
