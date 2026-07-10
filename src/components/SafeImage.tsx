import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { resolveImage } from "@/lib/catalog";

type SafeImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
  wrapperClassName?: string;
  showLoader?: boolean;
};

export function SafeImage({ src, alt = "", className = "", wrapperClassName = "", showLoader = true, onLoad, onError, ...props }: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(resolveImage(src));
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(resolveImage(src));
    setLoaded(false);
    setFailed(false);
  }, [src]);

  return (
    <span className={`relative block overflow-hidden bg-secondary ${wrapperClassName}`}>
      {showLoader && !loaded && !failed && <span className="absolute inset-0 animate-pulse bg-secondary" aria-hidden="true" />}
      {failed && (
        <span className="absolute inset-0 z-10 grid place-items-center bg-secondary text-muted-foreground" aria-hidden="true">
          <span className="flex flex-col items-center gap-1 text-[10px] track-luxury">
            <ImageOff className="h-5 w-5 text-[color:var(--gold)]" />
            Image unavailable
          </span>
        </span>
      )}
      <img
        {...props}
        src={currentSrc}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${loaded && !failed ? "opacity-100" : "opacity-0"}`}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
        onError={(event) => {
          onError?.(event);
          if (!failed) {
            setFailed(true);
            setLoaded(false);
          }
        }}
      />
    </span>
  );
}