import { motion } from "framer-motion";

export function LuxuryLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="grid min-h-[40vh] place-items-center py-16">
      <div className="flex flex-col items-center gap-5">
        <div className="relative grid h-20 w-20 place-items-center">
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-[color:var(--gold)]/20"
            aria-hidden
          />
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-[color:var(--gold)] border-r-[color:var(--gold)]"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0.6, scale: 0.94 }}
            animate={{ opacity: [0.6, 1, 0.6], scale: [0.94, 1, 0.94] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            className="font-display text-lg tracking-[0.18em] text-[color:var(--gold)]"
          >
            RDF
          </motion.div>
        </div>
        <div className="text-[10px] track-luxury text-muted-foreground">{label}…</div>
      </div>
    </div>
  );
}

export function InlineLoader() {
  return (
    <div className="flex items-center justify-center gap-3 py-6">
      <motion.span
        className="h-3 w-3 rounded-full border-2 border-transparent border-t-[color:var(--gold)] border-r-[color:var(--gold)]"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
      />
      <span className="text-[10px] track-luxury text-muted-foreground">Loading</span>
    </div>
  );
}
