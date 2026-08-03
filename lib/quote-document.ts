/**
 * Official Asbestos UK Teams Ltd quotation template — the single design used for
 * ALL outgoing quotes (survey upload, website chat, and the email agent), so every
 * quote matches the CRM's branded quotation regardless of which city site the
 * enquiry came from. The quote is a legal document from the operating company.
 */
import type { CatalogService } from "./catalog-pricing";
import type { GeneratedQuote } from "./gemini-quote";

export const QUOTE_COMPANY = {
  name: "Asbestos UK Teams Ltd",
  // Hosted AUK logo (served from /public). Override with QUOTE_LOGO_URL if needed.
  logoUrl: process.env.QUOTE_LOGO_URL || "https://55sites-nextjs-wrapped.vercel.app/auk-logo.jpg",
  tagline:
    "We guarantee to beat any genuine quote nationwide by 5% — that's how confident we are on our pricing and service as the leading supplier of asbestos removal and survey services in the UK.",
  slogan: "Safe Removal. Expert Teams. Protecting Tomorrow.",
  address: "321-323 High Road, Chadwell Heath, Essex, London RM6 6AX",
  phone: "08000418212",
  email: "sales@capoholdings.co.uk",
  vat: "GB7656757567",
  companyNo: "17311646",
  primary: "#FF6A1A",
  dark: "#111111",
} as const;

const TERMS: string[] = [
  "Quotation & Payment: If a quotation is accepted, the remaining balance (after any 50% booking fee) is payable immediately on completion of works. The 50% deposit does not apply to surveys or services that do not require hire of equipment, scaffolding or materials. Only bank-to-bank transfers are accepted.",
  "Materials & Waste: All materials remain the property of Asbestos UK Teams Ltd until the invoice is paid in full. Asbestos waste remains the customer's property until paid and is disposed of at an environmental centre the day after completion; no waste is removed until full payment is received, so a legal waste transfer note can be provided the following day.",
  "Payments: All on-site personnel are employees of Asbestos UK Teams Ltd. Never pay cash or pay workers directly — payment only to the official account on the invoice. Invoices are payable immediately on completion.",
  "Late Payment: Interest of 12% per week applies from the day after the due date.",
  "Deposits: Works involving material, labour and/or machinery hire, skip hire, or exceeding £8,000 require a 50% deposit at least 3 days before the job (or on arrival at latest).",
  "Cancellations: Must be in writing by email at least 24 hours before the scheduled start; otherwise 30% of the total is charged.",
  "Surveys: Prepaid in full on the day of booking. All certificates (air tests, waste consignment notes) are provided on completion.",
];

