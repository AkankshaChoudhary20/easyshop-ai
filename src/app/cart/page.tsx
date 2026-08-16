"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/Button";
import { RecommendationsRail } from "@/components/RecommendationsRail";

export default function CartPage() {
  const { items, updateQty, removeItem, total } = useCart();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-semibold">Your cart</h1>

      {items.length === 0 ? (
        <div className="es-card p-8 text-center text-sm text-ink-400">
          Your cart is empty.{" "}
          <Link href="/products" className="text-brand hover:text-brand-hover">
            Browse products
          </Link>
        </div>
      ) : (
        <>
          <div className="es-card divide-y divide-ink-100">
            {items.map((item) => (
              <div key={item.productId} className="p-4 flex items-center gap-4">
                <Link href={`/products/${item.productId}`} className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-ink-400">${item.price.toFixed(2)} each</p>
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    className="h-8 w-8 inline-flex items-center justify-center rounded border border-ink-100 hover:bg-ink-50"
                    onClick={() => updateQty(item.productId, item.quantity - 1)}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    className="h-8 w-8 inline-flex items-center justify-center rounded border border-ink-100 hover:bg-ink-50"
                    onClick={() => updateQty(item.productId, item.quantity + 1)}
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="w-20 text-right text-sm font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
                <button
                  className="text-ink-400 hover:text-danger"
                  onClick={() => removeItem(item.productId)}
                  aria-label={`Remove ${item.title}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Total: ${total.toFixed(2)}</span>
            <Link href="/checkout">
              <Button>Proceed to checkout</Button>
            </Link>
          </div>

          <RecommendationsRail cartProductIds={items.map((i) => i.productId)} />
        </>
      )}
    </div>
  );
}
