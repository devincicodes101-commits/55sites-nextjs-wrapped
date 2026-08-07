import type { PricingHint } from "./catalog-pricing";

/**
 * OpenAI price estimation for asbestos works that are NOT in the fixed Service
 * Catalog. This is DELIBERATELY separate from the Gemini extraction step:
 *   - GEMINI_API_KEY  -> reads the survey document (extraction) — untouched here.
 *   - OPENAI_API_KEY  -> estimates a price for catalog-gap items (this file).
 */
export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

// Sanity bounds for a single unit price (£). Anything outside is rejected and the
// caller falls back to "manual quote required" rather than quoting a bad number.
const MIN_UNIT_PRICE = 1;
const MAX_UNIT_PRICE = 100_000;

export type EstimateInput = {
  description: string;
  quantity: number;
  unit: string;
  city: string;
  region: string;
  businessName: string;
  pricingHints: PricingHint[];
};

export type ItemEstimate = {
  identified_item: string;
  unit_price_min_gbp: number;
  unit_price_max_gbp: number;
  unit_price_applied_gbp: number; // = the minimum of the range (per requirement)
  total_gbp: number; // = applied unit price * quantity
  basis: string;
};

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Estimate a price for one catalog-gap asbestos removal item using OpenAI.
 * Returns the LOWER end of the estimated range applied to the quantity.
 *
 * Returns null (caller must fall back to "manual quote required") when:
 *   - OPENAI_API_KEY is not set,
 *   - the API call fails or times out,
 *   - the model is not confident it can identify/price the item, or
 *   - the returned price fails the sanity bounds.
 */
export async function estimateUnmatchedItem(
  input: EstimateInput,
): Promise<ItemEstimate | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.OPENAI_MODEL || "gpt-4o";

  const qty = Number(input.quantity);
  if (!Number.isFinite(qty) || qty <= 0) return null;

  const rateRef = input.pricingHints
    .map((p) => `- "${p.label}": £${p.unit_price_gbp} per ${p.unit_type}`)
    .join("\n");

  const system =
    `You are a senior UK HSE-licensed asbestos removal estimator for ${input.businessName}. ` +
    `You produce careful, realistic, conservative UK price estimates for asbestos removal works that are ` +
    `not in the company's fixed price catalog. Accurate identification of the item is critical: if you are ` +
    `not confident what the item is, do not guess a price.`;

  const user = `An asbestos removal work item was found in a customer's survey but is NOT in our fixed price catalog, so it needs an estimated price.

ITEM TO ESTIMATE
- Description: ${input.description}
- Quantity: ${qty}
- Unit: ${input.unit}
- Context: ${input.city}, ${input.region} (national pricing — do NOT adjust for location)

OUR EXISTING CATALOG RATES (anchor your estimate to this pricing level; stay consistent with these)
${rateRef || "(none provided)"}

INSTRUCTIONS
1. Carefully and correctly identify exactly what this asbestos item/work is.
2. If you cannot confidently identify it, set "confident" to false and do not price it.
3. If confident, give a realistic UK removal price ESTIMATE as a per-"${input.unit}" range in GBP (min and max), consistent with the catalog rates above. Be conservative — do not over-price.
4. Price PER SINGLE "${input.unit}" only — do NOT multiply by the quantity (${qty}); the system multiplies by the quantity afterwards. Anchor to the closest catalog rate above for a comparable material/unit so the estimate stays consistent with existing pricing.
5. If a very similar item already exists in the catalog rates above, keep your per-unit estimate close to that rate rather than inventing a different level.

Return ONLY strict JSON in exactly this shape (no prose, no markdown):
{
  "identified_item": "<clear short name of the item/work>",
  "confident": true or false,
  "unit_price_min_gbp": <number, price per ${input.unit}>,
  "unit_price_max_gbp": <number, price per ${input.unit}>,
  "basis": "<one short sentence on how you priced it>"
}`;

  let parsed: Record<string, unknown>;
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
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }

  if (!parsed || parsed.confident === false) return null;

  const min = Number(parsed.unit_price_min_gbp);
  const max = Number(parsed.unit_price_max_gbp);
  if (!Number.isFinite(min) || min < MIN_UNIT_PRICE || min > MAX_UNIT_PRICE) {
    return null;
  }

  // Requirement: always apply the MINIMUM of the estimated range.
  const applied = min;
  const total = round2(applied * qty);
  if (!Number.isFinite(total) || total <= 0) return null;

  const identified =
    typeof parsed.identified_item === "string" && parsed.identified_item.trim()
      ? parsed.identified_item.trim()
      : input.description;

  return {
    identified_item: identified,
    unit_price_min_gbp: round2(min),
    unit_price_max_gbp: Number.isFinite(max) ? round2(max) : round2(min),
    unit_price_applied_gbp: round2(applied),
    total_gbp: total,
    basis: typeof parsed.basis === "string" ? parsed.basis : "",
  };
}
