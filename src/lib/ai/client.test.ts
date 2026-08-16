import { describe, it, expect } from "vitest";
import { z } from "zod";
import { callClaudeJSON, callClaudeText, callClaudeChat } from "./client";
import { withStubAI } from "./testUtils";

describe("callClaudeJSON", () => {
  it("parses a valid structured response", async () => {
    const schema = z.object({ priority: z.string(), tags: z.array(z.string()) });
    const result = await withStubAI(
      JSON.stringify({ priority: "high", tags: ["urgent", "security"] }),
      () => callClaudeJSON("system", "user", schema),
    );
    expect(result).toEqual({ priority: "high", tags: ["urgent", "security"] });
  });

  it("throws on malformed JSON from the model", async () => {
    const schema = z.object({ foo: z.string() });
    await expect(
      withStubAI("not valid json at all", () => callClaudeJSON("system", "user", schema)),
    ).rejects.toThrow();
  });

  it("throws when the response doesn't match the schema", async () => {
    const schema = z.object({ priority: z.enum(["low", "medium", "high"]) });
    await expect(
      withStubAI(JSON.stringify({ priority: "not-a-real-priority" }), () =>
        callClaudeJSON("system", "user", schema),
      ),
    ).rejects.toThrow();
  });
});

describe("callClaudeText", () => {
  it("returns the model's plain text reply", async () => {
    const result = await withStubAI("A friendly product description.", () =>
      callClaudeText("system", "user"),
    );
    expect(result).toBe("A friendly product description.");
  });
});

describe("callClaudeChat", () => {
  it("sends multi-turn history and returns the reply text", async () => {
    const result = await withStubAI("Sure, here's a recommendation.", () =>
      callClaudeChat("system", [
        { role: "user", content: "hi" },
        { role: "assistant", content: "hello!" },
        { role: "user", content: "what electronics do you have?" },
      ]),
    );
    expect(result).toBe("Sure, here's a recommendation.");
  });
});
