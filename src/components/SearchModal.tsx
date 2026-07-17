import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { IoSearch } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import { fetchProducts, type Product, resolveImage } from "@/lib/catalog";
import { formatBDT, discountedPrice } from "@/lib/format";
import { SafeImage } from "@/components/SafeImage";

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) { setQ(""); setResults([]); return; }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  useEffect(() => {
    const term = q.trim();
    if (!term) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await fetchProducts({ search: term, limit: 12 });
        setResults(data);
      } finally { setLoading(false); }
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate({ to: "/shop", search: { q: q.trim() } as never });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -24, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="mx-auto mt-[8vh] w-[min(92vw,720px)] overflow-hidden rounded-sm border border-[color:var(--gold)]/30 bg-popover shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={submit} className="relative border-b border-border">
              <IoSearch className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--gold)]" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search fragrances"
                className="h-14 w-full bg-transparent pl-14 pr-14 font-sans text-lg placeholder:text-gray-500 focus:outline-none"
              />
              <button type="button" onClick={onClose} aria-label="Close search" className="absolute right-4 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-sm border border-border text-muted-foreground hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]">
                <X className="h-3.5 w-3.5" />
              </button>
            </form>
            <div className="max-h-[60vh] overflow-y-auto">
              {!q.trim() && (
                <div className="p-10 text-center font-sans text-xs text-gray-500">
                  Begin typing to discover fragrances
                </div>
              )}
              {loading && <div className="p-6 text-xs text-muted-foreground">Searching…</div>}
              {!loading && q.trim() && results.length === 0 && (
                <div className="p-10 text-center text-xs text-muted-foreground">No fragrances match "{q}"</div>
              )}
              {!loading && results.map((p) => {
                const finalPrice = discountedPrice(p.base_price, p.discount_percent);
                return (
                  <Link
                    key={p.id}
                    to="/products/$slug"
                    params={{ slug: p.slug }}
                    onClick={onClose}
                    className="flex items-center gap-4 border-b border-border/40 p-4 transition-colors last:border-0 hover:bg-secondary/40"
                  >
                    <SafeImage src={resolveImage(p.image_url)} alt={p.name} wrapperClassName="h-14 w-14 shrink-0 rounded-sm" className="h-14 w-14 object-cover" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[10px] track-luxury text-muted-foreground">{p.brand?.name}</div>
                      <div className="truncate font-display text-base text-foreground">{p.name}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-medium text-[color:var(--gold)]">{formatBDT(finalPrice)}</div>
                      <div className="text-[10px] track-luxury text-muted-foreground">from 30ml</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
