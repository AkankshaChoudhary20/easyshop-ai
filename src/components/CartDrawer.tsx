"use client";

import Link from "next/link";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { Button } from "./ui/Button";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, updateQty, removeItem, total } = useCart();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white flex flex-col shadow-xl">
        <div className="h-14 px-4 flex items-center justify-between border-b border-ink-100">
          <h2 className="font-medium">Your cart</h2>
          <button onClick={onClose} aria-label="Close cart">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 && <p className="text-sm text-ink-400 text-center mt-8">Your cart is empty.</p>}
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-xs text-ink-400">${item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  className="h-7 w-7 inline-flex items-center justify-center rounded border border-ink-100 hover:bg-ink-50"
                  onClick={() => updateQty(item.productId, item.quantity - 1)}
                  aria-label="Decrease quantity"
                >
                  <Minus size={12} />
                </button>
                <span className="w-6 text-center text-sm">{item.quantity}</span>
                <button
                  className="h-7 w-7 inline-flex items-center justify-center rounded border border-ink-100 hover:bg-ink-50"
                  onClick={() => updateQty(item.productId, item.quantity + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus size={12} />
                </button>
              </div>
              <button
                className="text-ink-400 hover:text-danger"
                onClick={() => removeItem(item.productId)}
                aria-label={`Remove ${item.title}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-ink-100 space-y-3">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          {items.length === 0 ? (
            <Button className="w-full" disabled>
              Checkout
            </Button>
          ) : (
            <Link href="/checkout" onClick={onClose}>
              <Button className="w-full">Checkout</Button>
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
