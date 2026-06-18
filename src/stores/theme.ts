import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark";

type ThemeStore = {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
};

export const useTheme = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: "light",
      toggle: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
      setTheme: (t) => set({ theme: t }),
    }),
    { name: "rdf-theme" },
  ),
);
