"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  quantity: number;
};

type ProductPayload = Omit<CartItem, "quantity">;

type CartState = {
  items: CartItem[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  addItem: (payload: ProductPayload, quantity?: number) => void;
  removeItem: (id: string) => void;
  setQty: (id: string, quantity: number) => void;
  clear: () => void;
};

const storage =
  typeof window !== "undefined"
    ? createJSONStorage<CartState>(() => window.localStorage)
    : undefined;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      addItem: (payload, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((item) => item.id === payload.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.id === payload.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }

          return {
            items: [
              ...state.items,
              { ...payload, quantity: Math.max(quantity, 1) },
            ],
          };
        }),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
      setQty: (id, quantity) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.id === id ? { ...item, quantity: Math.max(quantity, 0) } : item
            )
            .filter((item) => item.quantity > 0),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "efete-calcos-cart",
      storage,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
