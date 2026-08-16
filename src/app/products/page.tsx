"use client";

import { useEffect, useState } from "react";
import { NLSearchBar } from "@/components/NLSearchBar";
import { ProductGrid } from "@/components/ProductGrid";
import type { Product } from "@/types/product";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => setProducts(data.products))
      .catch(() => setProducts([]));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">All products</h1>
        <p className="text-sm text-ink-600 mt-1">Browse the catalog, or search in plain English.</p>
      </div>

      <NLSearchBar onResults={(results) => setProducts(results)} />

      {products === null ? (
        <div className="es-card p-8 text-center text-ink-400 text-sm">Loading…</div>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
