// Test-only helper: stands up a local HTTP server mimicking the Anthropic
// Messages API response envelope, and points the AI client at it via
// __setClientForTest — so AI-route tests run with no real API key and no
// network call to api.anthropic.com.
import http from "node:http";
import type { AddressInfo } from "node:net";
import Anthropic from "@anthropic-ai/sdk";
import { __setClientForTest } from "./client";

export function startStubAnthropicServer(responseText: string): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            id: "msg_test",
            type: "message",
            role: "assistant",
            model: "claude-opus-5",
            stop_reason: "end_turn",
            stop_sequence: null,
            content: [{ type: "text", text: responseText }],
            usage: { input_tokens: 10, output_tokens: 10 },
          }),
        );
      });
    });
    server.listen(0, () => resolve(server));
  });
}

export function stopStubAnthropicServer(server: http.Server): Promise<void> {
  return new Promise((resolve) => server.close(() => resolve()));
}

export async function withStubAI<T>(responseText: string, fn: () => Promise<T>): Promise<T> {
  const server = await startStubAnthropicServer(responseText);
  const { port } = server.address() as AddressInfo;
  const client = new Anthropic({ apiKey: "test-key", baseURL: `http://127.0.0.1:${port}` });
  __setClientForTest(client, true);
  try {
    return await fn();
  } finally {
    __setClientForTest(null, false);
    await stopStubAnthropicServer(server);
  }
}
