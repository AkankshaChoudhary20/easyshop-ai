"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "./ui/Button";
import { useCart } from "@/hooks/useCart";
import { useToast } from "./ui/Toast";
import type { Product } from "@/types/product";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { show } = useToast();

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    addItem({
      productId: product.id,
      title: product.title,
      price: Number(product.price),
      image_url: product.image_url,
    });
    show(`Added "${product.title}" to cart`);
  }

  return (
    <Link href={`/products/${product.id}`} className="es-card overflow-hidden flex flex-col hover:border-brand/40 transition group">
      <div className="relative aspect-[3/2] bg-ink-50">
        {product.image_url && (
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover group-hover:scale-[1.02] transition"
          />
        )}
        <span className="es-chip absolute top-2 left-2 bg-white/90 text-ink-600 capitalize">{product.category}</span>
      </div>
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5em]">{product.title}</h3>
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-base font-semibold">${Number(product.price).toFixed(2)}</span>
          <Button variant="secondary" onClick={handleAdd} className="!h-8 !px-2.5">
            <ShoppingCart size={14} />
          </Button>
        </div>
      </div>
    </Link>
  );
}
