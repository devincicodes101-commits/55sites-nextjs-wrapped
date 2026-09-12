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
 *  - functions on the app's own host (andamangroup.co.uk — the CRM's current
 *    live domain; was crmazzy.com) — the platform host rejects function calls
 *    ("use the app's subdomain instead"). If the CRM domain changes again, set
 *    BASE44_CRM_FUNCTIONS_URL in the env instead of editing this file.
 *
 * Falls back to our own quote email when BASE44_CRM_* env vars are unset.
 */
export function isCrmConfigured(): boolean {
  return Boolean(process.env.BASE44_CRM_APP_ID && process.env.BASE44_CRM_TOKEN);
}

const ENTITIES_BASE = process.env.BASE44_CRM_API_URL || "https://app.base44.com/api";
const FUNCTIONS_BASE = process.env.BASE44_CRM_FUNCTIONS_URL || "https://andamangroup.co.uk/api";

function crmHeaders(): Record<string, string> {
  return { "Content-Type": "application/json", api_key: process.env.BASE44_CRM_TOKEN! };
}

export type CrmQuoteInput = {
  customerName: string;
  customerEmail: string;
  customerAddress?: string;
  customerPhone?: string;
  serviceInterest?: string;
  clientType?: "residential" | "commercial";
  quote: GeneratedQuote;
  salesAgentName?: string;
  originCity?: string;
  originDomain?: string;
};

/**
 * Create a Lead in the CRM so ALL sales reps see it as a live lead ("AI sent a
 * quote, not yet booked"). Links to the quote via converted_to_quote_id. Stays
 * live until a rep changes its status.
 */
