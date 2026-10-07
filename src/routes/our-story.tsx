import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, Globe2, HandHeart, Heart, Target, Compass } from "lucide-react";

export const Route = createFileRoute("/our-story")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Our Story — FRAG AVENUE" },
      { name: "description", content: "FRAG AVENUE — a new brand born of passion, built to connect scents with our community locally and across the world." },
      { property: "og:title", content: "Our Story — FRAG AVENUE" },
      { property: "og:description", content: "A new brand with a clear mission and vision — connecting scents with people, powered purely by passion." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OurStoryPage,
});

const pillars = [
  { Icon: Target, t: "Mission", d: "To connect the world of fragrance with our local community — friends, family and beyond — and to share the language of scent with everyone who wants to listen." },
  { Icon: Compass, t: "Vision", d: "To grow, one bottle at a time, from a small local passion project into a trusted name in the international fragrance marketplace." },
  { Icon: Heart, t: "The Truth", d: "But the main point is simple — this is, above everything else, just a passion." },
];

const values = [
  { Icon: Sparkles, t: "Passion First", d: "Every choice we make begins with love for the craft — not with a spreadsheet." },
  { Icon: HandHeart, t: "Community", d: "We built this for our friends, our family, and every person nearby who ever wanted to try something extraordinary." },
  { Icon: Globe2, t: "Global Ambition", d: "A small brand today, with a quiet plan to stand alongside the world's finest tomorrow." },
];

function OurStoryPage() {
  return (
    <div className="bg-background text-foreground">
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative overflow-hidden">
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
              A new brand · Built on passion
              <span className="h-px w-8 bg-[color:var(--gold)]/60" />
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl"
            >
              <span className="text-foreground">This is the story of</span>
              <br />
              <span className="gold-text">FRAG AVENUE</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg"
            >
              A new brand with a specific mission and a clear vision — quietly building
              something we believe in, one scent at a time.
            </motion.p>
          </div>
        </div>

        <div className="mx-auto h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-[color:var(--gold)]/40 to-transparent" />
      </section>

      {/* ── Our Story (verbatim, elevated) ─────────────── */}
      <section className="container-luxury py-20 md:py-28">
        <div className="mx-auto max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[11px] track-luxury text-[color:var(--gold)]"
          >
            Our Story
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-4 text-3xl font-semibold leading-tight tracking-tight md:text-5xl"
          >
            A young brand with a very clear <span className="gold-text">why</span>.
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-10 space-y-6 text-lg leading-relaxed text-muted-foreground md:text-xl"
          >
            <p>
              <span className="font-semibold text-foreground">Franavenue</span> is a
              new brand with some specific missions and a clear vision.
            </p>
            <p>
              Our goal is to <span className="text-foreground">connect the smells</span>{" "}
              with our local community — with friends, with family — and to grow, step
              by step, into the international marketplace.
            </p>
            <p className="border-l-2 border-[color:var(--gold)]/60 pl-5 italic text-foreground">
              But the main point is that it’s just a passion.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Mission · Vision · Truth ─────────────────── */}
      <section className="border-y border-border bg-section py-20 md:py-28">
        <div className="container-luxury">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[11px] track-luxury text-[color:var(--gold)]">What Drives Us</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Mission, Vision, and the honest truth.
            </h2>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-3">
            {pillars.map(({ Icon, t, d }, i) => (
              <motion.div
                key={t}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative overflow-hidden rounded-sm border border-[color:var(--gold)]/20 bg-card p-8 transition-all hover:-translate-y-1 hover:border-[color:var(--gold)]/50 hover:shadow-card"
              >
                <div className="grid h-12 w-12 place-items-center rounded-full border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/10 text-[color:var(--gold)] transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-tight text-foreground">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ───────────────────────────────────── */}
      <section className="container-luxury py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] track-luxury text-[color:var(--gold)]">What We Believe</span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Three quiet principles.
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {values.map(({ Icon, t, d }, i) => (
            <motion.div
              key={t}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group relative rounded-sm border border-[color:var(--gold)]/15 bg-card p-7 transition-all hover:-translate-y-1 hover:border-[color:var(--gold)]/45 hover:shadow-card"
            >
              <div className="mb-1 text-xs font-semibold text-[color:var(--gold)]/70">0{i + 1}</div>
              <Icon className="h-7 w-7 text-[color:var(--gold)] transition-transform group-hover:scale-110" />
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-border py-20 md:py-28">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--gold)_18%,transparent),transparent_65%)] blur-3xl" />
        </div>
        <div className="container-luxury relative text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
            <span className="gold-text">Come walk the Avenue.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            The brand is young. The passion is real. The rest, we are building — with you.
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
