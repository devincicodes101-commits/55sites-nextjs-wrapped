import type { CatalogService } from "./catalog-pricing";

/**
 * Task C — email inquiry agent (brain).
 *
 * Reads an incoming customer email THREAD and works out, from free text, which
 * catalog service they want and what quantities they've given. Unlike the website
 * form (broad dropdown categories), email is natural language, so the model maps
 * straight to a specific catalog item — or asks a clarifying question when the
 * request is ambiguous (e.g. single vs double garage).
 *
 * Uses OPENAI_API_KEY. Returns null if OpenAI is unavailable or the response is
 * unusable, so the caller can fall back to a human handoff.
 */
export function isEmailAgentConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export type EmailIntent = {
  /** True when they are asking WHETHER we do something, rather than asking for a
   *  price. A yes/no question deserves a yes/no answer before we start quoting. */
  is_availability_question: boolean;
  /**
   * What kind of work this is, regardless of how it was asked:
   *  - "catalog_service" we price it automatically
   *  - "asbestos_other"  we do it, but a person prices it (survey, testing,
   *                      sampling, air monitoring, encapsulation, demolition)
   *  - "not_our_work"    nothing to do with asbestos (roofing repairs, glazing,
   *                      general building) — say so plainly
   *  - "unclear"         cannot tell from the thread
   */
  enquiry_kind: "catalog_service" | "asbestos_other" | "not_our_work" | "unclear";
  /** What they asked about, in their own words — used when declining. */
  requested_service_text: string;
  /** Exact catalog service name, or "ambiguous" or "unknown". */
  identified_service: string;
  /** When ambiguous: the single question to ask to resolve it. */
  clarification_question: string;
  area_sqm: number | null;
  length_lm: number | null;
  quantity: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  summary: string;
};

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function extractEmailIntent(input: {
  threadText: string;
  catalog: CatalogService[];
}): Promise<EmailIntent | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.OPENAI_MODEL || "gpt-4o";

  const catalogList = input.catalog
    .filter((s) => s.is_active !== false)
    .map((s) => `- "${s.name}" (priced ${s.unit_type})`)
    .join("\n");

  const system =
    "You are the intake assistant for a UK HSE-licensed asbestos removal company. " +
    "You read a customer's email thread and work out exactly which service from the " +
    "company's catalog they need, and how much (area, count, etc.). Be careful and precise. " +
    "If the request could match more than one catalog service (e.g. a garage roof could be " +
    "single or double), mark it ambiguous and give ONE clarifying question. If it clearly " +
    "isn't any catalog service, mark it unknown. You also judge whether the customer is " +
    "ASKING WHETHER WE OFFER something (a yes/no question) rather than asking for a price, " +
    "and what kind of work it is, so the reply can answer them honestly.";

  const user = `CATALOG SERVICES (choose "identified_service" EXACTLY from this list, or "ambiguous" / "unknown"):
${catalogList}

CUSTOMER EMAIL THREAD (most recent may be at the top or bottom — read all of it):
"""
${input.threadText.slice(0, 8000)}
"""

Extract the customer's intent across the WHOLE thread (they may have added details in later replies).

A thread often starts with "do you do X?" and only later gives the details. Judge
BOTH what kind of work it is and whether the latest message is asking whether we
offer it.

enquiry_kind must be one of:
- "catalog_service" — it matches a catalog service above (set identified_service too)
- "asbestos_other"  — genuine asbestos work we do but cannot auto-price: surveys,
                      testing, sampling, air monitoring, encapsulation, asbestos
                      demolition/strip-out
- "not_our_work"    — nothing to do with asbestos: roofing repairs or re-roofing,
                      glazing or windows, guttering, general building, plumbing
- "unclear"         — you cannot tell from the thread

Return ONLY strict JSON:
{
  "is_availability_question": <true if they are asking WHETHER we offer/do something, else false>,
  "enquiry_kind": "<catalog_service | asbestos_other | not_our_work | unclear>",
  "requested_service_text": "<what they asked about, in their own words, a few words only>",
  "identified_service": "<exact catalog name, or 'ambiguous', or 'unknown'>",
  "clarification_question": "<if ambiguous: one short question to resolve which service; else empty string>",
  "area_sqm": <number or null, if an area in m² is stated>,
  "length_lm": <number or null, if a length in linear metres is stated>,
  "quantity": <number or null, if a count of items (sheets/bags/units) is stated>,
  "customer_name": "<name if known, else null>",
  "customer_phone": "<phone if given, else null>",
  "customer_address": "<full site address incl. postcode if given, else null>",
  "summary": "<one short sentence describing what they want>"
}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const p = JSON.parse(content) as Record<string, unknown>;

    const identified =
      typeof p.identified_service === "string" && p.identified_service.trim()
        ? p.identified_service.trim()
        : "unknown";

    const kind = typeof p.enquiry_kind === "string" ? p.enquiry_kind.trim() : "";
    const enquiry_kind: EmailIntent["enquiry_kind"] =
      kind === "catalog_service" || kind === "asbestos_other" || kind === "not_our_work"
        ? kind
        : "unclear";

    return {
      is_availability_question: p.is_availability_question === true,
      enquiry_kind,
      requested_service_text:
        typeof p.requested_service_text === "string" ? p.requested_service_text.trim() : "",
      identified_service: identified,
      clarification_question:
        typeof p.clarification_question === "string" ? p.clarification_question.trim() : "",
      area_sqm: num(p.area_sqm),
      length_lm: num(p.length_lm),
      quantity: num(p.quantity),
      customer_name:
        typeof p.customer_name === "string" && p.customer_name.trim() ? p.customer_name.trim() : null,
      customer_phone:
        typeof p.customer_phone === "string" && p.customer_phone.trim() ? p.customer_phone.trim() : null,
      customer_address:
        typeof p.customer_address === "string" && p.customer_address.trim() ? p.customer_address.trim() : null,
      summary: typeof p.summary === "string" ? p.summary.trim() : "",
    };
  } catch {
    return null;
  }
}
