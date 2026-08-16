"use client";

import { useState } from "react";
import { Sparkles, Search } from "lucide-react";
import type { Product } from "@/types/product";

interface Props {
  onResults: (products: Product[], filter?: Record<string, unknown>) => void;
}

// Natural-language search: posts to /api/ai/search; on a 503 (AI not
// configured) falls back to the plain literal GET /api/products?q= endpoint
// so search still works with zero AI impact on the rest of the app.
export function NLSearchBar({ onResults }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Record<string, unknown> | null>(null);
  const [fellBack, setFellBack] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setFellBack(false);
    setFilter(null);
    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (res.status === 503) {
        const fallback = await fetch(`/api/products?q=${encodeURIComponent(query)}`);
        const data = await fallback.json();
        onResults(data.products || []);
        setFellBack(true);
        return;
      }
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      onResults(data.results || [], data.filter);
      setFilter(data.filter);
    } catch {
      setError("Something went wrong — try again.");
    } finally {
      setLoading(false);
    }
  }

  const activeFilters = filter
    ? Object.entries(filter).filter(([, v]) => v !== null && v !== undefined && v !== "")
    : [];

  return (
    <div className="space-y-2">
      <form onSubmit={submit} className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 h-10 px-3 rounded border border-ink-100 bg-white focus-within:border-brand focus-within:shadow-focus">
          <Sparkles size={15} className="text-brand shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask in plain English — e.g. cheap waterproof bags under $30"
            className="flex-1 bg-transparent outline-none text-sm placeholder-ink-400"
          />
        </div>
        <button type="submit" className="es-btn-secondary" disabled={loading || !query.trim()}>
          <Search size={14} /> {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <p className="text-xs text-danger">{error}</p>}
      {fellBack && (
        <p className="text-xs text-ink-400 italic">
          AI search isn&apos;t configured — showing literal title/description matches instead.
        </p>
      )}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap text-xs text-ink-600">
          <span className="font-medium">Interpreted as:</span>
          {activeFilters.map(([k, v]) => (
            <span key={k} className="es-chip bg-brand-subtle text-brand-muted">
              {k}: {String(v)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
