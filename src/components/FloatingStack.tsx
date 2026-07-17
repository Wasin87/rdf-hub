import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/8801861490608";
const MESSENGER_URL = "https://m.me/fragavenuebd";

export function FloatingStack() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="pointer-events-none fixed right-3 z-40 flex flex-col items-end gap-3 lg:right-6"
      style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
    >
      {/* WhatsApp */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="pointer-events-auto grid h-12 w-12 place-items-center rounded-full shadow-luxury transition-all hover:scale-110"
        style={{ background: "#25D366" }}
      >
        <svg viewBox="0 0 32 32" className="h-6 w-6 fill-white" aria-hidden>
          <path d="M16.003 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.256.59 4.46 1.71 6.4L3.2 28.8l6.587-1.726a12.748 12.748 0 0 0 6.216 1.598h.005c7.06 0 12.8-5.74 12.8-12.8 0-3.42-1.331-6.633-3.748-9.05A12.717 12.717 0 0 0 16.003 3.2zm0 23.36h-.004a10.62 10.62 0 0 1-5.41-1.481l-.388-.23-3.91 1.025 1.044-3.81-.253-.402a10.61 10.61 0 0 1-1.625-5.662c0-5.864 4.77-10.633 10.637-10.633 2.84 0 5.51 1.107 7.518 3.117a10.563 10.563 0 0 1 3.115 7.52c-.002 5.864-4.77 10.556-10.724 10.556zm5.83-7.96c-.32-.16-1.892-.934-2.184-1.041-.293-.107-.506-.16-.72.16-.213.32-.826 1.04-1.013 1.254-.187.213-.373.24-.693.08-.32-.16-1.349-.498-2.57-1.586-.95-.847-1.59-1.892-1.776-2.212-.187-.32-.02-.493.14-.652.144-.143.32-.374.48-.561.16-.187.213-.32.32-.534.107-.213.053-.4-.027-.56-.08-.16-.72-1.733-.987-2.374-.26-.624-.524-.539-.72-.55l-.613-.01a1.18 1.18 0 0 0-.853.4c-.293.32-1.12 1.094-1.12 2.667 0 1.573 1.146 3.094 1.306 3.307.16.213 2.255 3.443 5.467 4.83.764.33 1.36.527 1.825.674.766.243 1.464.21 2.014.127.615-.092 1.892-.773 2.16-1.52.266-.747.266-1.387.186-1.52-.08-.133-.293-.213-.613-.373z"/>
        </svg>
      </a>

      {/* Messenger */}
      <a
        href={MESSENGER_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on Messenger"
        className="pointer-events-auto grid h-12 w-12 place-items-center rounded-full shadow-luxury transition-all hover:scale-110"
        style={{ background: "linear-gradient(135deg, #00B2FF, #006AFF)" }}
      >
        <svg viewBox="0 0 32 32" className="h-6 w-6 fill-white" aria-hidden>
          <path d="M16 3C8.82 3 3 8.43 3 15.13c0 3.82 1.89 7.22 4.84 9.45V29l4.42-2.43c1.18.33 2.43.5 3.74.5 7.18 0 13-5.43 13-12.13S23.18 3 16 3zm1.3 16.34l-3.32-3.54-6.47 3.54 7.12-7.55 3.4 3.54 6.39-3.54-7.12 7.55z"/>
        </svg>
      </a>

      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Scroll to top"
            className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-foreground text-background shadow-luxury transition-all hover:bg-[color:var(--gold)] hover:text-[color:var(--gold-foreground)]"
          >
            <ArrowUp className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
