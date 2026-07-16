import { motion, AnimatePresence } from "framer-motion";
import { Sun } from "lucide-react";
import { MdOutlineDarkMode } from "react-icons/md";
import { useTheme } from "@/stores/theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-full text-foreground transition-all duration-300 hover:scale-110 hover:bg-secondary hover:text-[color:var(--gold)] active:scale-95"
    >

      <AnimatePresence mode="wait" initial={false}>
        {theme === "dark" ? (
          <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.3 }}>
            <Sun className="h-4 w-4" />
          </motion.span>
        ) : (
          <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.3 }}>
            <MdOutlineDarkMode className="h-4 w-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
