import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { isValidCategory, normalizePriceRange } from "@/lib/validation/catalog";
import type { Product } from "@/types/product";

// Plain literal-filter listing — also the fallback the frontend calls when
// POST /api/ai/search returns 503 (AI not configured).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const categoryParam = searchParams.get("category");
  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");

  const category = isValidCategory(categoryParam) ? categoryParam : null;
  const [minPrice, maxPrice] = normalizePriceRange(
    minPriceParam ? Number(minPriceParam) : null,
    maxPriceParam ? Number(maxPriceParam) : null,
  );

  const conditions: string[] = [];
  const params: unknown[] = [];
  let i = 1;
  if (category) {
    conditions.push(`category = $${i++}`);
    params.push(category);
  }
  if (minPrice !== null) {
    conditions.push(`price >= $${i++}`);
    params.push(minPrice);
  }
  if (maxPrice !== null) {
    conditions.push(`price <= $${i++}`);
    params.push(maxPrice);
  }
  if (q) {
    conditions.push(`(title ILIKE '%' || $${i} || '%' OR description ILIKE '%' || $${i} || '%')`);
    params.push(q);
    i++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const { rows } = await query<Product>(`SELECT * FROM products ${where} ORDER BY id`, params);

  return NextResponse.json({ products: rows });
}

// Ungated for v1 (any logged-in user, no role system) — see README "What's next".
export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const price = typeof body?.price === "number" ? body.price : NaN;
  const category = typeof body?.category === "string" ? body.category : "";
  const imageUrl = typeof body?.image_url === "string" ? body.image_url : null;
  const stock = typeof body?.stock === "number" ? body.stock : 0;

  if (!title || !description || !Number.isFinite(price) || price < 0 || !isValidCategory(category)) {
    return NextResponse.json(
      { error: "title, description, a non-negative price, and a valid category are required" },
      { status: 400 },
    );
  }

  const { rows } = await query<Product>(
    `INSERT INTO products (title, description, price, category, image_url, stock)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [title, description, price, category, imageUrl, stock],
  );

  return NextResponse.json({ product: rows[0] }, { status: 201 });
}
