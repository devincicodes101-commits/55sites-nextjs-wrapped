import {
  applyCatalogRates,
  totalsFromLineItems,
  type CatalogService,
  type PricingHint,
} from "./catalog-pricing";

export type QuoteLineItem = {
  description: string;
  quantity: number;
  unit: string;
  unit_price_gbp: number;
  total_gbp: number;
  catalog_name?: string;
};

export type GeneratedQuote = {
  survey_summary: string;
  property_address: string | null;
  property_type: string | null;
  identified_acms: string[];
  recommended_works: string[];
  line_items: QuoteLineItem[];
  subtotal_gbp: number;
  vat_gbp: number;
  total_gbp: number;
  assumptions: string[];
  exclusions: string[];
  validity_days: number;
  risk_notes: string;
};

/** Gemini extracts scope only — unit prices come from the Service Catalog in code. */
type SurveyScopeDraft = {
  survey_summary: string;
  property_address: string | null;
  property_type: string | null;
  identified_acms: string[];
  recommended_works: string[];
  line_items: {
    catalog_name: string;
    description: string;
    quantity: number;
    unit: string;
  }[];
  assumptions: string[];
  exclusions: string[];
  validity_days: number;
  risk_notes: string;
};

const SCOPE_JSON_SCHEMA = {
  type: "object",
  properties: {
    survey_summary: { type: "string" },
    property_address: { type: ["string", "null"] },
    property_type: { type: ["string", "null"] },
    identified_acms: { type: "array", items: { type: "string" } },
    recommended_works: { type: "array", items: { type: "string" } },
    line_items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          catalog_name: { type: "string" },
          description: { type: "string" },
          quantity: { type: "number" },
          unit: { type: "string" },
        },
        required: ["catalog_name", "description", "quantity", "unit"],
      },
    },
    assumptions: { type: "array", items: { type: "string" } },
    exclusions: { type: "array", items: { type: "string" } },
    validity_days: { type: "number" },
    risk_notes: { type: "string" },
  },
  required: [
    "survey_summary",
    "identified_acms",
    "recommended_works",
    "line_items",
    "assumptions",
    "exclusions",
    "validity_days",
    "risk_notes",
  ],
} as const;

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * Reads a survey PDF/image with Gemini, maps works to the Service Catalog,
 * then applies fixed catalog unit prices in code (single source of truth).
 * Site/city must not change rates — same survey ⇒ same prices on every domain.
 */
