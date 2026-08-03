import type { CatalogService } from "./catalog-pricing";
import type { GeneratedQuote } from "./gemini-quote";
import { buildQuoteDocFromQuote } from "./quote-document";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.QUOTE_FROM_EMAIL);
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Professional, per-brand HTML quotation (logo badge, table, coloured total banner). */
export function buildBrandedQuoteHtml(o: {
  businessName: string;
  logoLetter: string;
  primary: string;
  dark: string;
  contactEmail: string;
  phoneDisplay: string;
  customerName: string;
  quoteRef: string;
  quote: GeneratedQuote;
}): string {
  const rows = o.quote.line_items
    .map(
      (li) => `
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid #eee;font-size:14px;color:#222">${esc(li.description)}</td>
        <td style="padding:14px 20px;border-bottom:1px solid #eee;font-size:14px;color:#222;text-align:center">${li.quantity}</td>
        <td style="padding:14px 20px;border-bottom:1px solid #eee;font-size:14px;color:#222;text-align:right">${formatMoney(li.total_gbp)}</td>
      </tr>`,
    )
    .join("");
  const contact = o.contactEmail
    ? `<a href="mailto:${esc(o.contactEmail)}" style="color:#fff;text-decoration:underline">${esc(o.contactEmail)}</a>`
    : esc(o.phoneDisplay);
  const callLine = o.phoneDisplay ? ` or call us on ${esc(o.phoneDisplay)}` : "";

  return `<div style="background:#f4f4f5;padding:24px 0;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
    <tr><td style="background:${o.dark};padding:22px 24px"><table role="presentation" width="100%"><tr>
      <td style="vertical-align:middle">
        <span style="display:inline-block;width:34px;height:34px;line-height:34px;text-align:center;background:${o.primary};color:#fff;font-weight:bold;border-radius:6px;font-size:16px">${esc(o.logoLetter)}</span>
        <span style="color:#fff;font-size:18px;font-weight:bold;margin-left:10px;vertical-align:middle">${esc(o.businessName)}</span>
      </td>
      <td style="text-align:right;color:#cbd5e1;font-size:13px;letter-spacing:2px;font-weight:bold;vertical-align:middle">QUOTATION</td>
    </tr></table></td></tr>
    <tr><td style="padding:24px 24px 8px"><table role="presentation" width="100%"><tr>
      <td style="font-size:11px;color:#888;letter-spacing:1px">PREPARED FOR<br><span style="font-size:15px;color:#222;font-weight:bold">${esc(o.customerName)}</span></td>
      <td style="text-align:right;font-size:11px;color:#888;letter-spacing:1px">QUOTE NUMBER<br><span style="font-size:15px;color:#222;font-weight:bold">${esc(o.quoteRef)}</span></td>
    </tr></table></td></tr>
    <tr><td style="padding:12px 24px 4px;font-size:14px;color:#333;line-height:1.5">
      <p style="margin:0 0 6px">Hi ${esc(o.customerName)},</p>
      <p style="margin:0">Thank you for your enquiry. Please find your fixed-price quotation below.</p>
    </td></tr>
    <tr><td style="padding:16px 24px 0"><table role="presentation" width="100%" style="border-collapse:collapse">
      <tr style="background:#f9fafb">
        <td style="padding:10px 20px;font-size:11px;color:#888;letter-spacing:1px">SERVICE</td>
        <td style="padding:10px 20px;font-size:11px;color:#888;letter-spacing:1px;text-align:center">QTY</td>
        <td style="padding:10px 20px;font-size:11px;color:#888;letter-spacing:1px;text-align:right">TOTAL</td>
      </tr>
      ${rows}
      <tr><td colspan="2" style="padding:12px 20px;text-align:right;font-size:13px;color:#666">VAT (20%)</td><td style="padding:12px 20px;text-align:right;font-size:13px;color:#666">${formatMoney(o.quote.vat_gbp)}</td></tr>
    </table></td></tr>
    <tr><td style="padding:8px 24px 20px"><table role="presentation" width="100%" style="background:${o.primary};border-radius:6px"><tr>
      <td style="padding:14px 20px;color:#fff;font-size:16px;font-weight:bold">Total (inc. VAT)</td>
      <td style="padding:14px 20px;color:#fff;font-size:16px;font-weight:bold;text-align:right">${formatMoney(o.quote.total_gbp)}</td>
    </tr></table></td></tr>
    <tr><td style="padding:0 24px 22px;font-size:13px;color:#666;line-height:1.5">
      This quote is valid for ${o.quote.validity_days} days and is based on the information you've provided; a site visit may refine it. To go ahead or arrange a visit, just reply to this email${callLine}.
    </td></tr>
    <tr><td style="background:${o.primary};padding:16px 24px;text-align:center;color:#fff;font-size:13px">
      Questions? Contact us at ${contact}<br><span style="font-size:11px;opacity:.85">Payment terms: payment on completion</span>
    </td></tr>
  </table>
</div>`;
}

