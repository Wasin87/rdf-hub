import { Link } from "@tanstack/react-router";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/catalog";

export function ProductSection({ eyebrow, title, description, products, viewAllSearch }: {
  eyebrow: string;
  title: string;
  description?: string;
  products: Product[];
  viewAllSearch?: Record<string, string>;
}) {
  if (!products.length) return null;
  return (
    <section className="container-luxury py-12 md:py-20 lg:py-24">
      <div className="mb-6 flex items-end justify-between gap-3 md:mb-10">
        <div className="min-w-0">
          <p className="text-[10px] track-luxury text-[color:var(--gold)] md:text-[11px]">{eyebrow}</p>
          <h2 className="mt-1.5 font-display text-xl font-bold text-foreground md:mt-2 md:text-3xl lg:text-4xl">{title}</h2>
          {description && <p className="mt-2 hidden max-w-md text-sm text-muted-foreground md:block">{description}</p>}
        </div>
        <Link to="/shop" search={viewAllSearch as never} className="group inline-flex shrink-0 items-center gap-1.5 text-[10px] track-luxury text-foreground hover:text-[color:var(--gold)] md:gap-2 md:text-[11px]">
          View all <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