export async function generateQuoteFromSurvey(input: {
  fileBuffer: Buffer;
  mimeType: string;
  fileName: string;
  customerName: string;
  city: string;
  region: string;
  businessName: string;
  pricingHints: PricingHint[];
  catalog: CatalogService[];
}): Promise<GeneratedQuote> {
  const { GoogleGenAI } = await import("@google/genai");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";

  const catalogNames = input.catalog
    .filter((s) => s.is_active !== false)
    .map((s) => s.name);

  const pricingText = input.pricingHints
    .map((p) => {
      const rate = `£${p.unit_price_gbp} (${p.price}) [${p.unit_type}]`;
      return `- "${p.label}": ${rate}\n  Scope/notes: ${p.note}`;
    })
    .join("\n");

  const prompt = `You are a senior estimator for a UK HSE-licensed asbestos removal contractor (${input.businessName}).
The customer enquiry is associated with ${input.city}, ${input.region} — use that only for context (address/local notes). Do NOT adjust prices for location: national Service Catalog rates apply identically on every website.

A customer named ${input.customerName} uploaded a site survey / asbestos report. Read the document carefully (OCR if needed).

Your job is SCOPE EXTRACTION ONLY — do not invent or calculate money amounts.
Unit prices are applied later from the company Service Catalog (Base44 Service entity). You must never output prices, GBP amounts, VAT, or totals.

SERVICE CATALOG (choose catalog_name EXACTLY from this list; copy the name character-for-character):
${catalogNames.map((n) => `- "${n}"`).join("\n")}

Catalog rate reference (for understanding unit types only — do not quote these numbers in the JSON):
${pricingText}

Rules:
- For each ACM / recommended removal or related catalog work in the report, add one line_item.
- catalog_name MUST be an exact string from the SERVICE CATALOG list above. If nothing matches, use catalog_name "OTHER" and explain in assumptions (OTHER lines are excluded from the priced quote).
- quantity: estimate from the report (m², number of sheets/bags/jobs). For fixed catalog jobs (garage roof, tank, boiler, etc.) use quantity 1 per occurrence.
- unit: use "m²", "unit", "sheet", "bag", or "job" as appropriate — the pricing engine will normalise from the catalog unit_type.
- description: short human-readable line referencing location/ACM from the report.
- Do not invent works that are not supported by the report.
- If the report is unclear on quantity, state the assumption and use a conservative measurable estimate.
- validity_days should be 30 unless the report implies urgency.
- Do not invent a property address if none is present — use null.
- risk_notes should highlight HSE / CAR 2012 considerations relevant to this job.
- Typical exclusions: scaffolding by others, bitumen/resin adhesive removal under floor tiles, client-supplied access equipment where noted in the catalog.
- Return ONLY structured JSON matching the schema (no prices).`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: input.mimeType,
              data: input.fileBuffer.toString("base64"),
            },
          },
          { text: `Uploaded filename: ${input.fileName}` },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: SCOPE_JSON_SCHEMA,
      temperature: 0,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Gemini returned an empty quote response");

  const draft = JSON.parse(text) as SurveyScopeDraft;

  // A survey can legitimately contain no asbestos (e.g. every sample "No Asbestos
  // Detected"). In that case Gemini correctly returns zero line items — return a
  // clean "no removal required" quote instead of failing the whole request.
  if (!Array.isArray(draft.line_items) || draft.line_items.length === 0) {
    return {
      survey_summary:
        draft.survey_summary ||
        "The uploaded survey did not identify any asbestos-containing materials requiring removal.",
      property_address: draft.property_address ?? null,
      property_type: draft.property_type ?? null,
      identified_acms: draft.identified_acms ?? [],
      recommended_works: draft.recommended_works ?? [],
      line_items: [],
      subtotal_gbp: 0,
      vat_gbp: 0,
      total_gbp: 0,
      assumptions: [
        ...(Array.isArray(draft.assumptions) ? draft.assumptions : []),
        "No asbestos-containing materials requiring removal were identified in the uploaded survey, so no removal works have been quoted. Please contact us if you would like a survey or further advice.",
      ],
      exclusions: Array.isArray(draft.exclusions) ? draft.exclusions : [],
      validity_days: typeof draft.validity_days === "number" ? draft.validity_days : 30,
      risk_notes: draft.risk_notes ?? "",
    };
  }

  const priced = applyCatalogRates(draft.line_items, input.catalog);
  if (priced.line_items.length === 0) {
    throw new Error(
      "No Service Catalog matches for the works found in this survey — please call us for a manual quote",
    );
  }

  // Totals are built from PRICED items only. Works we could not match to the
  // Service Catalog are never silently dropped (see below), but they must not
  // inflate the total either.
  const { subtotal_gbp, vat_gbp, total_gbp } = totalsFromLineItems(priced.line_items);

  const assumptions = [
    ...(Array.isArray(draft.assumptions) ? draft.assumptions : []),
    ...priced.assumptions,
    "Unit prices taken from the Asbestos UK Teams Service Catalog (Base44) — same rates on every website.",
  ];

  // Never silently drop works we could not price. Surface each unmatched item as a
  // visible line item marked "Manual quote required" so the quote can never hide
  // scope, and flag the whole quote as partial at the top of the assumptions.
  const manualLineItems = priced.unmatched.map((u) => ({
    description: `Manual quote required (not priced online): ${u.description}`,
    quantity: u.quantity,
    unit: u.unit,
    unit_price_gbp: 0,
    total_gbp: 0,
    catalog_name: "MANUAL_QUOTE_REQUIRED",
  }));

  if (manualLineItems.length > 0) {
    assumptions.unshift(
      `PARTIAL QUOTE — ${manualLineItems.length} item(s) below are marked "Manual quote required" and are NOT included in the total above. Please contact us so we can price these works before proceeding.`,
    );
  }

  return {
    survey_summary: draft.survey_summary,
    property_address: draft.property_address ?? null,
    property_type: draft.property_type ?? null,
    identified_acms: draft.identified_acms ?? [],
    recommended_works: draft.recommended_works ?? [],
    line_items: [
      ...priced.line_items.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unit: li.unit,
        unit_price_gbp: li.unit_price_gbp,
        total_gbp: li.total_gbp,
        catalog_name: li.catalog_name,
      })),
      ...manualLineItems,
    ],
    subtotal_gbp,
    vat_gbp,
    total_gbp,
    assumptions,
    exclusions: Array.isArray(draft.exclusions) ? draft.exclusions : [],
    validity_days: typeof draft.validity_days === "number" ? draft.validity_days : 30,
    risk_notes: draft.risk_notes ?? "",
  };
}
