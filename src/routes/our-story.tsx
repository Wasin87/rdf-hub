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

const pillars = [
  { Icon: Target, t: "Curate", d: "A focused edit of fragrances chosen by perfumers and enthusiasts — never by algorithm or trend." },
  { Icon: Sparkles, t: "Decant", d: "Hand-portioned in a sterile atelier into laboratory-grade glass, sealed and labelled with lot traceability." },
  { Icon: Globe2, t: "Deliver", d: "Discreetly packaged and dispatched within 24 hours, nationwide, so your scent arrives ready to wear." },
];

function OurStoryPage() {
  return (
    <div className="bg-background text-foreground">
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* subtle theme-aware backdrop */}
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--gold)_18%,transparent),transparent_65%)] blur-3xl" />
        </div>

        <div className="container-luxury relative py-24 md:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 text-[11px] track-luxury text-[color:var(--gold)]"
            >
              <span className="h-px w-8 bg-[color:var(--gold)]/60" />
              Est. Dhaka · 2022
              <span className="h-px w-8 bg-[color:var(--gold)]/60" />
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-6 font-display text-5xl leading-[1.05] md:text-7xl lg:text-8xl"
            >
              <span className="text-foreground">The House of</span>
              <br />
              <span className="gold-text italic">FRAG AVENUE</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg"
            >
              A devotion to scent. A pursuit of authenticity. A boutique built for those who
              understand that fragrance is the most intimate luxury one can wear.
            </motion.p>
          </div>
        </div>

        {/* hairline divider */}
        <div className="mx-auto h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-[color:var(--gold)]/40 to-transparent" />
      </section>

      {/* ── Chapter I — Origin (editorial two-col) ───── */}
      <section className="container-luxury py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-12 md:gap-16">
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="md:col-span-4"
          >
            <div className="sticky top-24">
              <div className="font-display text-[110px] leading-none text-[color:var(--gold)]/25 md:text-[160px]">
                I
              </div>
              <p className="text-[11px] track-luxury text-[color:var(--gold)]">Chapter One</p>
              <h2 className="mt-2 font-display text-3xl md:text-4xl">The Origin</h2>
            </div>
          </motion.aside>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-8"
          >
            <p className="font-display text-2xl leading-snug text-foreground md:text-3xl">
              A house born of obsession — and a stubborn belief that the world's
              greatest perfumes belong on the skin of anyone who longs to wear them.
            </p>
            <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-muted-foreground md:text-base">
              <p>
                FRAG AVENUE began with a single bottle of Creed Aventus, a private
                collection that quietly grew into hundreds, and an unshakable
                conviction: the most exquisite fragrances in the world should not be
                locked behind impossible price tags or unreachable borders.
              </p>
              <p>
                In a country where a single 100ml bottle of niche perfume can cost
                more than a month's rent, we saw an entire generation of scent-lovers
                priced out of the art form they adored. So we built the maison we
                ourselves had always wanted — one that lets you experience Dior, Tom
                Ford, Creed, Parfums de Marly and Lattafa on your skin, at your terms.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Mission ──────────────────────────────────── */}
      <section className="border-y border-border bg-section py-20 md:py-28">
        <div className="container-luxury">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-[11px] track-luxury text-[color:var(--gold)]">Our Mission</span>
            <h2 className="mt-3 font-display text-3xl leading-tight md:text-5xl">
              <span className="gold-text">To democratise the art</span>
              <br className="hidden md:block" />
              <span className="text-foreground"> of luxury fragrance.</span>
            </h2>
            <p className="mt-6 leading-relaxed text-muted-foreground md:text-lg">
              We exist to place the world's greatest perfumes on the skin of every
              Bangladeshi who longs to wear them — through authentic decants, honest
              pricing, and an atelier standard of care from the moment you order to
              the moment you unbox.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-3">
            {pillars.map(({ Icon, t, d }, i) => (
              <motion.div
                key={t}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative overflow-hidden rounded-sm border border-[color:var(--gold)]/20 bg-card p-7 text-center transition-all hover:border-[color:var(--gold)]/50 hover:shadow-card"
              >
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/10 text-[color:var(--gold)] transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-xl text-foreground">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values / Pillars ─────────────────────────── */}
      <section className="container-luxury py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] track-luxury text-[color:var(--gold)]">What We Stand For</span>
          <h2 className="mt-3 font-display text-3xl md:text-4xl text-foreground">The Pillars of the Maison</h2>
          <p className="mx-auto mt-4 text-muted-foreground">
            Four principles guide every bottle we open, every vial we seal, and every parcel we send.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {values.map(({ Icon, t, d }, i) => (
            <motion.div
              key={t}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group relative rounded-sm border border-[color:var(--gold)]/15 bg-card p-7 transition-all hover:-translate-y-1 hover:border-[color:var(--gold)]/45 hover:shadow-card"
            >
              <div className="mb-1 font-display text-xs text-[color:var(--gold)]/50">
                0{i + 1}
              </div>
              <Icon className="h-7 w-7 text-[color:var(--gold)] transition-transform group-hover:scale-110" />
              <h3 className="mt-5 font-display text-xl text-foreground">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Journey Timeline ─────────────────────────── */}
      <section className="border-t border-border bg-section py-20 md:py-28">
        <div className="container-luxury">
          <div className="text-center">
            <span className="text-[11px] track-luxury text-[color:var(--gold)]">The Journey</span>
            <h2 className="mt-3 font-display text-3xl md:text-4xl text-foreground">
              From a Single Bottle to a Boutique
            </h2>
          </div>

          <div className="relative mx-auto mt-16 max-w-3xl">
            <div
              className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-transparent via-[color:var(--gold)]/40 to-transparent md:left-1/2"
              aria-hidden
            />
            <div className="space-y-10">
              {milestones.map((m, i) => (
                <motion.div
                  key={m.year}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={`relative flex flex-col gap-4 md:flex-row md:items-center ${
                    i % 2 === 0 ? "md:justify-start" : "md:flex-row-reverse"
                  }`}
                >
                  <div
                    className="absolute left-4 top-2 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-[color:var(--gold)] shadow-[0_0_0_4px_var(--background)] md:left-1/2"
                    aria-hidden
                  />
                  <div
                    className={`ml-10 md:ml-0 md:w-1/2 ${
                      i % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"
                    }`}
                  >
                    <div className="font-display text-3xl gold-text">{m.year}</div>
                    <h3 className="mt-1 font-display text-xl text-foreground">{m.t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.d}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Promise ──────────────────────────────────── */}
      <section className="container-luxury py-20 md:py-28">
        <div className="mx-auto grid max-w-5xl gap-10 rounded-sm border border-[color:var(--gold)]/25 bg-card p-8 shadow-card md:grid-cols-[auto_1fr] md:items-center md:gap-14 md:p-14">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/10 text-[color:var(--gold)] md:h-32 md:w-32">
            <Award className="h-10 w-10 md:h-14 md:w-14" />
          </div>
          <div>
            <span className="text-[11px] track-luxury text-[color:var(--gold)]">The FRAG AVENUE Promise</span>
            <h2 className="mt-3 font-display text-3xl md:text-4xl text-foreground">
              100% Authentic. Or Your Money Back.
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              If any decant you receive from us is not exactly as the house intended, we will
              refund you in full — no questions, no delays. That is not a policy. It is the
              entire reason this maison exists.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-border py-20 md:py-28">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--gold)_18%,transparent),transparent_65%)] blur-3xl" />
        </div>
        <div className="container-luxury relative text-center">
          <h2 className="font-display text-3xl md:text-5xl">
            <span className="gold-text">The Avenue Awaits</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Whether you are building a wardrobe of scents or searching for the one that will
            become your signature — your next chapter begins with a single vial.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/shop" className="btn-liquid inline-flex">Explore the Boutique</Link>
            <Link
              to="/about"
              className="inline-flex items-center border border-[color:var(--gold)]/40 px-8 py-3 text-[11px] track-luxury text-[color:var(--gold)] transition-colors hover:bg-[color:var(--gold)]/10"
            >
              About the Maison
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
