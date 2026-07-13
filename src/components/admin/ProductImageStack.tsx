import { useEffect, useState } from "react";
import { PackageX } from "lucide-react";
import { resolveImage } from "@/lib/catalog";

export type StackItem = {
  id: string;
  image_url?: string | null;
  product_name?: string | null;
};

type Size = "sm" | "md" | "lg";

const SIZE_MAP: Record<Size, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

function StackTile({
  src,
  alt,
  sizeClass,
}: {
  src: string | null | undefined;
  alt: string;
  sizeClass: string;
}) {
  const resolved = src ? resolveImage(src) : null;
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [resolved]);

  const showFallback = !resolved || failed;

  return (
    <div
      className={`relative ${sizeClass} shrink-0 overflow-hidden rounded-xl border-2 border-card bg-secondary shadow-sm`}
      title={alt}
    >
      {!showFallback && !loaded && (
        <div className="absolute inset-0 animate-pulse bg-secondary" aria-hidden="true" />
      )}
      {showFallback ? (
        <div className="grid h-full w-full place-items-center text-muted-foreground" aria-hidden="true">
          <PackageX className="h-4 w-4" />
        </div>
      ) : (
        <img
          src={resolved!}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

export function ProductImageStack({
  items,
  max = 3,
  size = "md",
  className = "",
}: {
  items: StackItem[];
  max?: number;
  size?: Size;
  className?: string;
}) {
  const sizeClass = SIZE_MAP[size];
  const visible = items.slice(0, max);
  const overflow = items.length - visible.length;

  if (items.length === 0) {
    return (
      <div className={`flex -space-x-2 ${className}`}>
        <StackTile src={null} alt="No items" sizeClass={sizeClass} />
      </div>
    );
  }

  return (
    <div className={`flex -space-x-2 shrink-0 ${className}`}>
      {visible.map((it) => (
        <StackTile
          key={it.id}
          src={it.image_url}
          alt={it.product_name ?? "Product"}
          sizeClass={sizeClass}
        />
      ))}
      {overflow > 0 && (
        <div
          className={`grid ${sizeClass} shrink-0 place-items-center rounded-xl border-2 border-card bg-[color:var(--gold)]/10 text-[10px] font-bold text-[color:var(--gold)] shadow-sm`}
          aria-label={`${overflow} more`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