/** Sends a branded quotation via Resend (used by the website chat agent). */
export async function sendBrandedQuoteEmail(input: {
  to: string;
  businessName: string;
  logoLetter: string;
  primary: string;
  dark: string;
  contactEmail: string;
  phoneDisplay: string;
  customerName: string;
  quoteRef: string;
  quote: GeneratedQuote;
  catalog?: CatalogService[];
}): Promise<{ sent: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { sent: false, error: "Email not configured (RESEND_API_KEY / QUOTE_FROM_EMAIL)" };
  }
  const from = process.env.QUOTE_FROM_EMAIL!;
  const apiKey = process.env.RESEND_API_KEY!;
  const html = buildQuoteDocFromQuote({
    quote: input.quote,
    customerName: input.customerName,
    customerEmail: input.to,
    quoteRef: input.quoteRef,
    catalog: input.catalog,
  });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: `Asbestos UK Teams Ltd — Your Asbestos Quotation ${input.quoteRef}`,
      html,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as { message?: string };
  if (!res.ok) return { sent: false, error: data.message || `Resend error ${res.status}` };
  return { sent: true };
}

export function buildQuoteEmailHtml(input: {
  customerName: string;
  businessName: string;
  city: string;
  phoneDisplay: string;
  quote: GeneratedQuote;
  quoteRef: string;
}): string {
  const { quote } = input;
  const rows = quote.line_items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${item.description}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity} ${item.unit}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatMoney(item.unit_price_gbp)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatMoney(item.total_gbp)}</td>
      </tr>`,
    )
    .join("");

  return `
  <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#222">
    <h1 style="font-size:22px;margin:0 0 8px">${input.businessName}</h1>
    <p style="margin:0 0 24px;color:#666">Formal quotation for asbestos works in ${input.city}</p>
    <p>Dear ${input.customerName},</p>
    <p>Thank you for uploading your survey report. We have reviewed the document and prepared the following fixed-price quotation.</p>
    <p><strong>Quote reference:</strong> ${input.quoteRef}<br/>
    <strong>Valid for:</strong> ${quote.validity_days} days</p>
    ${quote.property_address ? `<p><strong>Property:</strong> ${quote.property_address}</p>` : ""}
    <h2 style="font-size:16px;margin:24px 0 8px">Survey summary</h2>
    <p style="white-space:pre-wrap">${quote.survey_summary}</p>
    <h2 style="font-size:16px;margin:24px 0 8px">Recommended works</h2>
    <ul>${quote.recommended_works.map((w) => `<li>${w}</li>`).join("")}</ul>
    <h2 style="font-size:16px;margin:24px 0 8px">Price breakdown</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead>
        <tr>
          <th style="text-align:left;padding:8px;border-bottom:2px solid #ddd">Description</th>
          <th style="text-align:center;padding:8px;border-bottom:2px solid #ddd">Qty</th>
          <th style="text-align:right;padding:8px;border-bottom:2px solid #ddd">Unit</th>
          <th style="text-align:right;padding:8px;border-bottom:2px solid #ddd">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="text-align:right;margin:16px 0 4px">Subtotal: <strong>${formatMoney(quote.subtotal_gbp)}</strong></p>
    <p style="text-align:right;margin:0 0 4px">VAT (20%): <strong>${formatMoney(quote.vat_gbp)}</strong></p>
    <p style="text-align:right;margin:0 0 24px;font-size:18px">Total: <strong>${formatMoney(quote.total_gbp)}</strong></p>
    <h2 style="font-size:16px;margin:24px 0 8px">Assumptions</h2>
    <ul>${quote.assumptions.map((a) => `<li>${a}</li>`).join("")}</ul>
    <h2 style="font-size:16px;margin:24px 0 8px">Exclusions</h2>
    <ul>${quote.exclusions.map((e) => `<li>${e}</li>`).join("")}</ul>
    <p style="margin-top:24px">To accept this quote or arrange a site visit, call us on <strong>${input.phoneDisplay}</strong> or reply to this email.</p>
    <p style="color:#888;font-size:12px;margin-top:32px">This quotation was generated from your uploaded survey report and will be reviewed by our ${input.city} team before works commence.</p>
  </div>`;
}

/**
 * Sends the formal quote to the customer via Resend.
 * Returns { sent: false } when email env is not configured (CRM still receives the lead).
 */
export async function sendQuoteEmail(input: {
  to: string;
  customerName: string;
  businessName: string;
  city: string;
  phoneDisplay: string;
  quote: GeneratedQuote;
  quoteRef: string;
  catalog?: CatalogService[];
}): Promise<{ sent: boolean; id?: string; error?: string }> {
  if (!isEmailConfigured()) {
    return { sent: false, error: "Email not configured (RESEND_API_KEY / QUOTE_FROM_EMAIL)" };
  }

  const from = process.env.QUOTE_FROM_EMAIL!;
  const apiKey = process.env.RESEND_API_KEY!;
  const html = buildQuoteDocFromQuote({
    quote: input.quote,
    customerName: input.customerName,
    customerEmail: input.to,
    quoteRef: input.quoteRef,
    catalog: input.catalog,
  });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: `Asbestos UK Teams Ltd — Asbestos Works Quotation ${input.quoteRef}`,
      html,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) {
    return { sent: false, error: data.message || `Resend error ${res.status}` };
  }

  return { sent: true, id: data.id };
}

export function buildMissingInfoEmailHtml(input: {
  customerName: string;
  businessName: string;
  city: string;
  phoneDisplay: string;
  service: string;
  missing: string[];
}): string {
  const items = input.missing.map((m) => `<li>${m}</li>`).join("");
  return `
  <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#222">
    <h1 style="font-size:22px;margin:0 0 8px">${input.businessName}</h1>
    <p style="margin:0 0 24px;color:#666">Your quote request for ${input.service} in ${input.city}</p>
    <p>Dear ${input.customerName},</p>
    <p>Thank you for your enquiry about <strong>${input.service}</strong>. To prepare your fixed-price quote, we just need a little more information:</p>
    <ul>${items}</ul>
    <p>Simply reply to this email with these details and we'll send your quote straight over — usually within a few minutes.</p>
    <p style="margin-top:24px">Prefer to talk it through? Call us on <strong>${input.phoneDisplay}</strong>.</p>
    <p style="color:#888;font-size:12px;margin-top:32px">${input.businessName} — ${input.city}.</p>
  </div>`;
}

/**
 * Emails the customer to request the information still needed before we can
 * produce a quote (e.g. area in m² for a per-m² service). No quote is generated
 * until they reply with the missing details.
 */
export async function sendMissingInfoEmail(input: {
  to: string;
  customerName: string;
  businessName: string;
  city: string;
  phoneDisplay: string;
  service: string;
  missing: string[];
}): Promise<{ sent: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { sent: false, error: "Email not configured (RESEND_API_KEY / QUOTE_FROM_EMAIL)" };
  }

  const from = process.env.QUOTE_FROM_EMAIL!;
  const apiKey = process.env.RESEND_API_KEY!;
  const html = buildMissingInfoEmailHtml(input);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: `${input.businessName} — a little more info needed for your ${input.service} quote`,
      html,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) {
    return { sent: false, error: data.message || `Resend error ${res.status}` };
  }
  return { sent: true };
}

/**
 * Internal alert so callback / contact enquiries are not lost if CRM write fails.
 * Sends to LEADS_NOTIFY_EMAIL, or the address portion of QUOTE_FROM_EMAIL.
 */
export async function sendLeadAlertEmail(input: {
  firstName: string;
  lastName: string | null;
  phone: string;
  email: string | null;
  service: string;
  details: string | null;
  city: string;
  domain: string;
  source: string;
}): Promise<{ sent: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { sent: false, error: "Email not configured" };
  }

  const from = process.env.QUOTE_FROM_EMAIL!;
  const apiKey = process.env.RESEND_API_KEY!;
  const notifyTo =
    process.env.LEADS_NOTIFY_EMAIL?.trim() ||
    from.match(/<([^>]+)>/)?.[1] ||
    from.trim();

  if (!notifyTo || !notifyTo.includes("@")) {
    return { sent: false, error: "No LEADS_NOTIFY_EMAIL / QUOTE_FROM_EMAIL recipient" };
  }

  const name = [input.firstName, input.lastName].filter(Boolean).join(" ");
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#222">
    <h2 style="margin:0 0 12px">New website enquiry — ${input.city}</h2>
    <p style="margin:0 0 8px"><strong>Source:</strong> ${input.source}</p>
    <p style="margin:0 0 8px"><strong>Domain:</strong> ${input.domain}</p>
    <p style="margin:0 0 8px"><strong>Name:</strong> ${name}</p>
    <p style="margin:0 0 8px"><strong>Phone:</strong> <a href="tel:${input.phone}">${input.phone}</a></p>
    <p style="margin:0 0 8px"><strong>Email:</strong> ${input.email || "—"}</p>
    <p style="margin:0 0 8px"><strong>Service:</strong> ${input.service}</p>
    <p style="margin:16px 0 0"><strong>Details:</strong></p>
    <p style="white-space:pre-wrap">${input.details || "—"}</p>
  </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [notifyTo],
      subject: `[Callback] ${input.city} — ${name} — ${input.phone}`,
      html,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) {
    return { sent: false, error: data.message || `Resend error ${res.status}` };
  }
  return { sent: true };
}
