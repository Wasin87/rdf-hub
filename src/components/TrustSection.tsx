import { ShieldCheck, Zap, BadgeDollarSign } from "lucide-react";

const items = [
  {
    icon: ShieldCheck,
    title: "100% Authentic",
    description: "Every fragrance is sourced from authorised channels and verified before it leaves the maison.",
    highlight: false,
  },
  {
    icon: Zap,
    title: "Fast & Reliable Delivery",
    description: "Carefully packed and dispatched within 24 hours — discretion and speed, always.",
    highlight: true,
  },
  {
    icon: BadgeDollarSign,
    title: "Best Price",
    description: "Designer scents at honest prices. Decants from 3ml so you discover before you commit.",
    highlight: false,
  },
];

export function TrustSection() {
  return (
    <section className="container-luxury py-20">
      <div className="grid gap-6 md:grid-cols-3">
        {items.map(({ icon: Icon, title, description, highlight }) => (
          <div
            key={title}
            className={`text-center transition-all ${
              highlight
                ? "rounded-2xl border border-[color:var(--gold)]/25 bg-section p-10 shadow-card"
                : "rounded-2xl border border-transparent p-10"
            }`}
          >
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/10 text-[color:var(--gold)]">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="mt-5 font-display text-xl">{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
