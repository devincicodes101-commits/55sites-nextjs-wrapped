import { createClient } from "@base44/sdk";
import type { GeneratedQuote } from "./gemini-quote";

/**
 * Integration with the crmazzy / Asbestos UK Teams CRM (Base44 app).
 *
 * When configured, the AI agents create a Quote IN the CRM and trigger its
 * sendQuoteToCustomer function — so the customer gets the CRM's branded quote
 * with the Accept button, choose-date/diary scheduling, and the quote is stored
 * in the CRM's Quotes section, exactly like a rep sent it.
 *
 * Falls back to our own quote email when BASE44_CRM_* env vars are unset.
 */
export function isCrmConfigured(): boolean {
  return Boolean(process.env.BASE44_CRM_APP_ID && process.env.BASE44_CRM_TOKEN);
}

function crmClient() {
  return createClient({
    appId: process.env.BASE44_CRM_APP_ID!,
    // The CRM authenticates writes with an api_key header (not a bearer token).
    headers: { api_key: process.env.BASE44_CRM_TOKEN! },
  });
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
export async function createCrmQuote(input: CrmQuoteInput): Promise<string | null> {
  try {
    const base44 = crmClient();
    const items = input.quote.line_items.map((li) => ({
      service_name: li.catalog_name || li.description,
      quantity: li.quantity,
      unit_price: li.unit_price_gbp,
      unit_type: li.unit,
      total: li.total_gbp,
      description: li.description,
    }));

    const record = (await base44.entities.Quote.create({
      client_type: input.clientType || "residential",
      customer_name: input.customerName,
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
    })) as { id?: string };

    return record?.id ?? null;
  } catch (err) {
    console.error("createCrmQuote failed:", err);
    return null;
  }
}

/**
 * Send a CRM quote to the customer (branded email + Accept button + diary).
 * NOTE: if the CRM's sendQuoteToCustomer expects a different payload key than
 * `quote_id`, adjust here — the SDK routes the call to the app subdomain.
 */
export async function sendCrmQuote(quoteId: string): Promise<boolean> {
  try {
    const base44 = crmClient();
    const fn = (base44 as unknown as {
      functions: { sendQuoteToCustomer: (p: Record<string, unknown>) => Promise<unknown> };
    }).functions;
    await fn.sendQuoteToCustomer({ quote_id: quoteId });
    return true;
  } catch (err) {
    console.error("sendCrmQuote failed:", err);
    return false;
  }
}

/** Convenience: create the quote and send it in one call. Returns the quote id if created. */
export async function createAndSendCrmQuote(input: CrmQuoteInput): Promise<{ quoteId: string | null; sent: boolean }> {
  const quoteId = await createCrmQuote(input);
  if (!quoteId) return { quoteId: null, sent: false };
  const sent = await sendCrmQuote(quoteId);
  return { quoteId, sent };
}
