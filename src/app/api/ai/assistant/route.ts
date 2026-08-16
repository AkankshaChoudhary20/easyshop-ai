import { NextRequest, NextResponse } from "next/server";
import { aiEnabled, callClaudeChat, type ChatTurn } from "@/lib/ai/client";
import { aiUnavailableResponse, handleAIError } from "@/lib/ai/errors";
import { buildAssistantPrompt, type CatalogEntry } from "@/lib/ai/prompts";
import { query } from "@/lib/db";

const MAX_HISTORY_TURNS = 6; // 12 messages — caps cost/latency on long chats

// AI shopping assistant: the entire (small, seeded) catalog is embedded in
// the system prompt on every call, which is both the grounding mechanism
// and the hallucination guard — the model literally cannot reference a
// product that isn't in this list. Cheap at this catalog size; a retrieval
// step is the natural v2 upgrade once the catalog grows past ~100-200 items.
export async function POST(req: NextRequest) {
  if (!aiEnabled) return aiUnavailableResponse();

  const body = await req.json().catch(() => null);
  const message = body?.message;
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }
  const rawHistory = Array.isArray(body?.history) ? body.history : [];
  const history: ChatTurn[] = rawHistory
    .filter(
      (m: unknown): m is ChatTurn =>
        !!m &&
        typeof m === "object" &&
        (m as ChatTurn).role !== undefined &&
        ((m as ChatTurn).role === "user" || (m as ChatTurn).role === "assistant") &&
        typeof (m as ChatTurn).content === "string",
    )
    .slice(-MAX_HISTORY_TURNS * 2);

  try {
    const { rows } = await query<CatalogEntry>(
      "SELECT id, title, price, category, description FROM products ORDER BY id",
    );
    const catalog: CatalogEntry[] = rows.map((r) => ({ ...r, price: Number(r.price) }));

    const { system } = buildAssistantPrompt(catalog);
    const reply = await callClaudeChat(system, [...history, { role: "user", content: message }]);

    return NextResponse.json({ reply });
  } catch (err) {
    return handleAIError(err);
  }
}
