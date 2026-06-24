import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import collMen from "@/assets/collection-men.jpg";
import collWomen from "@/assets/collection-women.jpg";
import collUnisex from "@/assets/collection-unisex.jpg";

const items = [
  { name: "Men", slug: "men", desc: "Bold, masculine compositions", image: collMen },
  { name: "Women", slug: "women", desc: "Refined floral elegance", image: collWomen },
  { name: "Unisex", slug: "unisex", desc: "Genderless artistry", image: collUnisex },
];

export function CollectionGrid() {
  return (
    <section className="container-luxury py-12 md:py-20 lg:py-24">
      <div className="mb-8 text-center md:mb-12">
        <p className="text-[10px] track-luxury text-[color:var(--gold)] md:text-[11px]">Collection</p>
        <h2 className="mt-3 font-display text-2xl font-bold text-foreground md:text-4xl lg:text-5xl">
          Find your signature scent
        </h2>
      </div>
      <div className="mx-auto grid max-w-5xl grid-cols-3 gap-2 sm:gap-4 md:gap-5">
        {items.map((c, i) => (
          <motion.div key={c.slug} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6, delay: i * 0.1 }}>
            <Link
              to="/shop"
              search={{ category: c.slug } as never}
              className="group relative block aspect-[3/4] overflow-hidden rounded-lg border border-border bg-foreground shadow-md transition-shadow hover:shadow-xl sm:aspect-[4/5]"
            >
              <img
                src={c.image}
                alt={c.name}
                loading="lazy"
                onError={(e) => { e.currentTarget.style.opacity = "0"; }}
                className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-2 text-white sm:p-4 md:p-6">
                <h3 className="font-display text-xs font-semibold sm:text-lg md:text-2xl"><span className="gold-text">{c.name}</span></h3>
                <p className="mt-0.5 hidden text-[10px] text-white/75 sm:block md:text-xs">{c.desc}</p>
                <div className="mt-1 hidden items-center gap-1 text-[9px] track-luxury text-[color:var(--gold-soft)] sm:inline-flex md:mt-3 md:gap-2 md:text-[10px]">
                  Discover <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
