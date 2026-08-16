"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { ChatMessage } from "./ChatMessage";

interface Turn {
  role: "user" | "assistant";
  content: string;
}

// Site-wide floating shopping assistant. Grounded server-side in the real
// catalog only (see src/app/api/ai/assistant/route.ts) — this component just
// manages the conversation UI and resends a capped history each turn.
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages }),
      });
      if (res.status === 503) {
        setUnavailable(true);
        return;
      }
      if (!res.ok) throw new Error("assistant failed");
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, something went wrong. Try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open && (
        <div className="mb-3 w-80 h-96 es-card shadow-xl flex flex-col overflow-hidden">
          <div className="h-12 px-3 flex items-center justify-between border-b border-ink-100 bg-brand text-white">
            <span className="text-sm font-medium">Shopping assistant</span>
            <button onClick={() => setOpen(false)} aria-label="Close chat">
              <X size={16} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && !unavailable && (
              <p className="text-xs text-ink-400 text-center mt-6">
                Ask me about products — e.g. &quot;what electronics do you have under $50?&quot;
              </p>
            )}
            {unavailable && (
              <p className="text-xs text-ink-400 text-center mt-6">
                The shopping assistant isn&apos;t configured on this server right now.
              </p>
            )}
            {messages.map((m, i) => (
              <ChatMessage key={i} role={m.role} content={m.content} />
            ))}
            {loading && <ChatMessage role="assistant" content="…" />}
          </div>

          <form onSubmit={send} className="p-2 border-t border-ink-100 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a product…"
              disabled={unavailable}
              className="flex-1 h-9 px-2.5 rounded border border-ink-100 text-sm outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={loading || unavailable || !input.trim()}
              className="h-9 w-9 inline-flex items-center justify-center rounded bg-brand text-white disabled:opacity-50"
              aria-label="Send"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="h-12 w-12 rounded-full bg-brand text-white shadow-lg flex items-center justify-center hover:bg-brand-hover transition"
        aria-label="Toggle shopping assistant"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </div>
  );
}
