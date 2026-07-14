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
  const offsetRef = useRef(0);
  const halfRef = useRef(0);
  const [paused, setPaused] = useState(false);

  // Hooks first — guard rendering at the bottom instead of returning early.
  const hasReviews = reviews.length > 0;
  const list = hasReviews ? [...reviews, ...reviews, ...reviews, ...reviews] : [];

  // Smooth auto-scroll via transform on RAF.
  useEffect(() => {
    if (!hasReviews) return;
    const el = trackRef.current;
    if (!el) return;
    let raf = 0;
    let last = performance.now();
    const speed = 36; // px/s

    const apply = () => {
      const half = el.scrollWidth / 2;
      halfRef.current = half;
      if (half > 0) {
        if (offsetRef.current >= half) offsetRef.current -= half;
        if (offsetRef.current < 0) offsetRef.current += half;
      }
      el.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
    };

    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!paused) {
        offsetRef.current += speed * dt;
        apply();
      } else {
        last = now;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [paused, hasReviews]);

  const nudge = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-review-card]");
    const delta = (card?.offsetWidth ?? 300) + 16;
    // Update the shared offset so RAF stays in sync — no fight with auto-scroll.
    const half = halfRef.current || el.scrollWidth / 2;
    let next = offsetRef.current + delta * dir;
    if (half > 0) {
      if (next >= half) next -= half;
      if (next < 0) next += half;
    }
    offsetRef.current = next;
    el.style.transition = "transform 0.55s cubic-bezier(0.22,0.9,0.28,1)";
    el.style.transform = `translate3d(${-next}px, 0, 0)`;
    window.setTimeout(() => { el.style.transition = ""; }, 580);
  };

  if (!hasReviews) return null;

  return (
    <section className="bg-section pt-12 pb-8 md:pt-20 md:pb-10">
      <div className="container-luxury">
        <div className="mb-6 flex items-end justify-between gap-3 md:mb-10">
          <div className="min-w-0">
            <p className="text-[10px] track-luxury text-[color:var(--gold)] md:text-[11px]">Voices of the Maison</p>
            <h2 className="mt-1.5 font-display text-xl font-bold text-foreground md:mt-3 md:text-3xl lg:text-4xl">
              Products Reviews
            </h2>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => nudge(-1)}
              aria-label="Previous reviews"
              className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-foreground shadow-xl transition hover:scale-105 hover:bg-foreground hover:text-background md:h-11 md:w-11"
            >
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
            </button>
            <button
              type="button"
              onClick={() => nudge(1)}
              aria-label="Next reviews"
              className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-foreground shadow-xl transition hover:scale-105 hover:bg-foreground hover:text-background md:h-11 md:w-11"
            >
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
            </button>
          </div>
        </div>

        <div
          className="overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          <div
            ref={trackRef}
            className="flex w-max gap-4 will-change-transform md:gap-6"
          >
            {list.map((r, i) => (
              <article
                key={`${r.id}-${i}`}
                data-review-card
                className="flex w-[78vw] shrink-0 flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xl sm:w-[300px] md:w-[320px] md:p-5 lg:w-[300px]"
              >
                <header className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-foreground font-display text-sm text-background">
                    {initials(r.author_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-semibold text-foreground">{r.author_name}</p>
                    <div className="mt-0.5 flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`h-3 w-3 ${
                            idx < r.rating
                              ? "fill-[color:var(--gold)] text-[color:var(--gold)]"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </header>
                <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
                  {r.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
