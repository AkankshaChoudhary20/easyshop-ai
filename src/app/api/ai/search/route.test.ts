import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { withStubAI } from "@/lib/ai/testUtils";
import { __setClientForTest } from "@/lib/ai/client";

const queryMock = vi.fn();
vi.mock("@/lib/db", () => ({
  query: (...args: unknown[]) => queryMock(...args),
}));

async function importRoute() {
  // dynamic import so the db mock above is in place before the route module
  // (and its `@/lib/db` import) is evaluated
  return import("./route");
}

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/ai/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  queryMock.mockReset();
  __setClientForTest(null, false);
});

describe("POST /api/ai/search", () => {
  it("returns 503 without any DB or network call when AI is disabled", async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest({ query: "anything" }));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toBe("ai_unavailable");
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("400s when query is missing", async () => {
    __setClientForTest(null, true); // enabled, but bad input should 400 before any AI call
    const { POST } = await importRoute();
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("validates the model's filter before building SQL, and returns matching rows", async () => {
    queryMock.mockResolvedValue({ rows: [{ id: 16, title: "Waterproof Backpack", price: 27.99 }] });
    const { POST } = await importRoute();

    const res = await withStubAI(
      JSON.stringify({ category: "accessories", minPrice: null, maxPrice: 30, keyword: "waterproof" }),
      () => POST(makeRequest({ query: "cheap waterproof bags under $30" })),
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.filter).toEqual({ category: "accessories", minPrice: null, maxPrice: 30, keyword: "waterproof" });
    expect(data.results).toHaveLength(1);

    const [sql, params] = queryMock.mock.calls.at(-1)!;
    expect(sql).toContain("category = $1");
    expect(sql).toContain("price <= $2");
    expect(params).toEqual(["accessories", 30, "waterproof"]);
  });

  it("drops an invalid category from the model instead of using it in SQL", async () => {
    queryMock.mockResolvedValue({ rows: [] });
    const { POST } = await importRoute();

    const res = await withStubAI(
      JSON.stringify({ category: "not-a-real-category", minPrice: null, maxPrice: null, keyword: null }),
      () => POST(makeRequest({ query: "something" })),
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.filter.category).toBeNull();

    const [sql] = queryMock.mock.calls.at(-1)!;
    expect(sql).not.toContain("category");
  });
});
