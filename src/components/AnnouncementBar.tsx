import { motion } from "framer-motion";

export function AnnouncementBar() {
  const messages = [
    "Complimentary shipping on orders over ৳ 5,000",
    "Authenticity guaranteed — sourced direct from boutiques",
    "Now offering 3ml • 6ml • 10ml • 15ml • 30ml decants",
  ];
  return (
    <div className="bg-foreground text-background">
      <div className="container-luxury flex h-9 items-center justify-center overflow-hidden">
        <motion.div
          className="flex gap-16"
          animate={{ x: [0, -800] }}
          transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
        >
          {[...messages, ...messages, ...messages].map((m, i) => (
            <span key={i} className="whitespace-nowrap text-[10px] track-luxury text-background/80">
              <span className="text-[color:var(--gold-soft)]">✦</span> {m}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
