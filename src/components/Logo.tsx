import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/frag-avenue-logo.png.asset.json";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      aria-label="Frag Avenue — Wear Your Signature"
      className="group inline-flex items-center justify-center"
    >
      <img
        src={logoAsset.url}
        alt="Frag Avenue — Wear Your Signature"
        draggable={false}
        decoding="async"
        loading="eager"
        fetchPriority="high"
        className={[
          "block w-auto select-none object-contain",
          "transition-[transform,filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "will-change-transform [transform:translateZ(0)]",
          "group-hover:scale-[1.035]",
          "group-hover:[filter:drop-shadow(0_0_14px_color-mix(in_oklab,var(--gold)_45%,transparent))_brightness(1.05)]",
          "motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-hover:[filter:none]",
          compact ? "h-9 sm:h-10" : "h-11 sm:h-14 lg:h-16",
        ].join(" ")}
      />
    </Link>
  );
}
