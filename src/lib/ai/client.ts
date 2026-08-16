// Low-level Anthropic client wrapper — the only place in this codebase that
// talks to Claude. Every AI feature route calls callClaudeJSON (structured,
// Zod-validated) or callClaudeText (freeform) from here; nothing else
// touches the SDK directly.
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { ZodType } from "zod";

export let aiEnabled = !!process.env.ANTHROPIC_API_KEY;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";
const TIMEOUT_MS = (Number(process.env.ANTHROPIC_TIMEOUT_SECONDS) || 20) * 1000;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: TIMEOUT_MS,
      baseURL: process.env.ANTHROPIC_BASE_URL, // only set in tests, stubs api.anthropic.com
    });
  }
  return client;
}

/**
 * Structured-output call: Claude's response is guaranteed to match `schema`
 * (or the call throws) — no markdown-fence stripping, no "hope the model
 * listens" prompting. Low effort + thinking disabled: every feature here is
 * short classification/extraction/generation work, not deep reasoning.
 */
export async function callClaudeJSON<T>(
  system: string,
  user: string,
  schema: ZodType<T>,
): Promise<T> {
  const resp = await getClient().messages.parse({
    model: MODEL,
    max_tokens: 1024,
    system,
    thinking: { type: "disabled" }, // valid at effort "low" on Claude Opus 5
    output_config: { effort: "low", format: zodOutputFormat(schema) },
    messages: [{ role: "user", content: user }],
  });
  if (resp.parsed_output === null || resp.parsed_output === undefined) {
    throw new Error("ai_invalid_response");
  }
  return resp.parsed_output;
}

/** Freeform text call — for the two single-turn features that return prose, not data. */
export async function callClaudeText(system: string, user: string): Promise<string> {
  return callClaudeChat(system, [{ role: "user", content: user }]);
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** Freeform text call with multi-turn history — used by the shopping assistant. */
export async function callClaudeChat(system: string, messages: ChatTurn[]): Promise<string> {
  const resp = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    messages,
  });
  const block = resp.content[0];
  if (!block || block.type !== "text") {
    throw new Error("ai_empty_response");
  }
  return block.text;
}

/** Test-only hook: force a specific client instance (e.g. pointed at a stub server) and enabled flag. */
export function __setClientForTest(c: Anthropic | null, enabled: boolean): void {
  client = c;
  aiEnabled = enabled;
}
