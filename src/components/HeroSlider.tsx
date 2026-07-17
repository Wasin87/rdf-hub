import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/lib/catalog";
import { resolveImage } from "@/lib/catalog";
import { SafeImage } from "@/components/SafeImage";

export function HeroSlider({ banners }: { banners: Banner[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = banners.length;

  useEffect(() => {
    if (paused || total <= 1) return;
    const t = setInterval(() => setI((x) => (x + 1) % total), 5500);
    return () => clearInterval(t);
  }, [paused, total]);

  if (total === 0) {
    return (
      <section className="relative h-[70vh] min-h-[520px] w-full overflow-hidden bg-foreground" aria-label="FRAG AVENUE hero">
        <SafeImage src={resolveImage(null)} alt="Luxury fragrance collection" fetchPriority="high" wrapperClassName="h-full w-full" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/15" />
        <div className="container-luxury relative z-10 flex h-full items-center">
          <div className="max-w-2xl text-white">
            <span className="mb-5 inline-block rounded-sm border border-[color:var(--gold-soft)]/60 px-3 py-1 text-[10px] track-luxury text-[color:var(--gold-soft)]">FRAG AVENUE</span>
            <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif' }} className="text-5xl leading-[1.05] text-balance md:text-6xl lg:text-7xl"><span className="gold-text">Luxury Fragrance Decants</span></h1>
            <Link to="/shop" className="btn-liquid mt-9">Shop Now <span className="ml-1">→</span></Link>
          </div>
        </div>
      </section>
    );
  }
  const current = banners[i];

  return (
    <section
      className="relative h-[78vh] min-h-[560px] w-full overflow-hidden bg-foreground"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
          className="absolute inset-0"
        >
          <SafeImage src={resolveImage(current.image_url)} alt={current.title} fetchPriority="high" wrapperClassName="h-full w-full" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/15" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
        </motion.div>
      </AnimatePresence>

      <div className="container-luxury relative z-10 flex h-full items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id + "-text"}
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.85, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="max-w-2xl text-white"
          >
            <span className="mb-5 inline-block rounded-sm border border-[color:var(--gold-soft)]/60 px-3 py-1 text-[10px] track-luxury text-[color:var(--gold-soft)]">
              FRAG AVENUE
            </span>
            <h1 className="font-display text-5xl leading-[1.05] text-balance md:text-6xl lg:text-7xl">
              <span className="gold-text">{current.title}</span>
            </h1>
            {current.subtitle && (
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 md:text-lg">{current.subtitle}</p>
            )}
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to={(current.cta_link as never) || "/shop"} className="btn-liquid">
                {current.cta_text || "Shop Now"}
                <span className="ml-1">→</span>
              </Link>
              <Link to="/our-story" className="inline-flex items-center gap-2 rounded-sm border border-[color:var(--gold-soft)]/70 px-7 py-[0.95rem] text-[0.78rem] font-medium uppercase tracking-[0.32em] text-[color:var(--gold-soft)] backdrop-blur-sm transition-all hover:bg-[color:var(--gold-soft)]/10">
                Our Story
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {total > 1 && (
        <>
          <button onClick={() => setI((x) => (x - 1 + total) % total)} aria-label="Previous" className="absolute left-6 top-1/2 z-20 hidden -translate-y-1/2 text-white/60 transition-colors hover:text-[color:var(--gold-soft)] md:block">
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button onClick={() => setI((x) => (x + 1) % total)} aria-label="Next" className="absolute right-6 top-1/2 z-20 hidden -translate-y-1/2 text-white/60 transition-colors hover:text-[color:var(--gold-soft)] md:block">
            <ChevronRight className="h-8 w-8" />
          </button>
          <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {banners.map((_, idx) => (
              <button key={idx} onClick={() => setI(idx)} aria-label={`Slide ${idx + 1}`} className={`h-[2px] w-12 transition-all ${idx === i ? "bg-[color:var(--gold)]" : "bg-white/30 hover:bg-white/60"}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
