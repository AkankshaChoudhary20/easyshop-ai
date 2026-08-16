"use client";

import { createContext, useContext, useEffect, useReducer, type ReactNode } from "react";
import type { CartItem, CartAction } from "./types";

const STORAGE_KEY = "easyshop-ai.cart";

function reducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "ADD_ITEM": {
      const qty = action.quantity ?? 1;
      const existing = state.find((i) => i.productId === action.item.productId);
      if (existing) {
        return state.map((i) =>
          i.productId === action.item.productId ? { ...i, quantity: i.quantity + qty } : i,
        );
      }
      return [...state, { ...action.item, quantity: qty }];
    }
    case "REMOVE_ITEM":
      return state.filter((i) => i.productId !== action.productId);
    case "UPDATE_QTY":
      if (action.quantity <= 0) return state.filter((i) => i.productId !== action.productId);
      return state.map((i) =>
        i.productId === action.productId ? { ...i, quantity: action.quantity } : i,
      );
    case "CLEAR":
      return [];
    case "HYDRATE":
      return action.items;
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQty: (productId: number, quantity: number) => void;
  clear: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(reducer, []);

  // Rehydrate from localStorage on mount (client-only — cart is never
  // server-rendered, so there's no hydration mismatch to worry about).
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        dispatch({ type: "HYDRATE", items: JSON.parse(raw) });
      } catch {
        // ignore malformed stored cart
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value: CartContextValue = {
    items,
    addItem: (item, quantity) => dispatch({ type: "ADD_ITEM", item, quantity }),
    removeItem: (productId) => dispatch({ type: "REMOVE_ITEM", productId }),
    updateQty: (productId, quantity) => dispatch({ type: "UPDATE_QTY", productId, quantity }),
    clear: () => dispatch({ type: "CLEAR" }),
    total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    count: items.reduce((sum, i) => sum + i.quantity, 0),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
