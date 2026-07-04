"use client";

import { FormEvent, useState } from "react";

export interface ContactFormProps {
  variant?: "full" | "compact";
  serviceOptions?: string[];
  successTitle?: string;
  successBody?: string;
  submitLabel?: string;
}

// Mirrors the original site's inline handleForm() behaviour: no backend call,
// just a client-side success state. Wire this up to a real endpoint (email
// service, CRM webhook, etc.) when the template goes into production.
export default function ContactForm({
  variant = "full",
  serviceOptions,
  successTitle = "Quote Request Sent!",
  successBody = "Our team will contact you within 2 hours.",
  submitLabel = "Request Free Quote →",
}: ContactFormProps) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
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
          <input type="text" placeholder="Your name" />
        </div>
        <div className="fg">
          <label>Phone</label>
          <input type="tel" placeholder="07XXX XXXXXX" />
        </div>
        <div className="fg">
          <label>Message</label>
          <textarea rows={2} placeholder="Your requirements..." />
        </div>
        <button type="submit" className="fsub" style={{ marginTop: 8, background: "var(--s)" }}>
          Request Callback →
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="fr">
        <div className="fg">
          <label>First Name *</label>
          <input type="text" placeholder="John" required />
        </div>
        <div className="fg">
          <label>Last Name *</label>
          <input type="text" placeholder="Smith" required />
        </div>
      </div>
      <div className="fg">
        <label>Phone *</label>
        <input type="tel" placeholder="07XXX XXXXXX" required />
      </div>
      <div className="fg">
        <label>Email *</label>
        <input type="email" placeholder="john@example.com" required />
      </div>
      {serviceOptions && (
        <div className="fg">
          <label>Service</label>
          <select>
            <option value="">Select...</option>
            {serviceOptions.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}
      <div className="fg">
        <label>Details</label>
        <textarea rows={3} placeholder="Brief description of your project..." />
      </div>
      <button type="submit" className="fsub">
        {submitLabel}
      </button>
      <p className="ftrust">🔒 Your data is secure and never shared</p>
    </form>
  );
}
