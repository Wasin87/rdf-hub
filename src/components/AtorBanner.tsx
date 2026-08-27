import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import atorImage from "@/assets/collection-ator.jpg";

export function AtorBanner() {
  return (
    <section className="container-luxury pb-12 md:pb-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-[1200px]"
      >
        <Link
          to="/shop"
          search={{ category: "ator" } as never}
          className="group relative block h-[160px] w-full overflow-hidden rounded-lg border border-border bg-foreground shadow-md transition-shadow hover:shadow-xl sm:h-[180px] md:h-[230px] lg:h-[300px]"
        >
          <img
            src={atorImage}
            alt="Premium Attar Collection"
            loading="lazy"
            width={1600}
            height={544}
            className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
          <div className="absolute inset-y-0 left-0 flex max-w-[75%] flex-col justify-center gap-1.5 p-4 text-white sm:gap-2 sm:p-6 md:max-w-[60%] md:p-10">
            <p className="text-[9px] track-luxury text-[color:var(--gold-soft)] sm:text-[10px]">Attar Atelier</p>
            <h3 className="font-display text-base font-bold leading-tight sm:text-2xl md:text-3xl lg:text-4xl">
              <span className="gold-text">Premium Attar Collection</span>
            </h3>
            <p className="hidden text-xs text-white/75 sm:block md:text-sm">
              Alcohol-free oils, oud and amber — the timeless art of attar.
            </p>
            <span className="mt-1 inline-flex w-fit items-center gap-2 rounded-sm bg-[color:var(--gold)] px-3 py-1.5 text-[9px] font-semibold track-luxury text-[color:var(--gold-foreground)] transition-transform duration-300 group-hover:translate-x-1 sm:mt-2 sm:px-5 sm:py-2.5 sm:text-[10px]">
              Shop Attar <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </Link>
      </motion.div>
    </section>
  );
}