function money(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export type QuoteDocLine = {
  description: string;
  longDescription?: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export function buildQuoteDocumentHtml(input: {
  customerName: string;
  customerEmail: string;
  customerAddress?: string;
  quoteRef: string;
  dateDisplay: string;
  lineItems: QuoteDocLine[];
  subtotal: number;
  vat: number;
  total: number;
  validityDays: number;
}): string {
  const c = QUOTE_COMPANY;

  const logo = c.logoUrl
    ? `<img src="${esc(c.logoUrl)}" alt="${esc(c.name)}" width="108" style="display:block;max-width:108px;height:auto;border-radius:8px" />`
    : `<div style="color:#fff;font-size:18px;font-weight:800;letter-spacing:1px">ASBESTOS <span style="color:${c.primary}">UK</span> TEAMS LTD</div>`;

  const serviceBlocks = input.lineItems
    .map(
      (li) => `
      <div style="border:1px solid #eee;border-radius:8px;padding:16px 18px;margin:0 0 12px">
        <table role="presentation" width="100%"><tr>
          <td style="font-size:15px;font-weight:bold;color:#222">${esc(li.description)}</td>
          <td style="text-align:right;font-size:15px;font-weight:bold;color:#222">${money(li.total)}</td>
        </tr></table>
        ${li.longDescription ? `<p style="margin:8px 0 0;font-size:12px;color:#666;line-height:1.5">${esc(li.longDescription)}</p>` : ""}
        <p style="margin:8px 0 0;font-size:12px;color:#999">Qty: ${li.quantity} · Unit price: ${money(li.unitPrice)}</p>
      </div>`,
    )
    .join("");

  const tableRows = input.lineItems
    .map(
      (li) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;font-size:13px;color:#222">${esc(li.description)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;font-size:13px;color:#222;text-align:center">${li.quantity}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;font-size:13px;color:#222;text-align:right">${money(li.unitPrice)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;font-size:13px;color:#222;text-align:right">${money(li.total)}</td>
      </tr>`,
    )
    .join("");

  const terms = TERMS.map((t) => `<li style="margin-bottom:8px">${esc(t)}</li>`).join("");

  return `<div style="background:#f4f4f5;padding:24px 0;font-family:Arial,Helvetica,sans-serif;color:#222">
  <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden">
    <!-- Header -->
    <tr><td style="background:${c.dark};padding:22px 26px">
      <table role="presentation" width="100%"><tr>
        <td width="116" style="vertical-align:top">${logo}</td>
        <td style="vertical-align:top;padding-left:16px">
          <div style="color:#fff;font-size:18px;font-weight:bold">${esc(c.name)}</div>
          <div style="color:#cbd5e1;font-size:12px;margin-top:2px">${esc(c.slogan)}</div>
          <div style="color:#94a3b8;font-size:11px;margin-top:6px;line-height:1.5">${esc(c.address)}</div>
          <div style="color:#94a3b8;font-size:11px;line-height:1.5">${esc(c.phone)} · <a href="mailto:${esc(c.email)}" style="color:#94a3b8;text-decoration:none">${esc(c.email)}</a></div>
        </td>
        <td style="text-align:right;vertical-align:top;white-space:nowrap">
          <div style="color:#cbd5e1;font-size:14px;letter-spacing:3px;font-weight:bold">QUOTATION</div>
          <div style="color:#94a3b8;font-size:12px;margin-top:4px">${esc(input.quoteRef)}</div>
        </td>
      </tr></table>
    </td></tr>

    <!-- Tagline -->
    <tr><td style="padding:16px 26px 4px;text-align:center;color:${c.primary};font-size:13px;font-weight:bold;line-height:1.5">
      ${esc(c.tagline)}
    </td></tr>

    <!-- Bill to / details -->
    <tr><td style="padding:16px 26px 8px">
      <table role="presentation" width="100%"><tr>
        <td style="vertical-align:top;font-size:11px;color:#888;letter-spacing:1px">BILL TO
          <div style="font-size:14px;color:#222;font-weight:bold;margin-top:4px">${esc(input.customerName)}</div>
          <div style="font-size:13px;color:#555">${esc(input.customerEmail)}</div>
          ${input.customerAddress ? `<div style="font-size:13px;color:#555">${esc(input.customerAddress)}</div>` : ""}
        </td>
        <td style="text-align:right;vertical-align:top;font-size:11px;color:#888;letter-spacing:1px">QUOTE DETAILS
          <div style="font-size:13px;color:#222;margin-top:4px">Date: ${esc(input.dateDisplay)}</div>
        </td>
      </tr></table>
    </td></tr>

    <!-- Service blocks -->
    <tr><td style="padding:12px 26px 0">${serviceBlocks}</td></tr>

    <!-- Table -->
    <tr><td style="padding:8px 26px 0">
      <table role="presentation" width="100%" style="border-collapse:collapse">
        <tr>
          <td style="padding:8px;font-size:11px;color:#888;letter-spacing:1px;border-bottom:2px solid #ddd">SERVICE</td>
          <td style="padding:8px;font-size:11px;color:#888;letter-spacing:1px;border-bottom:2px solid #ddd;text-align:center">QTY</td>
          <td style="padding:8px;font-size:11px;color:#888;letter-spacing:1px;border-bottom:2px solid #ddd;text-align:right">UNIT</td>
          <td style="padding:8px;font-size:11px;color:#888;letter-spacing:1px;border-bottom:2px solid #ddd;text-align:right">TOTAL</td>
        </tr>
        ${tableRows}
      </table>
    </td></tr>

    <!-- Totals -->
    <tr><td style="padding:14px 26px 8px">
      <table role="presentation" width="100%">
        <tr><td style="text-align:right;font-size:13px;color:#666;padding:2px 0">Subtotal</td><td width="110" style="text-align:right;font-size:13px;color:#666;padding:2px 0">${money(input.subtotal)}</td></tr>
        <tr><td style="text-align:right;font-size:13px;color:#666;padding:2px 0">VAT (20%)</td><td style="text-align:right;font-size:13px;color:#666;padding:2px 0">${money(input.vat)}</td></tr>
        <tr><td style="text-align:right;font-size:18px;color:#222;font-weight:bold;padding:6px 0">Total</td><td style="text-align:right;font-size:18px;color:${c.primary};font-weight:bold;padding:6px 0">${money(input.total)}</td></tr>
      </table>
    </td></tr>

    <tr><td style="padding:0 26px 14px;font-size:12px;color:#888">Quote valid for ${input.validityDays} days. To proceed, reply to this email — for tile/coating jobs please attach at least 2 photos of the affected area.</td></tr>

    <!-- Terms -->
    <tr><td style="padding:12px 26px;border-top:1px solid #eee">
      <div style="font-size:11px;color:#888;letter-spacing:1px;margin-bottom:8px">TERMS &amp; CONDITIONS</div>
      <ul style="margin:0;padding-left:18px;font-size:11px;color:#666;line-height:1.5">${terms}</ul>
    </td></tr>

    <!-- Footer -->
    <tr><td style="background:${c.primary};padding:16px 26px;text-align:center;color:#fff;font-size:12px">
      <strong>${esc(c.slogan)}</strong><br>
      ${esc(c.address)}<br>
      ${esc(c.phone)} · <a href="mailto:${esc(c.email)}" style="color:#fff;text-decoration:underline">${esc(c.email)}</a><br>
      <span style="font-size:11px;opacity:.9">Payment Terms: Payment On Completion · VAT: ${esc(c.vat)} · Co. No: ${esc(c.companyNo)}</span>
    </td></tr>
  </table>
</div>`;
}

function todayDisplay(): string {
  return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** Convenience: render the AUK quotation from a GeneratedQuote (+ catalog for rich descriptions). */
export function buildQuoteDocFromQuote(input: {
  quote: GeneratedQuote;
  customerName: string;
  customerEmail: string;
  customerAddress?: string;
  quoteRef: string;
  dateDisplay?: string;
  catalog?: CatalogService[];
}): string {
  const descByName = new Map<string, string>();
  (input.catalog ?? []).forEach((s) => descByName.set(s.name.toLowerCase(), s.description));

  const lineItems: QuoteDocLine[] = input.quote.line_items.map((li) => ({
    description: li.description,
    longDescription: li.catalog_name ? descByName.get(li.catalog_name.toLowerCase()) : undefined,
    quantity: li.quantity,
    unitPrice: li.unit_price_gbp,
    total: li.total_gbp,
  }));

  return buildQuoteDocumentHtml({
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerAddress: input.customerAddress,
    quoteRef: input.quoteRef,
    dateDisplay: input.dateDisplay ?? todayDisplay(),
    lineItems,
    subtotal: input.quote.subtotal_gbp,
    vat: input.quote.vat_gbp,
    total: input.quote.total_gbp,
    validityDays: input.quote.validity_days,
  });
}
