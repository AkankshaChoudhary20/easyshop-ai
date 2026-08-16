"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <div className="max-w-xl mx-auto px-4 py-8 text-sm text-ink-400">Loading…</div>;

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <p className="text-sm text-ink-600">
          You need to{" "}
          <Link href="/login" className="text-brand hover:text-brand-hover">
            log in
          </Link>{" "}
          to check out.
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 text-sm text-ink-600">
        Your cart is empty.{" "}
        <Link href="/products" className="text-brand hover:text-brand-hover">
          Browse products
        </Link>
      </div>
    );
  }

  async function placeOrder() {
    setPlacing(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Checkout failed");
      clear();
      router.push("/checkout/success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-2xl font-semibold">Checkout</h1>

      <div className="es-card divide-y divide-ink-100">
        {items.map((item) => (
          <div key={item.productId} className="p-3 flex items-center justify-between text-sm">
            <span>
              {item.quantity} × {item.title}
            </span>
            <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="p-3 flex items-center justify-between font-semibold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button onClick={placeOrder} disabled={placing} className="w-full">
        {placing ? "Placing order…" : "Place order"}
      </Button>
    </div>
  );
}
