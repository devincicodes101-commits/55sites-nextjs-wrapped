"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

type QuoteCard = {
  ref: string;
  businessName: string;
  primary: string;
  lineItems: { description: string; quantity: number; unit: string; total_gbp: number }[];
  subtotal: number;
  vat: number;
  total: number;
  totalDisplay: string;
  validityDays: number;
};

function money(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

export default function ChatAgent({
  businessName,
  primary,
  dark,
}: {
  businessName: string;
  primary: string;
  dark: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [quote, setQuote] = useState<QuoteCard | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `Hi! 👋 I'm the ${businessName} assistant. Tell me what asbestos work you need and I'll get you an instant fixed-price quote.`,
        },
      ]);
    }
  }, [open, messages.length, businessName]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, quote, busy]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.reply) setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      if (data.quote) setQuote(data.quote as QuoteCard);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Sorry, something went wrong. Please try again or call us." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Launcher */}
      <button
        aria-label="Chat for an instant quote"
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 9999,
          width: 60,
          height: 60,
          borderRadius: "50%",
          border: "none",
          background: primary,
          color: "#fff",
          fontSize: 26,
          cursor: "pointer",
          boxShadow: "0 6px 20px rgba(0,0,0,.25)",
        }}
      >
        {open ? "✕" : "💬"}
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 92,
            right: 20,
            zIndex: 9999,
            width: "min(380px, calc(100vw - 40px))",
            height: "min(560px, calc(100vh - 140px))",
            background: "#fff",
            borderRadius: 14,
            boxShadow: "0 12px 40px rgba(0,0,0,.28)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: "Arial, Helvetica, sans-serif",
          }}
        >
          {/* Header */}
          <div style={{ background: dark, color: "#fff", padding: "14px 16px" }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{businessName}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Instant quote assistant</div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 14, background: "#f7f7f8" }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "9px 12px",
                    borderRadius: 12,
                    fontSize: 14,
                    lineHeight: 1.45,
                    whiteSpace: "pre-wrap",
                    background: m.role === "user" ? primary : "#fff",
                    color: m.role === "user" ? "#fff" : "#222",
                    border: m.role === "user" ? "none" : "1px solid #e5e7eb",
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {busy && (
              <div style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>typing…</div>
            )}

            {quote && (
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", marginTop: 4 }}>
                <div style={{ background: dark, color: "#fff", padding: "10px 14px", fontSize: 12, letterSpacing: 1, fontWeight: 700 }}>
                  QUOTATION · {quote.ref}
                </div>
                <div style={{ padding: 14 }}>
                  {quote.lineItems.map((li, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                      <span>{li.description} ({li.quantity} {li.unit})</span>
                      <span>{money(li.total_gbp)}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666", marginTop: 6 }}>
                    <span>Subtotal · VAT</span>
                    <span>{money(quote.subtotal)} · {money(quote.vat)}</span>
                  </div>
                  <div style={{ background: quote.primary, color: "#fff", borderRadius: 8, padding: "10px 12px", marginTop: 10, display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                    <span>Total (inc. VAT)</span>
                    <span>{quote.totalDisplay}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 8 }}>
                    Valid for {quote.validityDays} days · a copy has been saved for our team to follow up.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={send} style={{ display: "flex", gap: 8, padding: 10, borderTop: "1px solid #eee" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message…"
              disabled={busy}
              style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, outline: "none" }}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              style={{ background: primary, color: "#fff", border: "none", borderRadius: 8, padding: "0 16px", fontWeight: 700, cursor: "pointer" }}
            >
              →
            </button>
          </form>
        </div>
      )}
    </>
  );
}
