import { useEffect, useRef, useState } from "react";
import type { ImgHTMLAttributes } from "react";
import { ImageOff } from "lucide-react";
import { resolveImage } from "@/lib/catalog";

type SafeImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
  wrapperClassName?: string;
  showLoader?: boolean;
};

export function SafeImage({ src, alt = "", className = "", wrapperClassName = "", showLoader = true, onLoad, onError, ...props }: SafeImageProps) {
  const resolved = resolveImage(src);
  const [currentSrc, setCurrentSrc] = useState(resolved);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Only reset state when the resolved src actually changes — otherwise
  // a re-render would flip loaded=false and, for cached images that fire
  // no fresh onLoad, leave the <img> stuck at opacity 0 (rendering as a
  // black tile over the bg-secondary wrapper).
  useEffect(() => {
    if (resolved !== currentSrc) {
      setCurrentSrc(resolved);
      setLoaded(false);
      setFailed(false);
    }
  }, [resolved, currentSrc]);

  // Handle browser-cached images that finish loading before React attaches
  // its onLoad handler (common when navigating between routes that share
  // the same image URL, e.g. cart sheet -> checkout summary).
  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    if (el.complete) {
      if (el.naturalWidth > 0) setLoaded(true);
      else if (el.src) setFailed(true);
    }
  }, [currentSrc]);

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
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${loaded && !failed ? "opacity-100" : "opacity-0"}`}
        onLoad={(event) => {
          setLoaded(true);
          setFailed(false);
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