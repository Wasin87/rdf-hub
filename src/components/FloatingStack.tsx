import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Share2, X, MessageCircle, Send, Facebook, Instagram } from "lucide-react";

const socials = [
  { label: "WhatsApp", href: "https://wa.me/8801000000000", icon: MessageCircle, color: "#25D366" },
  { label: "Telegram", href: "https://t.me/", icon: Send, color: "#0088cc" },
  { label: "Facebook", href: "https://facebook.com/", icon: Facebook, color: "#1877F2" },
  { label: "Instagram", href: "https://instagram.com/", icon: Instagram, color: "#E1306C" },
];

export function FloatingStack() {
  const [showTop, setShowTop] = useState(false);
  const [openSocial, setOpenSocial] = useState(false);

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
      {/* Social fan */}
      <div className="pointer-events-auto relative">
        <AnimatePresence>
          {openSocial && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.25 }}
              className="absolute bottom-14 right-0 flex flex-col gap-2"
            >
              {socials.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.a
                    key={s.label}
                    href={s.href} target="_blank" rel="noreferrer"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: i * 0.04 } }}
                    aria-label={s.label}
                    className="grid h-10 w-10 place-items-center rounded-full border border-[color:var(--gold)]/30 bg-background/90 backdrop-blur shadow-luxury text-foreground transition-all hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
                  >
                    <Icon className="h-4 w-4" style={{ color: s.color }} />
                  </motion.a>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setOpenSocial((v) => !v)}
          aria-label="Social menu"
          className="grid h-12 w-12 place-items-center rounded-full bg-foreground text-background shadow-luxury transition-all hover:bg-[color:var(--gold)] hover:text-[color:var(--gold-foreground)]"
        >
          <AnimatePresence mode="wait">
            {openSocial ? (
              <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X className="h-5 w-5" />
              </motion.span>
            ) : (
              <motion.span key="s" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <Share2 className="h-5 w-5" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Scroll to top"
            className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-[color:var(--gold)]/30 bg-background/90 backdrop-blur text-[color:var(--gold)] shadow-luxury transition-all hover:bg-[color:var(--gold)] hover:text-[color:var(--gold-foreground)]"
          >
            <ArrowUp className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
