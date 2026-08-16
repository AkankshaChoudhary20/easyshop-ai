"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { notFound, useParams } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RecommendationsRail } from "@/components/RecommendationsRail";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/components/ui/Toast";
import type { Product } from "@/types/product";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { show } = useToast();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setProduct(data?.product ?? null));
  }, [params.id]);

  if (product === null) notFound();
  if (product === undefined) {
    return <div className="max-w-4xl mx-auto px-4 py-8 text-sm text-ink-400">Loading…</div>;
  }

  function handleAdd() {
    if (!product) return;
    addItem(
      { productId: product.id, title: product.title, price: Number(product.price), image_url: product.image_url },
      quantity,
    );
    show(`Added ${quantity} × "${product.title}" to cart`);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="relative aspect-[3/2] bg-ink-50 rounded-card overflow-hidden">
          {product.image_url && (
            <Image src={product.image_url} alt={product.title} fill className="object-cover" />
          )}
        </div>
        <div className="space-y-4">
          <span className="es-chip bg-ink-50 text-ink-600 capitalize">{product.category}</span>
          <h1 className="text-2xl font-semibold">{product.title}</h1>
          <p className="text-sm text-ink-600 leading-relaxed">{product.description}</p>
          <p className="text-2xl font-semibold">${Number(product.price).toFixed(2)}</p>
          <p className="text-xs text-ink-400">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</p>

          <div className="flex items-center gap-3 pt-2">
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="es-input w-20"
            >
              {Array.from({ length: Math.min(10, Math.max(product.stock, 1)) }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <Button onClick={handleAdd} disabled={product.stock === 0}>
              <ShoppingCart size={16} /> Add to cart
            </Button>
          </div>
        </div>
      </div>

      <RecommendationsRail productId={product.id} />
    </div>
  );
}
