import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchProducts, type Product, resolveImage } from "@/lib/catalog";
import { formatBDT, discountedPrice } from "@/lib/format";

export function SearchBar({ inDrawer = false }: { inDrawer?: boolean }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (!term) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await fetchProducts({ search: term, limit: 8 });
        setResults(data);
      } finally { setLoading(false); }
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate({ to: "/shop", search: { q: q.trim() } as never });
    setOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${inDrawer ? "w-full" : "w-full max-w-xs"}`}>
      <form onSubmit={submit} className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search fragrance"
          aria-label="Search products"
          className="h-9 w-full rounded-full border border-[color:var(--border)] bg-card pl-10 pr-9 text-xs tracking-wide text-foreground placeholder:text-muted-foreground focus:border-[color:var(--gold)] focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)]/40"
        />
        {q && (
          <button type="button" onClick={() => { setQ(""); setResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Clear search">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>
      <AnimatePresence>
        {open && q.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[60vh] overflow-y-auto rounded-sm border border-[color:var(--gold)]/20 bg-popover shadow-2xl"
          >
            {loading && <div className="p-4 text-xs text-muted-foreground">Searching…</div>}
            {!loading && results.length === 0 && (
              <div className="p-6 text-center text-xs text-muted-foreground">No fragrances match "{q}"</div>
            )}
            {!loading && results.map((p) => {
              const finalPrice = discountedPrice(p.base_price, p.discount_percent);
              return (
                <Link
                  key={p.id}
                  to="/products/$slug"
                  params={{ slug: p.slug }}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 border-b border-border/50 p-3 transition-colors last:border-0 hover:bg-secondary/50"
                >
                  <img src={resolveImage(p.image_url)} alt={p.name} className="h-12 w-12 shrink-0 rounded-sm object-cover" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[10px] track-luxury text-muted-foreground">{p.brand?.name}</div>
                    <div className="truncate text-sm font-medium text-foreground">{p.name}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs font-medium text-[color:var(--gold)]">{formatBDT(finalPrice)}</div>
                    <div className="text-[10px] text-muted-foreground">from 30ml</div>
                  </div>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
