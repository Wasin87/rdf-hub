import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/our-story")({
  head: () => ({
    meta: [
      { title: "Our Story — FRAG AVENUE" },
      { name: "description", content: "The story behind FRAG AVENUE — a luxury fragrance maison curating authentic decants from the world's most prestigious houses." },
      { property: "og:title", content: "Our Story — FRAG AVENUE" },
      { property: "og:description", content: "The story behind FRAG AVENUE — a luxury fragrance maison." },
    ],
  }),
  component: OurStoryPage,
});

function OurStoryPage() {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-foreground py-28 text-background">
        <div className="container-luxury text-center">
          <span className="text-[11px] track-luxury text-[color:var(--gold-soft)]">The Maison</span>
          <h1 className="mt-4 font-display text-5xl md:text-7xl">
            <span className="gold-text">Our Story</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-background/75">
            A devotion to scent. A pursuit of authenticity. A boutique built for those who understand that fragrance is the most intimate luxury one can wear.
          </p>
        </div>
      </section>

      {/* Chapter 1 */}
      <section className="container-luxury py-24">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <span className="text-[11px] track-luxury text-[color:var(--gold)]">Chapter I</span>
            <h2 className="mt-3 font-display text-4xl">A House Born of Obsession</h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              FRAG AVENUE began with a single bottle, a private collection, and an unshakable conviction: the most exquisite fragrances in the world should not be locked behind impossible price tags. We curate, we decant, we deliver — with the same reverence the perfumer poured into every drop.
            </p>
          </div>
          <div className="aspect-[4/3] rounded-sm border border-[color:var(--gold)]/20 gold-gradient" />
        </div>
      </section>

      {/* Chapter 2 */}
      <section className="bg-section py-24">
        <div className="container-luxury grid gap-12 md:grid-cols-2 md:items-center">
          <div className="aspect-[4/3] rounded-sm border border-[color:var(--gold)]/20 bg-card md:order-1" />
          <div className="md:order-2">
            <span className="text-[11px] track-luxury text-[color:var(--gold)]">Chapter II</span>
            <h2 className="mt-3 font-display text-4xl">Authenticity, Without Compromise</h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              Every fragrance in our boutique is sourced from authorised channels and verified before it touches a decant. From Dior to Creed, from Lattafa to Tom Ford — what you receive is exactly what the house intended.
            </p>
          </div>
        </div>
      </section>

      {/* Chapter 3 */}
      <section className="container-luxury py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-[11px] track-luxury text-[color:var(--gold)]">Chapter III</span>
          <h2 className="mt-3 font-display text-4xl">The Avenue Awaits</h2>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            Whether you are an aficionado building a wardrobe of scents, or a curious soul searching for your signature — FRAG AVENUE is your address.
          </p>
          <Link to="/shop" className="btn-liquid mt-9 inline-flex">Explore the Boutique</Link>
        </div>
      </section>
    </div>
  );
}
