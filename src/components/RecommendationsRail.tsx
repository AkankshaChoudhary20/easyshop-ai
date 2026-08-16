"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

interface Recommendation {
  id: number;
  title: string;
  price: number;
  reason: string;
}

interface Props {
  productId?: number;
  cartProductIds?: number[];
}

// Cross-sell rail — fetches from /api/ai/recommendations, which constrains
// the model to a real candidate set fetched from the DB (see that route for
// the validate-before-use logic). Renders nothing if AI is unavailable or
// there's nothing to recommend, rather than showing an error state.
export function RecommendationsRail({ productId, cartProductIds }: Props) {
  const [items, setItems] = useState<Recommendation[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/ai/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productId ? { productId } : { cartProductIds }),
        });
        if (!res.ok) {
          if (!cancelled) setItems([]);
          return;
        }
        const data = await res.json();
        if (!cancelled) setItems(data.recommendations || []);
      } catch {
        if (!cancelled) setItems([]);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [productId, cartProductIds]);

  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium flex items-center gap-1.5">
        <Sparkles size={14} className="text-brand" /> You might also like
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.map((r) => (
          <Link
            key={r.id}
            href={`/products/${r.id}`}
            className="es-card p-3 min-w-[180px] max-w-[180px] shrink-0 hover:border-brand/40 transition"
          >
            <p className="text-sm font-medium line-clamp-2">{r.title}</p>
            <p className="text-sm font-semibold mt-1">${r.price.toFixed(2)}</p>
            <p className="text-xs text-ink-400 mt-1 line-clamp-2">{r.reason}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
