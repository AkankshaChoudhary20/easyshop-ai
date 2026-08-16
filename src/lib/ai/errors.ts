import { NextResponse } from "next/server";
import { APIConnectionError, APIError, RateLimitError } from "@anthropic-ai/sdk";

/**
 * Maps a callClaude* error to an HTTP response, logging full detail
 * server-side only and returning a generic message to the client — same
 * "log detail, return generic message" philosophy used throughout this app.
 *
 * Checked most-specific-first: APIConnectionError is a *subclass* of
 * APIError in the TypeScript SDK (unlike some other language SDKs where
 * it's a sibling), so it must be checked before the broader APIError.
 */
export function handleAIError(err: unknown): NextResponse {
  if (err instanceof Error && (err.message === "ai_invalid_response" || err.message === "ai_empty_response")) {
    console.error("[ai] invalid/empty model response:", err);
    return NextResponse.json({ error: "ai_invalid_response" }, { status: 502 });
  }
  if (err instanceof RateLimitError) {
    console.error("[ai] rate limited:", err);
    return NextResponse.json({ error: "ai_rate_limited" }, { status: 429 });
  }
  if (err instanceof APIConnectionError) {
    console.error("[ai] connection error:", err);
    return NextResponse.json({ error: "ai_upstream_error" }, { status: 502 });
  }
  if (err instanceof APIError) {
    console.error("[ai] upstream API error:", err.status, err.message);
    return NextResponse.json({ error: "ai_upstream_error" }, { status: 502 });
  }
  console.error("[ai] unexpected error:", err);
  return NextResponse.json({ error: "ai_unexpected_error" }, { status: 500 });
}

export function aiUnavailableResponse(): NextResponse {
  return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
}
