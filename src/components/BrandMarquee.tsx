import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Brand } from "@/lib/catalog";

export function BrandMarquee({ brands }: { brands: Brand[] }) {
  const [paused, setPaused] = useState(false);
  const list = [...brands, ...brands]; // duplicate for loop
  return (
    <section
      className="border-y border-[color:var(--gold)]/15 bg-section py-6 md:py-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Featured brands"
    >
      <div className="overflow-hidden">
        <div className={`marquee-track ${paused ? "marquee-pause" : ""}`}>
          {list.map((b, i) => (
            <Link
              key={`${b.id}-${i}`}
              to="/shop"
              search={{ brand: b.slug } as never}
              className="group flex shrink-0 items-center gap-6 px-6 font-display text-xl font-semibold text-muted-foreground transition-colors hover:text-[color:var(--gold)] md:gap-12 md:px-12 md:text-3xl lg:text-4xl"
            >
              <span className="track-tight">{b.name}</span>
              <span className="text-[color:var(--gold)]/30 group-hover:text-[color:var(--gold)]">✦</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
