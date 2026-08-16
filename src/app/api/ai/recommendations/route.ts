import { NextRequest, NextResponse } from "next/server";
import { aiEnabled, callClaudeJSON } from "@/lib/ai/client";
import { aiUnavailableResponse, handleAIError } from "@/lib/ai/errors";
import { buildRecommendationsPrompt, RecommendationsSchema, type CandidateProduct } from "@/lib/ai/prompts";
import { query } from "@/lib/db";

const CANDIDATE_LIMIT = 20;

// AI recommendations: fetches a real candidate set from the DB first, sends
// only id/title/price to Claude, then validates every returned id is
// actually in that candidate set before responding — title/price in the
// response are re-hydrated from the DB rows already fetched, never taken
// from the model's output, so even a hallucinated title/price is discarded.
export async function POST(req: NextRequest) {
  if (!aiEnabled) return aiUnavailableResponse();

  const body = await req.json().catch(() => null);
  const productId = typeof body?.productId === "number" ? body.productId : null;
  const cartProductIds: number[] = Array.isArray(body?.cartProductIds)
    ? body.cartProductIds.filter((id: unknown) => typeof id === "number")
    : [];

  if (!productId && cartProductIds.length === 0) {
    return NextResponse.json({ error: "productId or cartProductIds is required" }, { status: 400 });
  }

  const excludeIds = productId ? [productId, ...cartProductIds] : cartProductIds;
  let candidates: CandidateProduct[];
  let contextLabel: string;

  try {
    if (productId) {
      const { rows: current } = await query<{ title: string; category: string }>(
        "SELECT title, category FROM products WHERE id = $1",
        [productId],
      );
      if (current.length === 0) {
        return NextResponse.json({ error: "product not found" }, { status: 404 });
      }
      contextLabel = current[0].title;
      const { rows } = await query<CandidateProduct>(
        `SELECT id, title, price FROM products
         WHERE category = $1 AND id != ALL($2::int[])
         ORDER BY id LIMIT $3`,
        [current[0].category, excludeIds, CANDIDATE_LIMIT],
      );
      candidates = rows.map((r) => ({ ...r, price: Number(r.price) }));
    } else {
      const { rows: cartRows } = await query<{ category: string; title: string }>(
        "SELECT DISTINCT category, title FROM products WHERE id = ANY($1::int[])",
        [cartProductIds],
      );
      const categories = Array.from(new Set(cartRows.map((r) => r.category)));
      contextLabel = cartRows.map((r) => r.title).join(", ") || "items in cart";
      if (categories.length === 0) {
        return NextResponse.json({ recommendations: [] });
      }
      const { rows } = await query<CandidateProduct>(
        `SELECT id, title, price FROM products
         WHERE category = ANY($1::text[]) AND id != ALL($2::int[])
         ORDER BY id LIMIT $3`,
        [categories, excludeIds, CANDIDATE_LIMIT],
      );
      candidates = rows.map((r) => ({ ...r, price: Number(r.price) }));
    }
  } catch (err) {
    console.error("[ai/recommendations] db error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }

  if (candidates.length === 0) {
    return NextResponse.json({ recommendations: [] });
  }

  try {
    const { system, user } = buildRecommendationsPrompt(contextLabel, candidates);
    const result = await callClaudeJSON(system, user, RecommendationsSchema);

    const candidateById = new Map(candidates.map((c) => [c.id, c]));
    const recommendations = result.recommendations
      .filter((r) => candidateById.has(r.id)) // never trust an id we didn't offer
      .map((r) => {
        const c = candidateById.get(r.id)!;
        return { id: c.id, title: c.title, price: c.price, reason: r.reason };
      });

    return NextResponse.json({ recommendations });
  } catch (err) {
    return handleAIError(err);
  }
}
