import { Link } from "@tanstack/react-router";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-3" aria-label="FRAG AVENUE">
      <span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-full transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.03] group-hover:shadow-[0_0_22px_color-mix(in_oklab,var(--gold)_55%,transparent)]">
        <svg viewBox="0 0 44 44" className="h-11 w-11" aria-hidden>
          <defs>
            <linearGradient id="fag" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--gold-soft)" />
              <stop offset="55%" stopColor="var(--gold)" />
              <stop offset="100%" stopColor="var(--gold-muted)" />
            </linearGradient>
          </defs>
          <circle cx="22" cy="22" r="20" fill="url(#fag)" />
          <circle cx="22" cy="22" r="18" fill="none" stroke="color-mix(in oklab, white 35%, transparent)" strokeWidth="0.6" />
          <text
            x="22" y="28"
            textAnchor="middle"
            fontFamily="Playfair Display, Georgia, serif"
            fontSize="16"
            fontWeight={700}
            fill="var(--gold-foreground)"
            letterSpacing="0.5"
          >FA</text>
        </svg>
      </span>
      {!compact && (
        <span className="hidden flex-col leading-none sm:flex">
          <span className="font-display text-[1.15rem] font-bold tracking-tight text-foreground">FRAG</span>
          <span className="mt-1 text-[0.6rem] font-medium uppercase text-muted-foreground transition-[letter-spacing] duration-500 group-hover:tracking-[0.42em]" style={{ letterSpacing: "0.32em" }}>
            Avenue
          </span>
        </span>
      )}
    </Link>
  );
}
