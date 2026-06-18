import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote } from "lucide-react";
import type { Review } from "@/lib/catalog";

export function ReviewsSlider({ reviews }: { reviews: Review[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!reviews.length) return;
    const t = setInterval(() => setI((x) => (x + 1) % reviews.length), 6000);
    return () => clearInterval(t);
  }, [reviews.length]);
  if (!reviews.length) return null;
  const r = reviews[i];
  return (
    <section className="bg-section py-24">
      <div className="container-luxury">
        <div className="mb-12 text-center">
          <p className="text-[11px] track-luxury text-[color:var(--gold)]">Voices of the Maison</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl"><span className="gold-text">Loved by Connoisseurs</span></h2>
        </div>
        <div className="relative mx-auto min-h-[260px] max-w-3xl">
          <Quote className="mx-auto h-10 w-10 text-[color:var(--gold)]/40" />
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={r.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.55 }}
              className="mt-6 text-center"
            >
              <div className="mb-4 flex justify-center gap-0.5">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} className={`h-4 w-4 ${idx < r.rating ? "fill-[color:var(--gold)] text-[color:var(--gold)]" : "text-muted-foreground/30"}`} />
                ))}
              </div>
              {r.title && <p className="mb-3 font-display text-xl text-foreground">{r.title}</p>}
              <p className="font-serif text-xl leading-relaxed text-foreground/85 md:text-2xl">"{r.body}"</p>
              <footer className="mt-7 text-[11px] track-luxury text-muted-foreground">— {r.author_name}</footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>
        <div className="mt-10 flex justify-center gap-2">
          {reviews.map((_, idx) => (
            <button key={idx} onClick={() => setI(idx)} aria-label={`Review ${idx + 1}`} className={`h-1 w-8 transition-all ${idx === i ? "bg-[color:var(--gold)]" : "bg-border hover:bg-muted-foreground/40"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