export async function createCrmLead(input: {
  name: string;
  email: string;
  phone?: string;
  serviceInterest?: string;
  estimatedValue?: number;
  quoteId?: string;
  source?: string;
  notes?: string;
  message?: string;
  originCity?: string;
  originDomain?: string;
}): Promise<string | null> {
  try {
    const appId = process.env.BASE44_CRM_APP_ID!;
    // Record which city site the lead came from — in the source (visible in the
    // Leads list) and spelled out in the notes for full traceability.
    const baseSource = input.source || "AI Agent";
    const source = input.originCity ? `${baseSource} (${input.originCity})` : baseSource;
    const originLine = input.originCity
      ? `Enquiry from the ${input.originCity} site${input.originDomain ? ` (${input.originDomain})` : ""}.`
      : "";
    const notes = [originLine, input.notes || ""].filter(Boolean).join(" ").trim();
    const res = await fetch(`${ENTITIES_BASE}/apps/${appId}/entities/Lead`, {
      method: "POST",
      headers: crmHeaders(),
      body: JSON.stringify({
        name: input.name || "Website enquiry",
        email: input.email,
        phone: input.phone || "",
        service_interest: input.serviceInterest || "",
        estimated_value: input.estimatedValue ?? null,
        status: "new",
        priority: "medium",
        source,
        converted_to_quote_id: input.quoteId || null,
        // message = what the customer wrote (shows in "Initial Message / Enquiry");
        // notes = internal/team note (shows in "Internal Notes").
        message: input.message || "",
        notes,
      }),
    });
    if (!res.ok) {
      console.error("createCrmLead failed:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const rec = (await res.json()) as { id?: string };
    return rec?.id ?? null;
  } catch (err) {
    console.error("createCrmLead error:", err);
    return null;
  }
}

/** Create a Quote record in the CRM. Returns the new quote id, or null on failure. */
function makeCrmQuoteNumber(): string {
  return `QT-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

/**
 * Find an existing Customer by email, or create one (with the phone), so the
 * quote links to a real customer record and reps can see/call the client.
 * Returns the customer id, or null.
 */
async function createOrGetCustomerId(input: {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}): Promise<string | null> {
  const appId = process.env.BASE44_CRM_APP_ID!;
  try {
    if (input.email) {
      const q = encodeURIComponent(JSON.stringify({ email: input.email }));
      const findRes = await fetch(`${ENTITIES_BASE}/apps/${appId}/entities/Customer?q=${q}&limit=1`, {
        headers: crmHeaders(),
      });
      if (findRes.ok) {
        const arr = (await findRes.json()) as Array<{ id?: string }>;
        if (Array.isArray(arr) && arr[0]?.id) return arr[0].id;
      }
    }
    const res = await fetch(`${ENTITIES_BASE}/apps/${appId}/entities/Customer`, {
      method: "POST",
      headers: crmHeaders(),
      body: JSON.stringify({
        name: input.name,
        email: input.email,
        phone: input.phone || "",
        address: input.address || "",
        client_type: "domestic",
      }),
    });
    if (!res.ok) return null;
    const rec = (await res.json()) as { id?: string };
    return rec?.id ?? null;
  } catch (err) {
    console.error("createOrGetCustomerId error:", err);
    return null;
  }
}

export async function createCrmQuote(input: CrmQuoteInput): Promise<string | null> {
  try {
    const appId = process.env.BASE44_CRM_APP_ID!;
    // The quote email renders service_name, not description. For a photo enquiry
    // the "Indicative (subject to survey & sampling)" caveat lives in description,
    // so use that instead — otherwise an estimate made from a photograph of an
    // UNCONFIRMED material reaches the customer looking like a firm quotation.
    const isPhotoEnquiry = (input.quote.document_type || "").toLowerCase() === "photo_enquiry";
    // These catalog_names are internal sentinels for works with no Service Catalog
    // entry — they are not service names and must never be shown to a customer
    // ("AI_ESTIMATE" as a line item tells them nothing). Use the description.
    const SENTINEL_NAMES = new Set(["AI_ESTIMATE", "MANUAL_QUOTE_REQUIRED", "OTHER"]);
    const items: Array<Record<string, unknown>> = input.quote.line_items.map((li) => ({
      service_name:
        isPhotoEnquiry || SENTINEL_NAMES.has(li.catalog_name ?? "")
          ? li.description
          : li.catalog_name || li.description,
      quantity: li.quantity,
      unit_price: li.unit_price_gbp,
      unit_type: li.unit,
      total: li.total_gbp,
      description: li.description,
    }));

    // The customer asked for things we don't do (roof repairs, glazing). Say so on
    // the quote at £0 rather than answering one of their three questions in
    // silence, which reads as if we ignored the other two.
    const outOfScope = input.quote.out_of_scope_requests ?? [];
    if (isPhotoEnquiry && outOfScope.length > 0) {
      items.push({
        service_name: `Not included — we are asbestos removal specialists and do not carry out: ${outOfScope.join("; ")}`,
        quantity: 1,
        unit_price: 0,
        unit_type: "job",
        total: 0,
        description: "Excluded from this quotation.",
      });
    }

    // Strip a trailing placeholder last-name (e.g. "Test -" -> "Test").
    const customerName = input.customerName.replace(/\s*-\s*$/, "").trim() || input.customerName;

    // Link a real Customer record so the phone/contact is stored in the CRM.
    const customerId = await createOrGetCustomerId({
      name: customerName,
      email: input.customerEmail,
      phone: input.customerPhone,
      address: input.customerAddress,
    });

    const res = await fetch(`${ENTITIES_BASE}/apps/${appId}/entities/Quote`, {
      method: "POST",
      headers: crmHeaders(),
      body: JSON.stringify({
        // The CRM auto-numbers quotes made in its UI, but not via the API — set one.
        quote_number: makeCrmQuoteNumber(),
        client_type: input.clientType || "residential",
        customer_id: customerId,
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

  // Also create a live lead so all reps see it (quote sent, not yet booked).
  const cleanName = input.customerName.replace(/\s*-\s*$/, "").trim() || input.customerName;
  await createCrmLead({
    name: cleanName,
    email: input.customerEmail,
    phone: input.customerPhone,
    serviceInterest: input.serviceInterest,
    estimatedValue: input.quote.total_gbp,
    quoteId,
    source: input.salesAgentName || "AI Agent",
    originCity: input.originCity,
    originDomain: input.originDomain,
    notes: `AI agent sent a quotation (total £${input.quote.total_gbp.toFixed(2)}). Awaiting customer response — call to close.`,
  });

  return { quoteId, sent };
}
