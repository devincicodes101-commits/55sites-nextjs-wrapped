import type { GeneratedQuote } from "./gemini-quote";

/**
 * Integration with the crmazzy / Asbestos UK Teams CRM (Base44 app).
 *
 * When configured, the AI agents create a Quote IN the CRM and trigger its
 * sendQuoteToCustomer function — so the customer gets the CRM's branded quote
 * with the Accept button, choose-date/diary scheduling, and the quote is stored
 * in the CRM's Quotes section, exactly like a rep sent it.
 *
 * Uses the REST API directly (verified working):
 *  - entities on the platform API host (app.base44.com)
 *  - functions on the app's own host (crmazzy.com) — the platform host rejects
 *    function calls ("use the app's subdomain instead").
 *
 * Falls back to our own quote email when BASE44_CRM_* env vars are unset.
 */
export function isCrmConfigured(): boolean {
  return Boolean(process.env.BASE44_CRM_APP_ID && process.env.BASE44_CRM_TOKEN);
}

const ENTITIES_BASE = process.env.BASE44_CRM_API_URL || "https://app.base44.com/api";
const FUNCTIONS_BASE = process.env.BASE44_CRM_FUNCTIONS_URL || "https://crmazzy.com/api";

function crmHeaders(): Record<string, string> {
  return { "Content-Type": "application/json", api_key: process.env.BASE44_CRM_TOKEN! };
}

export type CrmQuoteInput = {
  customerName: string;
  customerEmail: string;
  customerAddress?: string;
  clientType?: "residential" | "commercial";
  quote: GeneratedQuote;
  salesAgentName?: string;
};

/** Create a Quote record in the CRM. Returns the new quote id, or null on failure. */
function makeCrmQuoteNumber(): string {
  return `QT-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

export async function createCrmQuote(input: CrmQuoteInput): Promise<string | null> {
  try {
    const appId = process.env.BASE44_CRM_APP_ID!;
    const items = input.quote.line_items.map((li) => ({
      service_name: li.catalog_name || li.description,
      quantity: li.quantity,
      unit_price: li.unit_price_gbp,
      unit_type: li.unit,
      total: li.total_gbp,
      description: li.description,
    }));

    // Strip a trailing placeholder last-name (e.g. "Test -" -> "Test").
    const customerName = input.customerName.replace(/\s*-\s*$/, "").trim() || input.customerName;

    const res = await fetch(`${ENTITIES_BASE}/apps/${appId}/entities/Quote`, {
      method: "POST",
      headers: crmHeaders(),
      body: JSON.stringify({
        // The CRM auto-numbers quotes made in its UI, but not via the API — set one.
        quote_number: makeCrmQuoteNumber(),
        client_type: input.clientType || "residential",
        customer_name: customerName,
        customer_email: input.customerEmail,
        customer_address: input.customerAddress || "",
        subtotal: input.quote.subtotal_gbp,
        vat_rate: 20,
        vat_amount: input.quote.vat_gbp,
        total: input.quote.total_gbp,
        status: "draft",
        template_style: "modern",
        sales_agent_name: input.salesAgentName || "AI Assistant",
        items,
      }),
    });

    if (!res.ok) {
      console.error("createCrmQuote failed:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const rec = (await res.json()) as { id?: string };
    return rec?.id ?? null;
  } catch (err) {
    console.error("createCrmQuote error:", err);
    return null;
  }
}

/** Send a CRM quote to the customer (branded email + Accept button + diary). */
export async function sendCrmQuote(quoteId: string): Promise<boolean> {
  try {
    const appId = process.env.BASE44_CRM_APP_ID!;
    const res = await fetch(`${FUNCTIONS_BASE}/apps/${appId}/functions/sendQuoteToCustomer`, {
      method: "POST",
      headers: crmHeaders(),
      body: JSON.stringify({ quote_id: quoteId }),
    });
    if (!res.ok) {
      console.error("sendCrmQuote failed:", res.status, await res.text().catch(() => ""));
      return false;
    }
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (data.error) {
      console.error("sendCrmQuote error:", data.error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("sendCrmQuote error:", err);
    return false;
  }
}

/** Create the quote and send it in one call. */
export async function createAndSendCrmQuote(
  input: CrmQuoteInput,
): Promise<{ quoteId: string | null; sent: boolean }> {
  const quoteId = await createCrmQuote(input);
  if (!quoteId) return { quoteId: null, sent: false };
  const sent = await sendCrmQuote(quoteId);
  return { quoteId, sent };
}
