import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { withStubAI } from "@/lib/ai/testUtils";
import { __setClientForTest } from "@/lib/ai/client";

const queryMock = vi.fn();
vi.mock("@/lib/db", () => ({
  query: (...args: unknown[]) => queryMock(...args),
}));

async function importRoute() {
  return import("./route");
}

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/ai/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  queryMock.mockReset();
  __setClientForTest(null, false);
});

describe("POST /api/ai/recommendations", () => {
  it("returns 503 when AI is disabled, with no DB call", async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest({ productId: 1 }));
    expect(res.status).toBe(503);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("404s when the current product doesn't exist", async () => {
    __setClientForTest(null, true);
    queryMock.mockResolvedValueOnce({ rows: [] }); // "current product" lookup
    const { POST } = await importRoute();
    const res = await POST(makeRequest({ productId: 999 }));
    expect(res.status).toBe(404);
  });

  it("short-circuits with no AI call when the candidate set is empty", async () => {
    __setClientForTest(null, true);
    queryMock
      .mockResolvedValueOnce({ rows: [{ title: "Solo Item", category: "books" }] }) // current product
      .mockResolvedValueOnce({ rows: [] }); // no other candidates in that category
    const { POST } = await importRoute();
    const res = await POST(makeRequest({ productId: 1 }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.recommendations).toEqual([]);
  });

  it("drops any recommended id that isn't in the fetched candidate set", async () => {
    const candidates = [
      { id: 2, title: "Real Candidate A", price: 19.99 },
      { id: 3, title: "Real Candidate B", price: 24.99 },
    ];
    queryMock
      .mockResolvedValueOnce({ rows: [{ title: "Current Product", category: "home" }] })
      .mockResolvedValueOnce({ rows: candidates });
    const { POST } = await importRoute();

    // Model hallucinates id 999, which was never offered as a candidate.
    const res = await withStubAI(
      JSON.stringify({
        recommendations: [
          { id: 2, reason: "goes well with it" },
          { id: 999, reason: "a product that does not exist" },
        ],
      }),
      () => POST(makeRequest({ productId: 1 })),
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.recommendations).toHaveLength(1);
    expect(data.recommendations[0]).toEqual({
      id: 2,
      title: "Real Candidate A",
      price: 19.99,
      reason: "goes well with it",
    });
  });

  it("re-hydrates title/price from the DB, never from the model's output", async () => {
    const candidates = [{ id: 2, title: "Real Title", price: 19.99 }];
    queryMock
      .mockResolvedValueOnce({ rows: [{ title: "Current Product", category: "home" }] })
      .mockResolvedValueOnce({ rows: candidates });
    const { POST } = await importRoute();

    const res = await withStubAI(
      JSON.stringify({
        recommendations: [{ id: 2, reason: "nice pairing" }],
      }),
      () => POST(makeRequest({ productId: 1 })),
    );

    const data = await res.json();
    // Title/price must match the DB row, not anything the model could have said.
    expect(data.recommendations[0].title).toBe("Real Title");
    expect(data.recommendations[0].price).toBe(19.99);
  });
});
