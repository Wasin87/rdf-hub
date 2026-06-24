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
    <section className="container-luxury py-12 md:py-20">
      <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
        {items.map(({ icon: Icon, title, description, highlight }) => (
          <div
            key={title}
            className={`text-center transition-all ${
              highlight
                ? "rounded-xl border border-[color:var(--gold)]/25 bg-section p-3 shadow-card sm:p-6 md:p-10"
                : "rounded-xl border border-transparent p-3 sm:p-6 md:p-10"
            }`}
          >
            <div className="mx-auto grid h-8 w-8 place-items-center rounded-full border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/10 text-[color:var(--gold)] sm:h-11 sm:w-11 md:h-14 md:w-14">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </div>
            <h3 className="mt-2 font-display text-[11px] font-semibold leading-tight sm:mt-4 sm:text-base md:mt-5 md:text-xl">{title}</h3>
            <p className="mt-1 hidden text-xs leading-relaxed text-muted-foreground sm:block md:mt-3 md:text-sm">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
