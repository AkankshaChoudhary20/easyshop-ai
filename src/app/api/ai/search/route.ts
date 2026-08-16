import { NextRequest, NextResponse } from "next/server";
import { aiEnabled, callClaudeJSON } from "@/lib/ai/client";
import { aiUnavailableResponse, handleAIError } from "@/lib/ai/errors";
import { buildSearchPrompt, SearchFilterSchema } from "@/lib/ai/prompts";
import { isValidCategory, normalizePriceRange } from "@/lib/validation/catalog";
import { query } from "@/lib/db";
import { CATEGORIES, type Product } from "@/types/product";

// AI product search: Claude translates a natural-language query into a
// structured filter, which we then validate and run as a parameterized SQL
// query — never trusting the model's output directly. The plain
// GET /api/products?q=... endpoint (see products/route.ts) is the literal
// fallback the frontend uses when this returns 503.
export async function POST(req: NextRequest) {
  if (!aiEnabled) return aiUnavailableResponse();

  const body = await req.json().catch(() => null);
  const q = body?.query;
  if (!q || typeof q !== "string") {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  let filter;
  try {
    const { system, user } = buildSearchPrompt(q, [...CATEGORIES]);
    filter = await callClaudeJSON(system, user, SearchFilterSchema);
  } catch (err) {
    return handleAIError(err);
  }

  // Validate before use — the model's structured output is never trusted
  // as automatically safe to interpolate into a query.
  const category = isValidCategory(filter.category) ? filter.category : null;
  const [minPrice, maxPrice] = normalizePriceRange(filter.minPrice, filter.maxPrice);
  const keyword = filter.keyword?.trim() || null;

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
  if (keyword) {
    conditions.push(`(title ILIKE '%' || $${i} || '%' OR description ILIKE '%' || $${i} || '%')`);
    params.push(keyword);
    i++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const { rows } = await query<Product>(`SELECT * FROM products ${where} ORDER BY id`, params);

  return NextResponse.json({
    results: rows,
    filter: { category, minPrice, maxPrice, keyword },
  });
}
