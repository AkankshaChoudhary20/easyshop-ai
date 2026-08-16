// Per-feature prompt + Zod schema builders, kept separate from route-handler
// logic (src/lib/ai/client.ts has the low-level "call Claude" helpers).
import { z } from "zod";

// --- (1) AI product search ---

export const SearchFilterSchema = z.object({
  category: z.string().nullable(),
  minPrice: z.number().nullable(),
  maxPrice: z.number().nullable(),
  keyword: z.string().nullable(),
});
export type SearchFilter = z.infer<typeof SearchFilterSchema>;

export function buildSearchPrompt(query: string, categories: string[]) {
  const system =
    `Translate the shopper's natural-language search into a structured filter. ` +
    `Categories are exactly: ${categories.join(", ")}. ` +
    `Set any field you can't confidently derive to null. "keyword" is a single word or short phrase to match against title/description.`;
  return { system, user: `Search query: ${query}` };
}

// --- (2) AI shopping assistant ---

export interface CatalogEntry {
  id: number;
  title: string;
  price: number;
  category: string;
  description: string;
}

export function buildAssistantPrompt(catalog: CatalogEntry[]) {
  const lines = catalog
    .map((p) => `${p.id}: ${p.title} — $${p.price.toFixed(2)} (${p.category}) — ${p.description.slice(0, 120)}`)
    .join("\n");
  const system =
    `You are a friendly shopping assistant for EasyShop. Answer questions and recommend products using ` +
    `ONLY the catalog below — never invent products, prices, or availability that isn't listed. ` +
    `If nothing in the catalog matches what the shopper wants, say so honestly rather than making something up. ` +
    `Keep replies short (2-4 sentences).\n\nCatalog:\n${lines}`;
  return { system };
}

// --- (3) AI product descriptions ---

export function buildDescribePrompt(input: {
  title: string;
  category: string;
  price?: number;
  keywords?: string;
}) {
  const system =
    "Write a compelling, accurate 2-4 sentence e-commerce product description from the given details. " +
    "Do not invent specifications or features not implied by the input. " +
    "Respond with ONLY the description — no preamble, no markdown, no quotes.";
  const parts = [
    `Title: ${input.title}`,
    `Category: ${input.category}`,
    input.price !== undefined ? `Price: $${input.price}` : null,
    input.keywords ? `Keywords/specs: ${input.keywords}` : null,
  ].filter(Boolean);
  return { system, user: parts.join("\n") };
}

// --- (4) AI recommendations ---

export const RecommendationsSchema = z.object({
  recommendations: z
    .array(
      z.object({
        id: z.number(),
        reason: z.string().max(140),
      }),
    )
    .max(4),
});
export type RecommendationsResult = z.infer<typeof RecommendationsSchema>;

export interface CandidateProduct {
  id: number;
  title: string;
  price: number;
}

export function buildRecommendationsPrompt(contextLabel: string, candidates: CandidateProduct[]) {
  const list = candidates.map((p) => `${p.id}: ${p.title} — $${p.price.toFixed(2)}`).join("\n");
  const system =
    "Given a shopper's current product/cart and a list of candidate products (id, title, price), " +
    "pick up to 4 the shopper would likely also want, each with a short reason (under 140 characters). " +
    "Only choose from the candidates provided — never invent a product or reference an id not in the list.";
  const user = `Shopper is looking at: ${contextLabel}\n\nCandidates:\n${list}`;
  return { system, user };
}
