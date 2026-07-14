import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Globe2, Gem, Leaf, HandHeart, Award, Target } from "lucide-react";

export const Route = createFileRoute("/our-story")({
  head: () => ({
    meta: [
      { title: "Our Story — FRAG AVENUE | Bangladesh's Luxury Fragrance Maison" },
      { name: "description", content: "Discover the story, mission and craft behind FRAG AVENUE — Bangladesh's premier atelier for authentic luxury fragrance decants from the world's most prestigious houses." },
      { property: "og:title", content: "Our Story — FRAG AVENUE" },
      { property: "og:description", content: "The maison, the mission, and the craft behind Bangladesh's premier luxury fragrance decant atelier." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OurStoryPage,
});

const values = [
  { Icon: ShieldCheck, t: "Uncompromised Authenticity", d: "Every bottle is sourced from authorised boutiques and batch-verified before a single millilitre is decanted." },
  { Icon: Gem, t: "Atelier Craftsmanship", d: "Hand-decanted in a sterile, climate-controlled environment into laboratory-grade glass — as the perfumer intended." },
  { Icon: HandHeart, t: "Accessible Luxury", d: "From 3ml discovery vials to full 30ml companions — the world's finest scents, without the intimidating full-bottle commitment." },
  { Icon: Leaf, t: "Considered & Sustainable", d: "Refillable glass, recyclable packaging, and small-batch production — luxury that respects the world it perfumes." },
];

const milestones = [
  { year: "2022", t: "A Private Obsession", d: "A small personal collection of niche fragrances plants the seed for what will become FRAG AVENUE." },
  { year: "2023", t: "The Atelier Opens", d: "Our climate-controlled decanting atelier launches in Dhaka with a curated edit of 40 fragrances." },
  { year: "2024", t: "The Community Grows", d: "Thousands of connoisseurs across Bangladesh discover their signature scent through our decant boutique." },
  { year: "2025", t: "A National Address", d: "Nationwide discreet delivery, expanded houses, and a dedicated concierge for the discerning collector." },
];

function OurStoryPage() {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-foreground py-24 text-background md:py-32">
        <div className="absolute inset-0 opacity-20 gold-gradient" aria-hidden />
        <div className="container-luxury relative text-center">
          <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] track-luxury text-[color:var(--gold-soft)]">
            The Maison — Est. 2022
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4 font-display text-5xl leading-tight md:text-7xl">
            <span className="gold-text">Our Story</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-background/75 md:text-lg">
            A devotion to scent. A pursuit of authenticity. A boutique built for those who understand that fragrance is the most intimate luxury one can wear.
          </motion.p>
        </div>
      </section>

      {/* Chapter 1 — Origin */}
      <section className="container-luxury py-20 md:py-28">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <span className="text-[11px] track-luxury text-[color:var(--gold)]">Chapter I — The Origin</span>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">A House Born of Obsession</h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              FRAG AVENUE began with a single bottle of Creed Aventus, a private collection that quietly grew into hundreds, and an unshakable conviction: the most exquisite fragrances in the world should not be locked behind impossible price tags or unreachable borders.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              In a country where a single 100ml bottle of niche perfume can cost more than a month's rent, we saw an entire generation of scent-lovers priced out of the art form they adored. So we built the maison we ourselves had always wanted — one that let you experience Dior, Tom Ford, Creed, Parfums de Marly and Lattafa on your skin, at your terms.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="aspect-[4/3] rounded-sm border border-[color:var(--gold)]/20 gold-gradient shadow-card" />
        </div>
      </section>

      {/* Mission */}
      <section className="border-y border-border bg-section py-20 md:py-28">
        <div className="container-luxury">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-[11px] track-luxury text-[color:var(--gold)]">Our Mission</span>
            <h2 className="mt-3 font-display text-3xl md:text-5xl">
              <span className="gold-text">To democratise the art</span>
              <br className="hidden md:block" /> of luxury fragrance.
            </h2>
            <p className="mt-6 leading-relaxed text-muted-foreground md:text-lg">
              We exist to place the world's greatest perfumes on the skin of every Bangladeshi who longs to wear them — through authentic decants, honest pricing, and an atelier standard of care from the moment you order to the moment you unbox.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-3">
            {[
              { Icon: Target, t: "Curate", d: "A focused edit of fragrances chosen by perfumers and enthusiasts — never by algorithm or trend." },
              { Icon: Sparkles, t: "Decant", d: "Hand-portioned in a sterile atelier into laboratory-grade glass, sealed and labelled with lot traceability." },
              { Icon: Globe2, t: "Deliver", d: "Discreetly packaged and dispatched within 24 hours, nationwide, so your scent arrives ready to wear." },
            ].map(({ Icon, t, d }, i) => (
              <motion.div key={t} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-sm border border-[color:var(--gold)]/20 bg-card p-7 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/10 text-[color:var(--gold)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-xl">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="container-luxury py-20 md:py-28">
        <div className="text-center">
          <span className="text-[11px] track-luxury text-[color:var(--gold)]">What We Stand For</span>
          <h2 className="mt-3 font-display text-3xl md:text-4xl">The Pillars of the Maison</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Four principles guide every bottle we open, every vial we seal, and every parcel we send.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {values.map(({ Icon, t, d }, i) => (
            <motion.div key={t} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="group rounded-sm border border-[color:var(--gold)]/15 bg-card p-7 transition-all hover:border-[color:var(--gold)]/40 hover:shadow-card">
              <Icon className="h-7 w-7 text-[color:var(--gold)] transition-transform group-hover:scale-110" />
              <h3 className="mt-5 font-display text-xl">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Journey / Milestones */}
      <section className="border-t border-border bg-section py-20 md:py-28">
        <div className="container-luxury">
          <div className="text-center">
            <span className="text-[11px] track-luxury text-[color:var(--gold)]">The Journey</span>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">From a Single Bottle to a Boutique</h2>
          </div>

          <div className="relative mx-auto mt-16 max-w-3xl">
            <div className="absolute left-4 top-0 h-full w-px bg-[color:var(--gold)]/30 md:left-1/2" aria-hidden />
            <div className="space-y-10">
              {milestones.map((m, i) => (
                <motion.div key={m.year} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className={`relative flex flex-col gap-4 md:flex-row md:items-center ${i % 2 === 0 ? "md:justify-start" : "md:flex-row-reverse"}`}>
                  <div className="absolute left-4 top-2 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-[color:var(--gold)] shadow-[0_0_0_4px_var(--background)] md:left-1/2" aria-hidden />
                  <div className={`ml-10 md:ml-0 md:w-1/2 ${i % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"}`}>
                    <div className="font-display text-3xl gold-text">{m.year}</div>
                    <h3 className="mt-1 font-display text-xl">{m.t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.d}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Promise */}
      <section className="container-luxury py-20 md:py-28">
        <div className="mx-auto grid max-w-5xl gap-10 rounded-sm border border-[color:var(--gold)]/20 bg-card p-8 md:grid-cols-[auto_1fr] md:items-center md:gap-14 md:p-14">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/10 text-[color:var(--gold)] md:h-32 md:w-32">
            <Award className="h-10 w-10 md:h-14 md:w-14" />
          </div>
          <div>
            <span className="text-[11px] track-luxury text-[color:var(--gold)]">The FRAG AVENUE Promise</span>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">100% Authentic. Or Your Money Back.</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              If any decant you receive from us is not exactly as the house intended, we will refund you in full — no questions, no delays. That is not a policy. It is the entire reason this maison exists.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-foreground py-20 text-background md:py-28">
        <div className="container-luxury text-center">
          <h2 className="font-display text-3xl md:text-5xl">
            <span className="gold-text">The Avenue Awaits</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-background/70">
            Whether you are building a wardrobe of scents or searching for the one that will become your signature — your next chapter begins with a single vial.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/shop" className="btn-liquid inline-flex">Explore the Boutique</Link>
            <Link to="/about" className="inline-flex items-center border border-[color:var(--gold)]/40 px-8 py-3 text-[11px] track-luxury text-[color:var(--gold-soft)] transition-colors hover:bg-[color:var(--gold)]/10">
              About the Maison
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
