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

  // Survey-report upload (Task B) inside the chat.
  const [uploadOpen, setUploadOpen] = useState(false);
  const [upName, setUpName] = useState("");
  const [upEmail, setUpEmail] = useState("");
  const [upPhone, setUpPhone] = useState("");
  const [upFile, setUpFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `Hi! 👋 I'm the ${businessName} assistant. Tell me what asbestos work you need — or tap 📎 to upload a survey report — and I'll get you an instant fixed-price quote.`,
        },
      ]);
    }
  }, [open, messages.length, businessName]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, quote, busy]);

  async function uploadSurvey(e: FormEvent) {
    e.preventDefault();
    if (uploading || !upFile || !upName.trim() || !upEmail.trim()) return;
    setUploading(true);
    const parts = upName.trim().split(/\s+/);
    setMessages((m) => [
      ...m,
      { role: "user", content: `📎 Uploaded survey report: ${upFile.name}` },
    ]);
    setUploadOpen(false);
    try {
      const SMALL_FILE = 4 * 1024 * 1024; // under Vercel's ~4.5MB request-body limit
      let res: Response;
      if (upFile.size <= SMALL_FILE) {
        // Small file: post directly (fast, no Blob dependency).
        const fd = new FormData();
        fd.append("firstName", parts[0] || upName.trim());
        fd.append("lastName", parts.slice(1).join(" ") || "-");
        fd.append("phone", upPhone.trim() || "-");
        fd.append("email", upEmail.trim());
        fd.append("service", "Asbestos Survey");
        fd.append("details", "Survey report uploaded via website chat");
        fd.append("surveyReport", upFile);
        res = await fetch("/api/survey-quote", { method: "POST", body: fd });
      } else {
        // Large file: upload to Vercel Blob first (bypasses the 4.5MB limit).
        const { upload } = await import("@vercel/blob/client");
        const blob = await upload(upFile.name, upFile, {
          access: "public",
          handleUploadUrl: "/api/survey-upload",
          contentType: upFile.type,
        });
        res = await fetch("/api/survey-quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: parts[0] || upName.trim(),
            lastName: parts.slice(1).join(" ") || "-",
            phone: upPhone.trim() || "-",
            email: upEmail.trim(),
            service: "Asbestos Survey",
            details: "Survey report uploaded via website chat",
            surveyUrl: blob.url,
            fileName: upFile.name,
          }),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.quote) {
        const total = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(data.totalGbp || data.quote.total_gbp);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: `Thanks! I've read your survey and prepared your fixed-price quotation (${total} inc. VAT). It's been sent to ${upEmail.trim()} with a link to accept and choose a date for the work. A copy is saved for our team.`,
          },
        ]);
        // Show the same formatted quote card as the typed-quote flow.
        setQuote({
          ref: data.quoteRef || "",
          businessName,
          primary,
          lineItems: (data.quote.line_items || []).map(
            (li: { description: string; quantity: number; unit: string; total_gbp: number }) => ({
              description: li.description,
              quantity: li.quantity,
              unit: li.unit,
              total_gbp: li.total_gbp,
            }),
          ),
          subtotal: data.quote.subtotal_gbp,
          vat: data.quote.vat_gbp,
          total: data.quote.total_gbp,
          totalDisplay: total,
          validityDays: data.quote.validity_days,
        });
      } else {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.error || "Sorry, I couldn't read that survey. Please try another file or call us." },
        ]);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, the upload failed. Please try again or call us." }]);
    } finally {
      setUploading(false);
      setUpFile(null);
    }
  }

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

            {(busy || uploading) && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#888", marginBottom: 8 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    border: "2px solid #ccc",
                    borderTopColor: primary,
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "chatspin 0.8s linear infinite",
                  }}
                />
                {uploading ? "Reading your survey and preparing your quote… this can take up to a minute" : "typing…"}
              </div>
            )}
            <style>{"@keyframes chatspin { to { transform: rotate(360deg); } }"}</style>

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

          {/* Survey upload panel */}
          {uploadOpen && (
            <form onSubmit={uploadSurvey} style={{ padding: 12, borderTop: "1px solid #eee", background: "#fafafa", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>Upload your asbestos survey for an instant quote</div>
              <input value={upName} onChange={(e) => setUpName(e.target.value)} placeholder="Your name *" style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 13 }} />
              <input value={upEmail} onChange={(e) => setUpEmail(e.target.value)} placeholder="Email *" type="email" style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 13 }} />
              <input value={upPhone} onChange={(e) => setUpPhone(e.target.value)} placeholder="Phone" style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 13 }} />
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => setUpFile(e.target.files?.[0] ?? null)}
                style={{ fontSize: 12 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" disabled={uploading || !upFile || !upName.trim() || !upEmail.trim()} style={{ flex: 1, background: primary, color: "#fff", border: "none", borderRadius: 8, padding: "9px 0", fontWeight: 700, cursor: "pointer" }}>
                  {uploading ? "Reading survey…" : "Get my quote →"}
                </button>
                <button type="button" onClick={() => setUploadOpen(false)} style={{ background: "#eee", color: "#333", border: "none", borderRadius: 8, padding: "9px 14px", cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Input */}
          <form onSubmit={send} style={{ display: "flex", gap: 8, padding: 10, borderTop: "1px solid #eee" }}>
            <button
              type="button"
              title="Upload a survey report"
              onClick={() => setUploadOpen((o) => !o)}
              style={{ background: "#f0f0f0", color: "#333", border: "1px solid #ddd", borderRadius: 8, padding: "0 12px", fontSize: 16, cursor: "pointer" }}
            >
              📎
            </button>
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
