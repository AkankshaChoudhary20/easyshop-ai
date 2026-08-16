import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { isValidCategory } from "@/lib/validation/catalog";
import { ProductGrid } from "@/components/ProductGrid";
import type { Product } from "@/types/product";

export default async function CategoryPage({ params }: { params: { category: string } }) {
  if (!isValidCategory(params.category)) notFound();

  const { rows } = await query<Product>(
    "SELECT * FROM products WHERE category = $1 ORDER BY id",
    [params.category],
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-2xl font-semibold capitalize">{params.category}</h1>
      <ProductGrid products={rows} />
    </div>
  );
}
