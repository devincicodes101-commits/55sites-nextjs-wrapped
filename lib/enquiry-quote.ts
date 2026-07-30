import {
  findCatalogService,
  totalsFromLineItems,
  type CatalogService,
} from "./catalog-pricing";
import type { GeneratedQuote } from "./gemini-quote";

/**
 * Instant quote from a website ENQUIRY form (no survey document).
 *
 * The required customer input for each service is derived from its catalog
 * `unit_type`: a per-m² service needs an area, a per-unit service needs a count,
 * a fixed-price service needs nothing extra. If the required field is missing we
 * ask the customer for it (see the API route) rather than quoting on a guess.
 */

export type EnquiryFields = {
  area_sqm?: number | null;
  length_lm?: number | null;
  quantity?: number | null;
  hours?: number | null;
  days?: number | null;
};

type RequiredInput = { key: keyof EnquiryFields; label: string };

// Which customer input each pricing basis needs. `fixed` needs none (flat price).
const UNIT_REQUIRED_INPUT: Record<string, RequiredInput | null> = {
  per_sqm: { key: "area_sqm", label: "the area to be treated, in square metres (m²)" },
  per_lm: { key: "length_lm", label: "the length, in linear metres" },
  per_unit: { key: "quantity", label: "the number of items (e.g. sheets or 25kg bags)" },
  per_hour: { key: "hours", label: "the estimated number of hours" },
  per_day: { key: "days", label: "the number of days required" },
  fixed: null,
};

function requiredInputFor(unitType: string): RequiredInput | null {
  return unitType in UNIT_REQUIRED_INPUT ? UNIT_REQUIRED_INPUT[unitType] : null;
}

function displayUnit(unitType: string): string {
  switch (unitType) {
    case "per_sqm":
      return "m²";
    case "per_lm":
      return "linear m";
    case "per_hour":
      return "hr";
    case "per_day":
      return "day";
    case "per_unit":
      return "unit";
    default:
      return "job";
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export type EnquiryAssessment =
  | { status: "unquotable"; reason: string }
  | { status: "info_required"; missing: string[]; service: string }
  | { status: "quoted"; quote: GeneratedQuote };

/**
 * Assess a website enquiry against the Service Catalog:
 *  - "unquotable"    -> service isn't in the catalog (route to a human)
 *  - "info_required" -> priced by area/count/etc. but that value is missing
 *  - "quoted"        -> everything needed is present; a quote is returned
 */
export function assessEnquiry(input: {
  service: string;
  fields: EnquiryFields;
  catalog: CatalogService[];
}): EnquiryAssessment {
  const svc = findCatalogService(input.service, input.catalog);
  if (!svc) {
    return {
      status: "unquotable",
      reason: `"${input.service}" is not an online-priceable service — routed to our team.`,
    };
  }

  const unitType = String(svc.unit_type);
  const required = requiredInputFor(unitType);

  let quantity = 1;
  if (required) {
    const raw = input.fields[required.key];
    const value = Number(raw);
    if (raw == null || !Number.isFinite(value) || value <= 0) {
      return { status: "info_required", missing: [required.label], service: input.service };
    }
    quantity = value;
  }

  const unitPrice = Number(svc.unit_price);
  const line = {
    description: svc.name,
    quantity: round2(quantity),
    unit: displayUnit(unitType),
    unit_price_gbp: round2(unitPrice),
    total_gbp: round2(quantity * unitPrice),
    catalog_name: svc.name,
  };
  const { subtotal_gbp, vat_gbp, total_gbp } = totalsFromLineItems([line]);

  const quote: GeneratedQuote = {
    survey_summary: `Quote prepared from your website enquiry for "${svc.name}".`,
    property_address: null,
    property_type: null,
    identified_acms: [],
    recommended_works: [svc.name],
    line_items: [line],
    subtotal_gbp,
    vat_gbp,
    total_gbp,
    assumptions: [
      "Priced from the Asbestos UK Teams Service Catalog — the same rates apply on every website.",
      "This quote is based on the information you provided and may be refined after a site visit.",
    ],
    exclusions: [],
    validity_days: 30,
    risk_notes: "",
  };

  return { status: "quoted", quote };
}
