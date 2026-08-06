import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { fetchProducts, type Product } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

function useCountdown(target: number | null) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!target) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 47);
    return () => clearInterval(id);
  }, [target]);
  if (!target || now === null) return null;
  const diff = Math.max(0, target - now);
  return {
    hours: Math.floor(diff / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
    ms: Math.floor((diff % 1000) / 10),
    done: diff <= 0,
  };
}

function Unit({ value, label, pad = 2 }: { value: number; label: string; pad?: number }) {
  return (
    <div className="flex min-w-[38px] flex-col items-center rounded-sm bg-background/10 px-1.5 py-1 backdrop-blur-sm sm:min-w-[46px] sm:px-2">
      <span className="font-display text-sm font-bold tabular-nums text-[color:var(--gold-foreground)] sm:text-lg">
        {String(value).padStart(pad, "0")}
      </span>
      <span className="text-[7px] uppercase tracking-[0.2em] text-[color:var(--gold-foreground)]/70 sm:text-[8px]">{label}</span>
    </div>
  );
}

export function HotSellSection() {
  const q = useQuery({
    queryKey: ["products", "hot"],
    queryFn: () => fetchProducts({ isHot: true, limit: 10 }),
  });

  const products: Product[] = q.data?.data ?? [];

  const target = useMemo(() => {
    const times = products
      .map((p) => (p.hot_until ? new Date(p.hot_until).getTime() : NaN))
      .filter((t) => Number.isFinite(t) && t > Date.now());
    return times.length ? Math.min(...times) : null;
  }, [products]);

  const t = useCountdown(target);

  if (!products.length) return null;

  return (
    <section className="container-luxury py-12 md:py-20 lg:py-24">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 md:mb-10">
        <div className="min-w-0">
          <p className="text-[10px] track-luxury text-[color:var(--gold)] md:text-[11px]">Limited Time Offer</p>
          <h2 className="mt-1.5 flex items-center gap-2 font-display text-xl font-bold text-foreground md:mt-2 md:text-3xl lg:text-4xl">
            <Flame className="h-5 w-5 text-destructive md:h-7 md:w-7" /> Partial Hot Sell
          </h2>
        </div>

        {t && !t.done && (
          <div className="relative overflow-hidden rounded-md bg-[color:var(--gold)] p-[2px] shadow-lg">
            <span className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2.4s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            <div className="relative flex items-center gap-1.5 rounded-[4px] bg-[color:var(--gold)] px-2 py-1.5 sm:gap-2 sm:px-3">
              <Unit value={t.hours} label="Hrs" />
              <Unit value={t.minutes} label="Min" />
              <Unit value={t.seconds} label="Sec" />
              <Unit value={t.ms} label="Ms" />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>

      <div className="mt-8 flex justify-center">
        <Link to="/shop" search={{ filter: "hot" } as never} className="btn-liquid">
          View all hot deals
        </Link>
      </div>
    </section>
  );
}
