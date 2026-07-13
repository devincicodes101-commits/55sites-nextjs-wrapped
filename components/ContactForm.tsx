"use client";

import { FormEvent, useState } from "react";

export interface ContactFormProps {
  variant?: "full" | "compact" | "inline";
  serviceOptions?: string[];
  successTitle?: string;
  successBody?: string;
  submitLabel?: string;
}

export default function ContactForm({
  variant = "full",
  serviceOptions,
  successTitle = "Quote Request Sent!",
  successBody = "Our team will contact you within 2 hours.",
  submitLabel = "Request Free Quote →",
}: ContactFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const data = Object.fromEntries(new FormData(e.currentTarget).entries());

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong sending your message. Please call us instead.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="fsucc show">
        <h4>✅ {successTitle}</h4>
        <p>{successBody}</p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <form onSubmit={handleSubmit}>
        <div className="fg">
          <label>Name</label>
          <input type="text" name="name" placeholder="Your name" required />
        </div>
        <div className="fg">
          <label>Phone</label>
          <input type="tel" name="phone" placeholder="07XXX XXXXXX" required />
        </div>
        <div className="fg">
          <label>Message</label>
          <textarea name="message" rows={2} placeholder="Your requirements..." />
        </div>
        {error && <p style={{ color: "#c0392b", fontSize: ".85rem", marginTop: 6 }}>{error}</p>}
        <button type="submit" className="fsub" style={{ marginTop: 8, background: "var(--s)" }} disabled={submitting}>
          {submitting ? "Sending…" : "Request Callback →"}
        </button>
      </form>
    );
  }

  if (variant === "inline") {
    return (
      <form className="lead-row" onSubmit={handleSubmit}>
        <div className="fg">
          <label>Your Name</label>
          <input type="text" name="name" placeholder="Full name" required />
        </div>
        <div className="fg">
          <label>Phone</label>
          <input type="tel" name="phone" placeholder="07XXX XXXXXX" required />
        </div>
        <div className="fg">
          <label>Service</label>
          <select name="service" defaultValue="">
            <option value="">Select...</option>
            {(serviceOptions ?? []).map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="lead-row-btn" disabled={submitting}>
          {submitting ? "Sending…" : "Get Quote →"}
        </button>
        {error && (
          <p style={{ color: "#ffb4b4", fontSize: ".85rem", gridColumn: "1 / -1", margin: 0 }}>{error}</p>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="fr">
        <div className="fg">
          <label>First Name *</label>
          <input type="text" name="firstName" placeholder="John" required />
        </div>
        <div className="fg">
          <label>Last Name *</label>
          <input type="text" name="lastName" placeholder="Smith" required />
        </div>
      </div>
      <div className="fg">
        <label>Phone *</label>
        <input type="tel" name="phone" placeholder="07XXX XXXXXX" required />
      </div>
      <div className="fg">
        <label>Email *</label>
        <input type="email" name="email" placeholder="john@example.com" required />
      </div>
      {serviceOptions && (
        <div className="fg">
          <label>Service</label>
          <select name="service">
            <option value="">Select...</option>
            {serviceOptions.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}
      <div className="fg">
        <label>Details</label>
        <textarea name="message" rows={3} placeholder="Brief description of your project..." />
      </div>
      {error && <p style={{ color: "#c0392b", fontSize: ".85rem", marginBottom: 8 }}>{error}</p>}
      <button type="submit" className="fsub" disabled={submitting}>
        {submitting ? "Sending…" : submitLabel}
      </button>
      <p className="ftrust">🔒 Your data is secure and never shared</p>
    </form>
  );
}
