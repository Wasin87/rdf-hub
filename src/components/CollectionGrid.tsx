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
    <section className="container-luxury py-20 lg:py-28">
      <div className="mb-12 text-center">
        <p className="text-[11px] track-luxury text-[color:var(--gold)]">Curated Collections</p>
        <h2 className="mt-3 font-display text-4xl md:text-5xl"><span className="gold-text">The Houses</span></h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
          Explore fragrances by gender and discover scents tailored to every personality.
        </p>
      </div>
      <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
        {items.map((c, i) => (
          <motion.div key={c.slug} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6, delay: i * 0.1 }}>
            <Link
              to="/shop"
              search={{ category: c.slug } as never}
              className="group relative block aspect-[4/5] overflow-hidden rounded-lg border border-border bg-foreground shadow-md transition-shadow hover:shadow-xl"
            >
              <img
                src={c.image}
                alt={c.name}
                loading="lazy"
                onError={(e) => { e.currentTarget.style.opacity = "0"; }}
                className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <h3 className="font-display text-2xl"><span className="gold-text">{c.name}</span></h3>
                <p className="mt-1 text-xs text-white/75">{c.desc}</p>
                <div className="mt-3 inline-flex items-center gap-2 text-[10px] track-luxury text-[color:var(--gold-soft)]">
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
