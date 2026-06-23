import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import type { Review } from "@/lib/catalog";

function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ReviewsSlider({ reviews }: { reviews: Review[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  if (!reviews.length) return null;

  // duplicate for seamless loop
  const list = [...reviews, ...reviews];

  // Auto-scroll
  useEffect(() => {
    const el = trackRef.current;
    if (!el || paused) return;
    let raf = 0;
    let last = performance.now();
    const speed = 40; // px/s
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      el.scrollLeft += speed * dt;
      const half = el.scrollWidth / 2;
      if (el.scrollLeft >= half) el.scrollLeft -= half;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [paused, reviews.length]);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-review-card]");
    const delta = (card?.offsetWidth ?? 320) + 24;
    el.scrollBy({ left: delta * dir, behavior: "smooth" });
  };

  return (
    <section className="bg-section py-20">
      <div className="container-luxury">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-[11px] track-luxury text-[color:var(--gold)]">Voices of the Maison</p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">
              <span className="gold-text">Products Reviews</span>
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => scrollBy(-1)}
              aria-label="Previous reviews"
              className="grid h-11 w-11 place-items-center rounded-full border border-border bg-background text-foreground transition hover:scale-105 hover:bg-foreground hover:text-background"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scrollBy(1)}
              aria-label="Next reviews"
              className="grid h-11 w-11 place-items-center rounded-full border border-border bg-background text-foreground transition hover:scale-105 hover:bg-foreground hover:text-background"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
          className="flex gap-6 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {list.map((r, i) => (
            <article
              key={`${r.id}-${i}`}
              data-review-card
              className="flex w-[85%] shrink-0 flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md sm:w-[46%] lg:w-[calc((100%-4.5rem)/4)]"
            >
              <header className="flex items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-foreground font-display text-base text-background">
                  {initials(r.author_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base text-foreground">{r.author_name}</p>
                  <div className="mt-1 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`h-3.5 w-3.5 ${
                          idx < r.rating
                            ? "fill-[color:var(--gold)] text-[color:var(--gold)]"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </header>
              {r.title && (
                <p className="font-display text-sm text-foreground line-clamp-1">{r.title}</p>
              )}
              <p className="text-sm leading-relaxed text-muted-foreground line-clamp-5">
                {r.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
