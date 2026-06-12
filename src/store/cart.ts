"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  sizeLabel?: string;
  sku?: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string, sizeLabel?: string) => void;
  updateQty: (id: string, sizeLabel: string | undefined, qty: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (item) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.id === item.id && i.sizeLabel === item.sizeLabel
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id && i.sizeLabel === item.sizeLabel
                  ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: item.quantity || 1 }] };
        });
      },
      removeItem: (id, sizeLabel) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.id === id && i.sizeLabel === sizeLabel)
          ),
        }));
      },
      updateQty: (id, sizeLabel, qty) => {
        if (qty <= 0) {
          get().removeItem(id, sizeLabel);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id && i.sizeLabel === sizeLabel ? { ...i, quantity: qty } : i
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: "marjan-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
