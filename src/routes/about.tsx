import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Award, Globe, Sparkles, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — RDF" }, { name: "description", content: "RDF — Rezoan's Decant & Fragrance is Bangladesh's premier luxury fragrance decant atelier." }] }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="container-luxury py-16 lg:py-24">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-center">
        <p className="text-[11px] track-luxury text-[color:var(--gold)]">Our Story</p>
        <h1 className="mt-3 font-display text-5xl md:text-6xl"><span className="gold-text">The Art of Decant</span></h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          RDF was founded with a singular conviction: that the great fragrances of our time should not be locked behind a single, intimidating bottle. Through painstakingly hand-decanted vials of 3ml to 30ml, we make the world's most prestigious houses accessible to discerning Bangladeshi connoisseurs.
        </p>
      </motion.div>

      <div className="mx-auto mt-20 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { Icon: ShieldCheck, t: "Authenticity", d: "Every bottle sourced direct from authorized boutiques and verified before decant." },
          { Icon: Sparkles, t: "Craft", d: "Hand-decanted in a sterile, climate-controlled atelier into laboratory-grade glass." },
          { Icon: Award, t: "Curation", d: "A focused edit of fragrances chosen by perfumers, not by trend." },
          { Icon: Globe, t: "Discretion", d: "Beautifully packaged. Discreetly delivered. Crafted in Bangladesh." },
        ].map(({ Icon, t, d }, i) => (
          <motion.div key={t} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
            className="rounded-sm border border-[color:var(--gold)]/15 bg-card p-7">
            <Icon className="h-6 w-6 text-[color:var(--gold)]" />
            <h3 className="mt-4 font-display text-xl">{t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-24 text-center">
        <h2 className="font-display text-3xl"><span className="gold-text">Begin Your Journey</span></h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">Discover the fragrances that will become part of your story.</p>
        <Link to="/shop" className="btn-liquid mt-7 inline-flex">Explore the Boutique</Link>
      </div>
    </div>
  );
}
