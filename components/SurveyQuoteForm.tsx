"use client";

import { FormEvent, useState } from "react";

type QuoteResult = {
  quoteRef: string;
  totalGbp: number;
  emailSent: boolean;
  emailWarning?: string;
  quote: {
    survey_summary: string;
    property_address: string | null;
    line_items: {
      description: string;
      quantity: number;
      unit: string;
      unit_price_gbp: number;
      total_gbp: number;
    }[];
    subtotal_gbp: number;
    vat_gbp: number;
    total_gbp: number;
    validity_days: number;
    assumptions: string[];
    exclusions: string[];
  };
};

function money(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

export default function SurveyQuoteForm({ serviceOptions }: { serviceOptions: string[] }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/survey-quote", {
        method: "POST",
        body: data,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Request failed");
      setResult(json as QuoteResult);
      form.reset();
      setFileName(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please call us instead.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="survey-quote-success">
        <h3>✅ Quote ready — {result.quoteRef}</h3>
        <p>
          Total (inc. VAT): <strong>{money(result.totalGbp)}</strong>
          {result.emailSent
            ? " — emailed to you automatically."
            : " — saved to our CRM; email delivery is pending configuration."}
        </p>
        {result.emailWarning && (
          <p className="survey-quote-warn">Email note: {result.emailWarning}</p>
        )}
        <p className="survey-quote-summary">{result.quote.survey_summary}</p>
        <div className="survey-quote-table-wrap">
          <table className="survey-quote-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {result.quote.line_items.map((item) => (
                <tr key={`${item.description}-${item.total_gbp}`}>
                  <td>{item.description}</td>
                  <td>
                    {item.quantity} {item.unit}
                  </td>
                  <td>{money(item.unit_price_gbp)}</td>
                  <td>{money(item.total_gbp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="survey-quote-totals">
          Subtotal {money(result.quote.subtotal_gbp)} · VAT {money(result.quote.vat_gbp)} ·{" "}
          <strong>Total {money(result.quote.total_gbp)}</strong>
        </p>
        <p className="survey-quote-valid">Valid for {result.quote.validity_days} days. A sales advisor will follow up shortly.</p>
        <button type="button" className="fsub" style={{ marginTop: 16 }} onClick={() => setResult(null)}>
          Submit another survey →
        </button>
      </div>
    );
  }

  return (
    <form className="survey-quote-form" onSubmit={handleSubmit}>
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
      <div className="fg">
        <label>Service *</label>
        <select name="service" defaultValue="" required>
          <option value="" disabled>
            Select a service...
          </option>
          {serviceOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div className="fg">
        <label>Details</label>
        <textarea name="details" rows={2} placeholder="Anything else we should know about the job..." />
      </div>
      <div className="fg">
        <label>Survey report *</label>
        <label className="survey-file-drop">
          <input
            type="file"
            name="surveyReport"
            accept=".pdf,image/jpeg,image/png,image/webp,application/pdf"
            required
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
          <span>{fileName ? `📎 ${fileName}` : "Upload PDF or image survey report (max 12MB)"}</span>
        </label>
      </div>
      {error && <p className="survey-quote-error">{error}</p>}
      <button type="submit" className="fsub" disabled={submitting}>
        {submitting ? "Reading survey & building quote…" : "Upload Survey & Get Instant Quote →"}
      </button>
      <p className="ftrust">🔒 Your survey is processed securely and only used to prepare your quote</p>
    </form>
  );
}
