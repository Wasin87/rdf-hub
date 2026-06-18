import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  productId: string;
  variantId: string;
  productSlug: string;
  productName: string;
  brandName: string;
  sizeMl: number;
  price: number;
  quantity: number;
  imageUrl: string;
};

type CartStore = {
  items: CartLine[];
  add: (line: CartLine) => void;
  remove: (variantId: string) => void;
  setQty: (variantId: string, q: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
};

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (line) =>
        set((s) => {
          const existing = s.items.find((i) => i.variantId === line.variantId);
          if (existing) {
            return { items: s.items.map((i) => i.variantId === line.variantId ? { ...i, quantity: i.quantity + line.quantity } : i) };
          }
          return { items: [...s.items, line] };
        }),
      remove: (variantId) => set((s) => ({ items: s.items.filter((i) => i.variantId !== variantId) })),
      setQty: (variantId, q) => set((s) => ({
        items: q <= 0
          ? s.items.filter((i) => i.variantId !== variantId)
          : s.items.map((i) => i.variantId === variantId ? { ...i, quantity: q } : i),
      })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((n, i) => n + i.quantity, 0),
      subtotal: () => get().items.reduce((n, i) => n + i.price * i.quantity, 0),
    }),
    { name: "rdf-cart" },
  ),
);
