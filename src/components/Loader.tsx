import { motion } from "framer-motion";

export function LuxuryLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="grid min-h-[50vh] place-items-center py-16">
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-16 w-16">
          {/* Outer track */}
          <span className="absolute inset-0 rounded-full border-2 border-[color:var(--gold)]/15" aria-hidden />
          {/* Spinning arc */}
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-[color:var(--gold)]"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
            aria-hidden
          />
          {/* Inner counter-spin */}
          <motion.span
            className="absolute inset-2 rounded-full border border-transparent border-b-[color:var(--gold)]/60"
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
            aria-hidden
          />
          {/* Pulsing dot */}
          <motion.span
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--gold)]"
            animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            aria-hidden
          />
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
        className="h-4 w-4 rounded-full border-2 border-[color:var(--gold)]/20 border-t-[color:var(--gold)]"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
      />
      <span className="text-[10px] track-luxury text-muted-foreground">Loading</span>
    </div>
  );
}
