"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ProductSizeCm } from "./productPricing";

export type CartItemSizeOption = {
  sizeCm: ProductSizeCm;
  price: number;
};

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  unitPrice: number;
  // Backward-compatible with persisted carts created before unitPrice.
  price?: number;
  sizeCm?: ProductSizeCm | null;
  sizeOptions?: CartItemSizeOption[];
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
  setSize: (id: string, sizeCm: ProductSizeCm) => void;
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
                  ? {
                      ...item,
                      quantity: item.quantity + quantity,
                      sizeOptions: payload.sizeOptions ?? item.sizeOptions,
                    }
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
      setSize: (id, sizeCm) =>
        set((state) => {
          const currentItem = state.items.find((item) => item.id === id);
          if (!currentItem || !currentItem.sizeOptions?.length) {
            return state;
          }

          const selectedOption = currentItem.sizeOptions.find(
            (option) => option.sizeCm === sizeCm
          );
          if (!selectedOption) {
            return state;
          }

          const nextId = `${currentItem.productId}:${sizeCm}:${selectedOption.price}`;

          if (nextId === currentItem.id) {
            return {
              items: state.items.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      sizeCm,
                      unitPrice: selectedOption.price,
                      price: selectedOption.price,
                    }
                  : item
              ),
            };
          }

          const existingTarget = state.items.find((item) => item.id === nextId);

          if (existingTarget) {
            return {
              items: state.items
                .filter((item) => item.id !== currentItem.id)
                .map((item) =>
                  item.id === nextId
                    ? { ...item, quantity: item.quantity + currentItem.quantity }
                    : item
                ),
            };
          }

          return {
            items: state.items.map((item) =>
              item.id === id
                ? {
                    ...item,
                    id: nextId,
                    sizeCm,
                    unitPrice: selectedOption.price,
                    price: selectedOption.price,
                  }
                : item
            ),
          };
        }),
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
