"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import type { Order } from "@/types/order";

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => setOrders(data.orders))
      .catch(() => setOrders([]));
  }, [user]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8 text-sm text-ink-400">Loading…</div>;

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 text-sm text-ink-600">
        You need to{" "}
        <Link href="/login" className="text-brand hover:text-brand-hover">
          log in
        </Link>{" "}
        to view your orders.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-2xl font-semibold">Your orders</h1>

      {orders === null ? (
        <p className="text-sm text-ink-400">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="es-card p-8 text-center text-sm text-ink-400">
          No orders yet.{" "}
          <Link href="/products" className="text-brand hover:text-brand-hover">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="es-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Order #{order.id}</span>
                <span className="es-chip bg-ink-50 text-ink-600 capitalize">{order.status}</span>
              </div>
              <p className="text-xs text-ink-400 mb-2">{new Date(order.created_at).toLocaleString()}</p>
              <ul className="text-sm text-ink-600 space-y-1">
                {order.items?.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>
                      {item.quantity} × {item.title}
                    </span>
                    <span>${(Number(item.price_at_purchase) * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 pt-2 border-t border-ink-100 flex justify-between font-medium text-sm">
                <span>Total</span>
                <span>${Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
