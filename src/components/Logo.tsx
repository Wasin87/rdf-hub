import { Link } from "@tanstack/react-router";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-3" aria-label="RDF — Rezoan's Decant & Fragrance">
      <span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-sm border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/8 transition-all duration-500 group-hover:border-[color:var(--gold)] group-hover:bg-[color:var(--gold)]/15">
        <svg viewBox="0 0 44 44" className="h-7 w-7" aria-hidden>
          <defs>
            <linearGradient id="rdfg" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--gold-soft)" />
              <stop offset="60%" stopColor="var(--gold)" />
              <stop offset="100%" stopColor="var(--gold-muted)" />
            </linearGradient>
          </defs>
          <text
            x="22" y="29"
            textAnchor="middle"
            fontFamily="Playfair Display, Georgia, serif"
            fontSize="17"
            fontWeight={600}
            fill="url(#rdfg)"
            letterSpacing="1.5"
          >RDF</text>
          <line x1="9" y1="35" x2="35" y2="35" stroke="url(#rdfg)" strokeWidth="0.6" />
        </svg>
      </span>
      {!compact && (
        <span className="hidden flex-col leading-tight sm:flex">
          <span className="font-display text-[1.05rem] font-semibold tracking-tight text-foreground">RDF</span>
          <span className="text-[0.58rem] track-luxury text-muted-foreground">Rezoan's Decant &amp; Fragrance</span>
        </span>
      )}
    </Link>
  );
}
