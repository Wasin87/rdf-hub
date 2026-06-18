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
    <section className="container-luxury py-20 lg:py-24">
      <div className="mb-10 flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-[11px] track-luxury text-[color:var(--gold)]">{eyebrow}</p>
          <h2 className="mt-2 font-display text-3xl md:text-4xl"><span className="gold-text">{title}</span></h2>
          {description && <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>}
        </div>
        <Link to="/shop" search={viewAllSearch as never} className="group inline-flex items-center gap-2 text-[11px] track-luxury text-foreground hover:text-[color:var(--gold)]">
          View all <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
