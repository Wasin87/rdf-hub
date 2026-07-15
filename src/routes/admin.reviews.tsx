import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Star, Trash2, Search, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SafeImage } from "@/components/SafeImage";

type Review = {
  id: string;
  product_id: string | null;
  user_id: string | null;
  author_name: string;
  email: string | null;
  rating: number;
  title: string | null;
  body: string;
  images: string[] | null;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
};

type ProductLite = { id: string; name: string; image_url: string | null; slug: string | null };

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({ meta: [{ title: "Reviews — Admin FRAG AVENUE" }] }),
  component: AdminReviews,
});

function AdminReviews() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"all" | "active" | "inactive" | "featured">("all");
  const [search, setSearch] = useState("");

  const q = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });

  const productIds = useMemo(
    () => Array.from(new Set((q.data ?? []).map((r) => r.product_id).filter(Boolean))) as string[],
    [q.data],
  );

  const productsQ = useQuery({
    queryKey: ["admin-reviews-products", productIds],
    enabled: productIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name, image_url, slug").in("id", productIds);
      if (error) throw error;
      const map = new Map<string, ProductLite>();
      (data ?? []).forEach((p) => map.set(p.id, p as ProductLite));
      return map;
    },
  });

  const filtered = useMemo(() => {
    const all = q.data ?? [];
    const term = search.trim().toLowerCase();
    return all.filter((r) => {
      if (tab === "active" && !r.is_approved) return false;
      if (tab === "inactive" && r.is_approved) return false;
      if (tab === "featured" && !r.is_featured) return false;
      if (!term) return true;
      const pname = r.product_id ? productsQ.data?.get(r.product_id)?.name ?? "" : "";
      return [r.author_name, r.email ?? "", r.title ?? "", r.body, pname].join(" ").toLowerCase().includes(term);
    });
  }, [q.data, tab, search, productsQ.data]);

  const counts = useMemo(() => {
    const all = q.data ?? [];
    return {
      all: all.length,
      active: all.filter((r) => r.is_approved).length,
      inactive: all.filter((r) => !r.is_approved).length,
      featured: all.filter((r) => r.is_featured).length,
    };
  }, [q.data]);

  const update = async (id: string, patch: Partial<Review>) => {
    const { error } = await supabase.from("reviews").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Review updated");
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Review deleted");
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  };

  const tabs: { key: typeof tab; label: string; n: number }[] = [
    { key: "all", label: "All", n: counts.all },
    { key: "active", label: "Active", n: counts.active },
    { key: "inactive", label: "Inactive", n: counts.inactive },
    { key: "featured", label: "Featured", n: counts.featured },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] track-luxury text-[color:var(--gold)]">Community</p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl">Customer Reviews ({counts.all})</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Reviews from customers appear here. New reviews are active by default — deactivate to hide from the site.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviews…"
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm shadow-xl focus:border-[color:var(--gold)] focus:outline-none"
          />
        </div>
      </header>

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs shadow-xl transition-colors ${
              tab === t.key
                ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10 text-[color:var(--gold)]"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            <span className="rounded-full bg-background/60 px-1.5 text-[10px]">{t.n}</span>
          </button>
        ))}
      </div>

      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading reviews…</p>
      ) : filtered.length === 0 ? (
        <div className="grid place-items-center rounded-lg border border-dashed border-border py-16 text-center">
          <Star className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-display text-lg">No reviews found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {counts.all === 0 ? "Customers haven't posted any reviews yet." : "Adjust the filters to see more."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => {
            const p = r.product_id ? productsQ.data?.get(r.product_id) : undefined;
            return (
              <article key={r.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-xl">
                <div className="flex items-center gap-3 border-b border-border pb-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-background">
                    {p?.image_url ? (
                      <SafeImage src={p.image_url} alt={p.name} wrapperClassName="h-full w-full" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-sm">{p?.name ?? "Unknown product"}</div>
                    <div className="truncate text-[10px] track-luxury text-muted-foreground">
                      {r.author_name}{r.email ? ` · ${r.email}` : ""}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] track-luxury ${
                      r.is_approved
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {r.is_approved ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`h-3.5 w-3.5 ${
                          n <= r.rating ? "fill-[color:var(--gold)] text-[color:var(--gold)]" : "text-muted-foreground/40"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>

                {r.title && <div className="font-display text-base leading-tight">{r.title}</div>}
                <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">{r.body}</p>

                {Array.isArray(r.images) && r.images.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {r.images.slice(0, 6).map((url, i) => (
                      <SafeImage
                        key={i}
                        src={url}
                        alt=""
                        wrapperClassName="h-12 w-12 rounded-sm border border-border overflow-hidden"
                        className="h-12 w-12 object-cover"
                      />
                    ))}
                  </div>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  {r.is_approved ? (
                    <button
                      onClick={() => update(r.id, { is_approved: false })}
                      className="flex-1 rounded-lg border border-border px-2.5 py-1.5 text-[10px] track-luxury text-muted-foreground shadow-xl hover:border-destructive hover:text-destructive"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => update(r.id, { is_approved: true })}
                      className="flex-1 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] track-luxury text-emerald-600 shadow-xl hover:bg-emerald-500/20 dark:text-emerald-400"
                    >
                      <Check className="mr-1 inline h-3 w-3" /> Activate
                    </button>
                  )}
                  <button
                    onClick={() => update(r.id, { is_featured: !r.is_featured })}
                    className={`flex-1 rounded-lg border px-2.5 py-1.5 text-[10px] track-luxury shadow-xl ${
                      r.is_featured
                        ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10 text-[color:var(--gold)]"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Star className="mr-1 inline h-3 w-3" /> {r.is_featured ? "Featured" : "Feature"}
                  </button>
                  <button
                    onClick={() => remove(r.id)}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground shadow-xl hover:border-destructive hover:text-destructive"
                    title="Delete review"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
