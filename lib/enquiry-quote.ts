import {
  applyMinimumCharge,
  findCatalogService,
  totalsFromLineItems,
  type CatalogService,
} from "./catalog-pricing";
import type { GeneratedQuote, QuoteLineItem } from "./gemini-quote";

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
  /** `skipped` lists requested services that are NOT in the quote: the team must follow them up. */
  | { status: "quoted"; quote: GeneratedQuote; skipped: string[] };

export type AssessOptions = {
  /** Allow partial service-name matches. Defaults to true; the phone agent sets false. */
  allowPartial?: boolean;
  /**
   * Multiply fixed-price services by `fields.quantity`, up to this many. Above it,
   * or for a part-number, the service goes to the team. Off by default: chat and
   * email quantities are AI-extracted and can be something else, such as a sheet
   * count on a garage roof.
   */
  maxFixedQuantity?: number;
};

const STANDARD_ASSUMPTIONS = [
  "Priced from the Asbestos UK Teams Service Catalog — the same rates apply on every website.",
  "This quote is based on the information you provided and may be refined after a site visit.",
];

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
  options?: AssessOptions;
}): EnquiryAssessment {
  const { allowPartial, maxFixedQuantity } = input.options ?? {};
  const svc = findCatalogService(input.service, input.catalog, { allowPartial });
  if (!svc) {
    return {
      status: "unquotable",
      reason: `"${input.service}" is not an online-priceable service — routed to our team.`,
    };
  }

  const unitType = String(svc.unit_type);
  if (!(unitType in UNIT_REQUIRED_INPUT)) {
    console.warn(`[catalog] unknown unit_type "${unitType}" on service "${svc.name}"; routing to the team`);
    return {
      status: "unquotable",
      reason: `"${svc.name}" has an unrecognised pricing unit — routed to our team.`,
    };
  }
  const required = requiredInputFor(unitType);

  let quantity = 1;
  if (required) {
    const raw = input.fields[required.key];
    const value = Number(raw);
    if (raw == null || !Number.isFinite(value) || value <= 0) {
      return { status: "info_required", missing: [required.label], service: input.service };
    }
    quantity = value;
  } else if (maxFixedQuantity != null && input.fields.quantity != null) {
    const count = Number(input.fields.quantity);
    if (Number.isFinite(count) && count > 0) {
      if (count > maxFixedQuantity || !Number.isInteger(count)) {
        return {
          status: "unquotable",
          reason: `"${svc.name}" quantity ${count} needs checking by the team — routed to our team.`,
        };
      }
      quantity = count;
    }
  }

  const { total, unitPrice, assumption } = applyMinimumCharge(svc, quantity);
  const line = {
    description: svc.name,
    quantity: round2(quantity),
    unit: displayUnit(unitType),
    unit_price_gbp: round2(unitPrice),
    total_gbp: total,
    catalog_name: svc.name,
  };
  const { subtotal_gbp, vat_gbp, total_gbp } = totalsFromLineItems([line]);

  const quote: GeneratedQuote = {
    survey_summary: `Quote prepared from your website enquiry for "${svc.name}".`,
    survey_type: null,
    property_address: null,
    property_type: null,
    identified_acms: [],
    recommended_works: [svc.name],
    line_items: [line],
    subtotal_gbp,
    vat_gbp,
    total_gbp,
    assumptions: [...STANDARD_ASSUMPTIONS, ...(assumption ? [assumption] : [])],
    exclusions: [],
    validity_days: 30,
    risk_notes: "",
  };

  return { status: "quoted", quote, skipped: [] };
}

export type EnquiryItem = { service: string; fields: EnquiryFields };

/**
 * Assess an enquiry that may include SEVERAL services (e.g. "artex removal AND a
 * garage roof"). Each item is priced against the catalog and all line items are
 * combined into ONE quote. If any item still needs a measurement, we return
 * "info_required" so the chat can ask for it before quoting. Services that can't
 * be auto-priced are left out of the quote and listed in `skipped`.
 */
export function assessEnquiryItems(input: {
  items: EnquiryItem[];
  catalog: CatalogService[];
  options?: AssessOptions;
}): EnquiryAssessment {
  if (!input.items || input.items.length === 0) {
    return { status: "unquotable", reason: "No services were provided." };
  }

  const lineItems: QuoteLineItem[] = [];
  const worksNames: string[] = [];
  const extraAssumptions: string[] = [];
  const skipped: string[] = [];

  for (const item of input.items) {
    if (!item.service || !item.service.trim()) continue;
    const one = assessEnquiry({
      service: item.service,
      fields: item.fields,
      catalog: input.catalog,
      options: input.options,
    });
    // Missing a measurement for any item -> ask for it before quoting anything.
    if (one.status === "info_required") return one;
    // A service that isn't online-priceable is skipped (the priceable ones still quote).
    if (one.status === "unquotable") {
      skipped.push(item.service.trim());
      continue;
    }
    lineItems.push(...one.quote.line_items);
    worksNames.push(...one.quote.recommended_works);
    extraAssumptions.push(...one.quote.assumptions.filter((a) => !STANDARD_ASSUMPTIONS.includes(a)));
  }

  if (lineItems.length === 0) {
    return {
      status: "unquotable",
      reason: "None of the requested services are online-priceable — routed to our team.",
    };
  }

  const { subtotal_gbp, vat_gbp, total_gbp } = totalsFromLineItems(lineItems);
  const quote: GeneratedQuote = {
    survey_summary: `Quote prepared from your website enquiry for: ${worksNames.join(", ")}.`,
    survey_type: null,
    property_address: null,
    property_type: null,
    identified_acms: [],
    recommended_works: worksNames,
    line_items: lineItems,
    subtotal_gbp,
    vat_gbp,
    total_gbp,
    assumptions: [...STANDARD_ASSUMPTIONS, ...extraAssumptions],
    exclusions: [],
    validity_days: 30,
    risk_notes: "",
  };

  return { status: "quoted", quote, skipped };
}
