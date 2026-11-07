import {
  CATALOG_PRICING,
  loadCatalogWithSource,
  normalizeCatalogKey,
  shortNote,
  type CatalogService,
} from "./catalog-pricing";
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

// Words the agent may leave out of a service name without changing what it means.
// Keep this short: any other missing word could be the one that sets the price
// ("Garage Roof Removal" is missing "Double").
const FILLER_WORDS = new Set(["asbestos"]);
const MAX_CLOSEST_NAMES = 3;

export type ServiceNameMatch =
  | { kind: "exact" | "auto"; service: CatalogService }
  | { kind: "none"; closest: string[] };

function nameWords(name: string): string[] {
  return normalizeCatalogKey(name).split(" ").filter(Boolean);
}

/**
 * Match the name the phone agent sent to one catalog service. Beyond an exact match,
 * it only accepts a name where every word is in exactly one service and all that's
 * missing is filler. Anything else returns the closest names for the agent to choose from.
 */
export function resolveServiceName(name: string, catalog: CatalogService[]): ServiceNameMatch {
  const active = catalog.filter((s) => s.is_active !== false);
  const key = normalizeCatalogKey(name);

  const exact = active.find((s) => normalizeCatalogKey(s.name) === key);
  if (exact) return { kind: "exact", service: exact };

  const asked = new Set(nameWords(name));
  const autoMatches = active.filter((s) => {
    const words = nameWords(s.name);
    return (
      asked.size > 0 &&
      Array.from(asked).every((w) => words.includes(w)) &&
      words.every((w) => asked.has(w) || FILLER_WORDS.has(w))
    );
  });
  if (autoMatches.length === 1) return { kind: "auto", service: autoMatches[0] };

  const closest = active
    .map((s) => {
      const words = nameWords(s.name);
      return { name: s.name, shared: words.filter((w) => asked.has(w) && !FILLER_WORDS.has(w)).length, size: words.length };
    })
    .filter((s) => s.shared > 0)
    .sort((a, b) => b.shared - a.shared || a.size - b.size || a.name.localeCompare(b.name))
    .slice(0, MAX_CLOSEST_NAMES)
    .map((s) => s.name);
  return { kind: "none", closest };
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
