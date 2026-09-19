/**
 * GoGreen Surveyors price book — asbestos SURVEY and TESTING work only.
 *
 * Deliberately separate from the Base44 Service Catalog, which prices REMOVAL.
 * The two never mix: a survey enquiry is priced here, emailed to GoGreen and
 * never becomes a CRM quote; a removal enquiry never touches this file.
 *
 * Every price is EXCLUSIVE of VAT — the client was explicit that the chat must
 * say "plus VAT" out loud each time, so nothing here is VAT-inclusive.
 *
 * Confirmed by the client 2026-09-20:
 *  - Two survey types only. "R&D" means Refurbishment & Demolition and already
 *    covers demolition, so Refurbishment and Demolition are NOT offered
 *    separately to a homeowner. Commercial keeps its own Demolition column
 *    because the price list has one.
 *  - Domestic 6/7/8 bedrooms are exact prices, not a range.
 *  - The 10% discount applies to the base survey price only.
 */

export type SurveyType = "management" | "rd" | "demolition";
export type PropertyKind = "domestic" | "commercial";

export const SURVEY_TYPE_LABELS: Record<SurveyType, string> = {
  management: "Management Survey",
  rd: "Refurbishment & Demolition (R&D) Survey",
  demolition: "Demolition Survey",
};

/** What a lookup can come back with: a price, or a reason there isn't one. */
export type SurveyPrice =
  | { kind: "price"; gbp: number; label: string; discountedGbp: number }
  | { kind: "poa"; label: string; reason: string }
  | { kind: "needs_size"; reason: string };

export const DISCOUNT_RATE = 0.1;

/** 10% off, to the penny. Base survey price only — never the extras. */
export function applyDiscount(gbp: number): number {
  return Math.round(gbp * (1 - DISCOUNT_RATE) * 100) / 100;
}

// ---------------------------------------------------------------- domestic

/**
 * Domestic prices by bedroom count. Management is one price across 6-8 beds;
 * R&D is priced per bedroom from 6 upwards.
 */
const DOMESTIC: Array<{ minBeds: number; maxBeds: number; management: number; rd: number }> = [
  { minBeds: 1, maxBeds: 2, management: 300, rd: 350 },
  { minBeds: 3, maxBeds: 5, management: 350, rd: 395 },
  { minBeds: 6, maxBeds: 6, management: 395, rd: 450 },
  { minBeds: 7, maxBeds: 7, management: 395, rd: 470 },
  { minBeds: 8, maxBeds: 8, management: 395, rd: 495 },
];

/** Cheapest domestic price, for the opening "starts from" line. */
export const DOMESTIC_FROM_GBP = 300;
/** Above this the price list stops and a surveyor has to quote it. */
export const DOMESTIC_MAX_BEDROOMS = 8;
/** What the opening line says it covers — the common case, per the client. */
export const DOMESTIC_HEADLINE_BEDROOMS = 6;

export function priceDomesticSurvey(type: SurveyType, bedrooms: number): SurveyPrice {
  if (!Number.isFinite(bedrooms) || bedrooms < 1) {
    return { kind: "needs_size", reason: "How many bedrooms does the property have?" };
  }
  if (bedrooms > DOMESTIC_MAX_BEDROOMS) {
    return {
      kind: "poa",
      label: `Domestic survey, ${bedrooms} bedrooms`,
      reason: `Our domestic price list covers houses up to ${DOMESTIC_MAX_BEDROOMS} bedrooms — anything larger is quoted individually by a surveyor.`,
    };
  }
  // A homeowner asking for a demolition survey gets R&D: it already covers
  // refurbishment AND demolition, and there is no separate domestic price.
  const effective: SurveyType = type === "demolition" ? "rd" : type;
  const band = DOMESTIC.find((b) => bedrooms >= b.minBeds && bedrooms <= b.maxBeds);
  if (!band) return { kind: "needs_size", reason: "How many bedrooms does the property have?" };
  const gbp = effective === "management" ? band.management : band.rd;
  return {
    kind: "price",
    gbp,
    discountedGbp: applyDiscount(gbp),
    label: `${SURVEY_TYPE_LABELS[effective]} — ${bedrooms} bedroom domestic property`,
  };
}

// -------------------------------------------------------------- commercial

const COMMERCIAL: Array<{
  maxSqm: number | null;
  label: string;
  management: number | null;
  rd: number | null;
  demolition: number | null;
}> = [
  { maxSqm: 500, label: "Up to 500 m²", management: 395, rd: 495, demolition: 595 },
  { maxSqm: 1000, label: "501–1,000 m²", management: 495, rd: 650, demolition: 750 },
  { maxSqm: 2000, label: "1,001–2,000 m²", management: 650, rd: 850, demolition: 1000 },
  { maxSqm: 3000, label: "2,001–3,000 m²", management: 800, rd: 1050, demolition: 1250 },
  { maxSqm: 5000, label: "3,001–5,000 m²", management: 1000, rd: 1350, demolition: 1600 },
  { maxSqm: 10000, label: "5,001–10,000 m²", management: 1350, rd: 1800, demolition: 2200 },
  { maxSqm: 20000, label: "10,001–20,000 m²", management: 1800, rd: 2500, demolition: 3000 },
  { maxSqm: null, label: "Over 20,000 m²", management: null, rd: null, demolition: null },
];

