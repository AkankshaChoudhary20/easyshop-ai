import { NextRequest, NextResponse } from "next/server";
import { aiEnabled, callClaudeText } from "@/lib/ai/client";
import { aiUnavailableResponse, handleAIError } from "@/lib/ai/errors";
import { buildDescribePrompt } from "@/lib/ai/prompts";

// AI product descriptions: suggestion only, never written to the DB from
// here — the "Add Product" form persists it only when the whole form is
// submitted via the plain POST /api/products, same suggest-then-accept
// pattern used for the smart task assistant in the devboard-ai project.
export async function POST(req: NextRequest) {
  if (!aiEnabled) return aiUnavailableResponse();

  const body = await req.json().catch(() => null);
  const title = body?.title;
  const category = body?.category;
  if (!title || typeof title !== "string" || !category || typeof category !== "string") {
    return NextResponse.json({ error: "title and category are required" }, { status: 400 });
  }
  const price = typeof body?.price === "number" ? body.price : undefined;
  const keywords = typeof body?.keywords === "string" ? body.keywords : undefined;

  try {
    const { system, user } = buildDescribePrompt({ title, category, price, keywords });
    const description = await callClaudeText(system, user);
    return NextResponse.json({ description });
  } catch (err) {
    return handleAIError(err);
  }
}
