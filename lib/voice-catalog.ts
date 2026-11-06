import { CATALOG_PRICING, loadCatalogWithSource, shortNote, type CatalogService } from "./catalog-pricing";
import { UNIT_REQUIRED_INPUT, requiredInputFor } from "./enquiry-quote";

const FIXED_PRICE_ASK = "no measurement; ask how many if more than one";

/**
 * The agent must never state a price itself, so drop any sentence that mentions
 * one. Catalog descriptions do, e.g. "£30 per sheet; minimum call-out £350".
 */
function withoutPrices(text: string): string {
  return text
    .split(/(?<=[.!?;])\s+/)
    .filter((sentence) => !/£|\bGBP\b|\bpounds?\b/i.test(sentence))
    .join(" ");
}

/**
 * The service list the phone agent sees as {{service_list}}, one service per line.
 * Leaves out anything the quote route wouldn't price: inactive services, services
 * switched off for the phone, and unknown pricing units.
 */
export function buildServiceList(catalog: CatalogService[]): string {
  return catalog
    .filter((s) => s.is_active !== false && s.voice_enabled !== false && String(s.unit_type) in UNIT_REQUIRED_INPUT)
    .map((s) => {
      const ask = requiredInputFor(String(s.unit_type))?.label ?? FIXED_PRICE_ASK;
      const summary = s.voice_summary
        ? withoutPrices(s.voice_summary)
        : shortNote(withoutPrices(s.description), 120);
      return `- ${s.name} | ask for: ${ask} | ${summary}`;
    })
    .join("\n");
}

const CACHE_FRESH_MS = 5 * 60 * 1000;
const FETCH_BUDGET_MS = 3000;

// Per server instance, so a cold start begins empty. The list has no prices, so
// it can lag a little; /api/voice-quote always prices from a fresh fetch.
let lastGood: { services: CatalogService[]; fetchedAt: number } | null = null;

export type VoiceCatalog = {
  services: CatalogService[];
  source: "cache" | "base44" | "stale-cache" | "snapshot";
};

/**
 * The catalog for answering Vapi's assistant-request, which fails the call if it
 * takes over 7.5 seconds end to end. Recent cache, else one SDK attempt on a short
 * budget, else whatever we last had, else the snapshot.
 */
export async function loadVoiceCatalog(): Promise<VoiceCatalog> {
  if (lastGood && Date.now() - lastGood.fetchedAt < CACHE_FRESH_MS) {
    return { services: lastGood.services, source: "cache" };
  }

  const live = await loadCatalogWithSource({ sdkOnly: true, timeoutMs: FETCH_BUDGET_MS });
  if (live.source === "base44") {
    lastGood = { services: live.services, fetchedAt: Date.now() };
    return { services: live.services, source: "base44" };
  }

  return lastGood
    ? { services: lastGood.services, source: "stale-cache" }
    : { services: CATALOG_PRICING, source: "snapshot" };
}
