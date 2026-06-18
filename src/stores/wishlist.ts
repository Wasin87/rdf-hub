import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WishlistItem = {
  productId: string;
  productSlug: string;
  productName: string;
  brandName: string;
  imageUrl: string;
  basePrice: number;
  discountPercent: number;
};

type WishlistStore = {
  items: WishlistItem[];
  toggle: (item: WishlistItem) => void;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
  count: () => number;
};

export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) => set((s) => ({
        items: s.items.some((i) => i.productId === item.productId)
          ? s.items.filter((i) => i.productId !== item.productId)
          : [...s.items, item],
      })),
      remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      has: (productId) => get().items.some((i) => i.productId === productId),
      clear: () => set({ items: [] }),
      count: () => get().items.length,
    }),
    { name: "rdf-wishlist" },
  ),
);
