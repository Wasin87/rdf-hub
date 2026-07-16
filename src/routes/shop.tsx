import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { fetchBrands, fetchProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { formatBDT } from "@/lib/format";

const searchSchema = z.object({
  category: z.enum(["men", "women", "unisex"]).optional(),
  brand: z.string().optional(),
  collection: z.string().optional(),
  filter: z.enum(["new", "discount", "limited"]).optional(),
  q: z.string().optional(),
  sort: z.enum(["latest", "popular", "price_asc", "price_desc"]).optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Shop — FRAG AVENUE Luxury Fragrances" }, { name: "description", content: "Browse luxury fragrance decants from the world's finest houses." }] }),
  component: ShopPage,
});

const PAGE_SIZE = 12;

function ShopPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const brandsQ = useQuery({ queryKey: ["brands"], queryFn: fetchBrands });

  const productsQ = useQuery({
    queryKey: ["shop-products", search],
    queryFn: () => fetchProducts({
      categorySlug: search.category,
      brandSlug: search.brand,
      collectionSlug: search.collection,
      isNew: search.filter === "new" ? true : undefined,
      isDiscounted: search.filter === "discount" ? true : undefined,
      isLimited: search.filter === "limited" ? true : undefined,
      search: search.q,
      sort: search.sort,
      minPrice: search.min,
      maxPrice: search.max,
    }),
  });

  const all = productsQ.data?.data ?? [];
  const page = search.page ?? 1;
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const slice = useMemo(() => all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [all, page]);

  const setSearch = (next: Partial<typeof search>) => navigate({ search: { ...search, ...next, page: 1 } as never });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  useEffect(() => { setMobileFiltersOpen(false); }, [search]);

  const PRICE_FLOOR = 0;
  const PRICE_CEIL = 30000;
  const [priceLo, setPriceLo] = useState<number>(search.min ?? PRICE_FLOOR);
  const [priceHi, setPriceHi] = useState<number>(search.max ?? PRICE_CEIL);
  useEffect(() => {
    setPriceLo(search.min ?? PRICE_FLOOR);
    setPriceHi(search.max ?? PRICE_CEIL);
  }, [search.min, search.max]);

  const applyPrice = () => {
    const lo = Math.min(priceLo, priceHi);
    const hi = Math.max(priceLo, priceHi);
    setSearch({
      min: lo > PRICE_FLOOR ? lo : undefined,
      max: hi < PRICE_CEIL ? hi : undefined,
    });
  };

  const Filters = (
    <aside className="space-y-6 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div>
        <h3 className="mb-3 text-[11px] track-luxury text-[color:var(--gold)]">Category</h3>
        <div className="flex flex-col gap-1.5">
          {[
            { label: "All", val: undefined },
            { label: "Men", val: "men" as const },
            { label: "Women", val: "women" as const },
            { label: "Unisex", val: "unisex" as const },
          ].map((c) => (
            <button key={c.label} onClick={() => setSearch({ category: c.val })}
              className={`text-left text-sm transition-colors ${search.category === c.val ? "text-[color:var(--gold)]" : "text-muted-foreground hover:text-foreground"}`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <h3 className="mb-3 text-[11px] track-luxury text-[color:var(--gold)]">Price (BDT)</h3>
        <div className="mb-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{formatBDT(Math.min(priceLo, priceHi))}</span>
          <span>{Math.max(priceLo, priceHi) >= PRICE_CEIL ? "∞" : formatBDT(Math.max(priceLo, priceHi))}</span>
        </div>
        <div className="relative h-6">
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-secondary" />
          <div
            className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[color:var(--gold)]"
            style={{
              left: `${(Math.min(priceLo, priceHi) / PRICE_CEIL) * 100}%`,
              right: `${100 - (Math.max(priceLo, priceHi) / PRICE_CEIL) * 100}%`,
            }}
          />
          <input
            type="range" min={PRICE_FLOOR} max={PRICE_CEIL} step={100} value={priceLo}
            onChange={(e) => setPriceLo(Number(e.target.value))}
            onMouseUp={applyPrice} onTouchEnd={applyPrice} onKeyUp={applyPrice}
            className="range-thumb absolute inset-0 w-full appearance-none bg-transparent"
            aria-label="Minimum price"
          />
          <input
            type="range" min={PRICE_FLOOR} max={PRICE_CEIL} step={100} value={priceHi}
            onChange={(e) => setPriceHi(Number(e.target.value))}
            onMouseUp={applyPrice} onTouchEnd={applyPrice} onKeyUp={applyPrice}
            className="range-thumb absolute inset-0 w-full appearance-none bg-transparent"
            aria-label="Maximum price"
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[9px] track-luxury text-muted-foreground">Min</span>
            <input type="number" min={PRICE_FLOOR} value={priceLo} onChange={(e) => setPriceLo(Number(e.target.value) || PRICE_FLOOR)} onBlur={applyPrice}
              className="h-9 rounded-sm border border-border bg-background px-2 text-xs focus:border-[color:var(--gold)] focus:outline-none" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[9px] track-luxury text-muted-foreground">Max</span>
            <input type="number" max={PRICE_CEIL} value={priceHi} onChange={(e) => setPriceHi(Number(e.target.value) || PRICE_CEIL)} onBlur={applyPrice}
              className="h-9 rounded-sm border border-border bg-background px-2 text-xs focus:border-[color:var(--gold)] focus:outline-none" />
          </label>
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <h3 className="mb-3 text-[11px] track-luxury text-[color:var(--gold)]">Brands</h3>
        <div className="thin-scroll max-h-64 space-y-1.5 overflow-y-auto pr-2">
          <button onClick={() => setSearch({ brand: undefined })} className={`block text-left text-sm transition-colors ${!search.brand ? "text-[color:var(--gold)]" : "text-muted-foreground hover:text-foreground"}`}>All Brands</button>
          {brandsQ.data?.map((b) => (
            <button key={b.id} onClick={() => setSearch({ brand: b.slug })}
              className={`block w-full text-left text-sm transition-colors ${search.brand === b.slug ? "text-[color:var(--gold)]" : "text-muted-foreground hover:text-foreground"}`}>
              {b.name}
            </button>
          ))}
        </div>
      </div>

      {(search.category || search.brand || search.collection || search.filter || search.min || search.max || search.q) && (
        <button onClick={() => navigate({ search: {} as never })} className="text-[11px] track-luxury text-destructive hover:underline">Clear all filters</button>
      )}
    </aside>
  );

  return (
    <div className="container-luxury py-12 lg:py-16">
      <div className="mb-10">
        <p className="text-[11px] track-luxury text-[color:var(--gold)]">The Boutique</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-foreground md:text-5xl">Shop Fragrances</h1>
        {search.q && <p className="mt-3 text-sm text-muted-foreground">Results for "<span className="text-foreground">{search.q}</span>"</p>}
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
        <button onClick={() => setMobileFiltersOpen(true)} className="flex items-center gap-2 text-xs track-luxury lg:hidden">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
        </button>
        <p className="text-xs text-muted-foreground">{all.length} fragrance{all.length === 1 ? "" : "s"}</p>
        <select value={search.sort ?? "latest"} onChange={(e) => setSearch({ sort: e.target.value as never })} className="h-9 rounded-sm border border-border bg-card px-3 text-xs focus:border-[color:var(--gold)] focus:outline-none">
          <option value="latest">Latest</option>
          <option value="popular">Popularity</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
        </select>
      </div>

      <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
        <div className="hidden lg:block">{Filters}</div>

        <div>
          {productsQ.isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-sm bg-secondary" />
              ))}
            </div>
          ) : slice.length === 0 ? (
            <div className="grid place-items-center py-24 text-center">
              <p className="font-display text-2xl gold-text">No fragrances found</p>
              <p className="mt-2 text-sm text-muted-foreground">Try adjusting your filters.</p>
              <Link to="/shop" className="btn-liquid mt-6">View All</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {slice.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              {pages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <button onClick={() => navigate({ search: { ...search, page: Math.max(1, page - 1) } as never })}
                    disabled={page === 1}
                    className="grid h-9 w-9 place-items-center rounded-sm border border-border disabled:opacity-30 hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: pages }).map((_, idx) => {
                    const p = idx + 1;
                    return (
                      <button key={p} onClick={() => navigate({ search: { ...search, page: p } as never })}
                        className={`h-9 min-w-9 rounded-sm px-3 text-xs ${p === page ? "bg-[color:var(--gold)] text-[color:var(--gold-foreground)]" : "border border-border text-muted-foreground hover:text-foreground"}`}>
                        {p}
                      </button>
                    );
                  })}
                  <button onClick={() => navigate({ search: { ...search, page: Math.min(pages, page + 1) } as never })}
                    disabled={page === pages}
                    className="grid h-9 w-9 place-items-center rounded-sm border border-border disabled:opacity-30 hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[88%] max-w-sm overflow-y-auto bg-background p-6">
            <button onClick={() => setMobileFiltersOpen(false)} aria-label="Close" className="mb-6 grid h-9 w-9 place-items-center rounded-sm border border-border"><X className="h-4 w-4" /></button>
            {Filters}
          </div>
        </div>
      )}
    </div>
  );
}
