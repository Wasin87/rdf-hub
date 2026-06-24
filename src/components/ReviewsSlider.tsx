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

  // Duplicate enough times so the seamless loop never visibly snaps,
  // regardless of viewport width.
  const list = [...reviews, ...reviews, ...reviews, ...reviews];

  // Smooth auto-scroll via transform on RAF — avoids the jitter of scrollLeft.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf = 0;
    let last = performance.now();
    const speed = 36; // px/s
    let offset = 0;

    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!paused) {
        offset += speed * dt;
        const half = el.scrollWidth / 2;
        if (half > 0 && offset >= half) offset -= half;
        el.style.transform = `translate3d(${-offset}px, 0, 0)`;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [paused, reviews.length]);

  const nudge = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-review-card]");
    const delta = (card?.offsetWidth ?? 280) + 16;
    // Animate via transform: jump the offset by delta in the chosen direction.
    const cur = new DOMMatrixReadOnly(getComputedStyle(el).transform).m41;
    const target = cur - delta * dir;
    el.style.transition = "transform 0.5s cubic-bezier(0.2,0.8,0.2,1)";
    el.style.transform = `translate3d(${target}px, 0, 0)`;
    window.setTimeout(() => { el.style.transition = ""; }, 520);
  };

  return (
    <section className="bg-section py-12 md:py-20">
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
              onClick={() => nudge(-1)}
              aria-label="Previous reviews"
              className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-foreground transition hover:scale-105 hover:bg-foreground hover:text-background md:h-11 md:w-11"
            >
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
            </button>
            <button
              onClick={() => nudge(1)}
              aria-label="Next reviews"
              className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-foreground transition hover:scale-105 hover:bg-foreground hover:text-background md:h-11 md:w-11"
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
                className="flex w-[78vw] shrink-0 flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:w-[300px] md:w-[320px] md:p-5 lg:w-[300px]"
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