export function priceCommercialSurvey(type: SurveyType, sqm: number): SurveyPrice {
  if (!Number.isFinite(sqm) || sqm <= 0) {
    return {
      kind: "needs_size",
      reason: "We need the approximate floor area in m² to price a commercial survey.",
    };
  }
  const band = COMMERCIAL.find((b) => b.maxSqm === null || sqm <= b.maxSqm)!;
  const price = band[type];
  if (price === null) {
    return {
      kind: "poa",
      label: `${SURVEY_TYPE_LABELS[type]} — ${band.label}`,
      reason: "Properties over 20,000 m² are priced on application by a surveyor.",
    };
  }
  return {
    kind: "price",
    gbp: price,
    discountedGbp: applyDiscount(price),
    label: `${SURVEY_TYPE_LABELS[type]} — commercial, ${band.label}`,
  };
}

export function priceSurvey(input: {
  property: PropertyKind;
  type: SurveyType;
  bedrooms?: number | null;
  sqm?: number | null;
}): SurveyPrice {
  return input.property === "domestic"
    ? priceDomesticSurvey(input.type, input.bedrooms ?? 0)
    : priceCommercialSurvey(input.type, input.sqm ?? 0);
}

// ------------------------------------------------------- additional services

/**
 * "from" and percentage prices must never be presented as a final figure, and
 * POA must never be given a number — both are client rules, so the price kind
 * travels with the price rather than living only in the prompt.
 */
export type ExtraKind = "fixed" | "from" | "surcharge" | "percent" | "poa";

export const SURVEY_EXTRAS: Array<{ name: string; gbp: number | null; kind: ExtraKind; note: string }> = [
  { name: "Asbestos Re-inspection Survey", gbp: 195, kind: "from", note: "from £195 + VAT" },
  { name: "Standalone Asbestos Sampling Visit", gbp: 140, kind: "from", note: "from £140 + VAT" },
  { name: "Single Sample Testing (domestic)", gbp: 250, kind: "fixed", note: "£250 + VAT" },
  { name: "Additional Laboratory Sample", gbp: 45, kind: "fixed", note: "£45 + VAT per sample" },
  { name: "Asbestos Register Update", gbp: 195, kind: "from", note: "from £195 + VAT" },
  { name: "Asbestos Management Plan", gbp: 250, kind: "from", note: "from £250 + VAT" },
  { name: "Management Plan + Register", gbp: 395, kind: "from", note: "from £395 + VAT" },
  { name: "24-Hour Priority Report", gbp: 100, kind: "surcharge", note: "+£100 + VAT" },
  { name: "Same-Day Survey/Report", gbp: 200, kind: "surcharge", note: "+£200 + VAT" },
  { name: "Out-of-Hours / Weekend Survey", gbp: null, kind: "percent", note: "+25–50% + VAT" },
  { name: "Specialist Access / MEWP / Scaffolding", gbp: null, kind: "poa", note: "price on application" },
  { name: "Large / Complex / Multi-Site Projects", gbp: null, kind: "poa", note: "price on application" },
];

// ------------------------------------------------- price table for the prompt

function money(n: number): string {
  return `£${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`;
}

/**
 * Renders the whole price book as text for the chat prompt, with the 10% figure
 * already worked out for every row. The model reads a cell instead of doing
 * arithmetic — the discount is the only sum in this flow and it is the easiest
 * one to get wrong in front of a customer.
 */
export function renderSurveyPriceTable(): string {
  const lines: string[] = [];

  lines.push("DOMESTIC (per property, plus VAT) — list price | price after the 10% discount");
  for (const b of DOMESTIC) {
    const beds = b.minBeds === b.maxBeds ? `${b.minBeds} bedroom` : `${b.minBeds}–${b.maxBeds} bedroom`;
    lines.push(
      `- ${beds}: Management ${money(b.management)} | ${money(applyDiscount(b.management))}   ·   R&D ${money(b.rd)} | ${money(applyDiscount(b.rd))}`,
    );
  }
  lines.push(`- Over ${DOMESTIC_MAX_BEDROOMS} bedrooms: NO PRICE — a surveyor quotes it. Offer a callback.`);

  lines.push("");
  lines.push("COMMERCIAL (by floor area, plus VAT) — list price | price after the 10% discount");
  for (const b of COMMERCIAL) {
    if (b.management === null) {
      lines.push(`- ${b.label}: POA — NO PRICE. Offer a callback.`);
      continue;
    }
    lines.push(
      `- ${b.label}: Management ${money(b.management)} | ${money(applyDiscount(b.management))}   ·   R&D ${money(b.rd!)} | ${money(applyDiscount(b.rd!))}   ·   Demolition ${money(b.demolition!)} | ${money(applyDiscount(b.demolition!))}`,
    );
  }

  lines.push("");
  lines.push("ADDITIONAL SERVICES (plus VAT, NEVER discounted):");
  for (const e of SURVEY_EXTRAS) lines.push(`- ${e.name}: ${e.note}`);

  return lines.join("\n");
}
