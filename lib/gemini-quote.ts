import {
  applyCatalogRates,
  totalsFromLineItems,
  type CatalogService,
  type PricingHint,
} from "./catalog-pricing";
import { estimateUnmatchedItem, isOpenAIConfigured } from "./openai-estimate";

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
  survey_type: string | null;
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
  survey_type: string | null;
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
    survey_type: { type: ["string", "null"] },
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

SURVEY TYPE (important — set survey_type and let it drive what you quote):
- Set survey_type to one of: "management", "refurbishment_demolition", "reinspection", or "other".
- A MANAGEMENT survey locates asbestos so it can be MANAGED IN PLACE. For a management survey, ONLY add a line_item for a material whose recommended Action is "Remove". Materials whose Action is "Manage" (leave in place / monitor) are NOT removal works — do NOT create line_items for them, and do NOT quote them for removal. If a management survey has no "Remove" items, return an empty line_items array.
- A REFURBISHMENT/DEMOLITION survey supports removal before works — quote the ACMs identified for removal as normal.
- When in doubt about an item, follow the report's stated Action column.

Rules:
- For each ACM / recommended removal or related catalog work in the report (subject to the SURVEY TYPE rules above), add one line_item.
- catalog_name MUST be an exact string from the SERVICE CATALOG list above. If nothing matches, use catalog_name "OTHER" and explain in assumptions (OTHER lines are excluded from the priced quote).
- quantity: estimate from the report (m², number of sheets/bags/jobs). For fixed catalog jobs (garage roof, tank, boiler, etc.) use quantity 1 per occurrence.
- unit: use "m²", "unit", "sheet", "bag", or "job" as appropriate — the pricing engine will normalise from the catalog unit_type.
- description: short human-readable line referencing location/ACM from the report.
- Do not invent works that are not supported by the report.
- IGNORE non-item pages: cover/title pages, contents, introduction, survey objectives/techniques, caveats, disclaimers, the material assessment algorithm, certificates of analysis, site plans, quality assurance, and standalone photo pages. Extract works ONLY from the actual ACM item entries and summary/register tables — the rows that have a Material Description, Location and Action. Skip "Negative"/"No Suspect Materials Found"/"No Asbestos Detected" entries.
- Prefer the report's own quantity/units (m², number of sheets/units) and its Action column when deciding what to quote.
- If the report is unclear on quantity, state the assumption and use a conservative measurable estimate.
- validity_days should be 30 unless the report implies urgency.
- Do not invent a property address if none is present — use null.
- risk_notes should highlight HSE / CAR 2012 considerations relevant to this job.
- Typical exclusions: scaffolding by others, bitumen/resin adhesive removal under floor tiles, client-supplied access equipment where noted in the catalog.
- Return ONLY structured JSON matching the schema (no prices).`;

  // Inline base64 is capped at ~20MB per request, which large multi-page surveys
  // exceed. For big files, upload via the Gemini File API and reference by URI;
  // small files stay inline (faster, no extra round-trip).
  const INLINE_LIMIT = 15 * 1024 * 1024; // 15MB raw (~20MB base64)
  let surveyPart: Record<string, unknown>;
  if (input.fileBuffer.length <= INLINE_LIMIT) {
    surveyPart = {
      inlineData: { mimeType: input.mimeType, data: input.fileBuffer.toString("base64") },
    };
  } else {
    const { createPartFromUri } = await import("@google/genai");
    const uploaded = await ai.files.upload({
      file: new Blob([new Uint8Array(input.fileBuffer)], { type: input.mimeType }),
      config: { mimeType: input.mimeType, displayName: input.fileName },
    });
    let file = uploaded;
    for (let i = 0; i < 90 && file.state === "PROCESSING"; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      file = await ai.files.get({ name: uploaded.name as string });
    }
    if (file.state !== "ACTIVE" || !file.uri || !file.mimeType) {
      throw new Error("Gemini could not process this survey file — please try a smaller file or call us");
    }
    surveyPart = createPartFromUri(file.uri, file.mimeType) as unknown as Record<string, unknown>;
  }

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          surveyPart,
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

  // No line items is a legitimate outcome, not a failure. Two common cases:
  //  1. A survey with no asbestos (every sample "No Asbestos Detected").
  //  2. A MANAGEMENT survey where all items are "Manage in place" (nothing to remove).
  // Return a clean, explanatory response instead of erroring the whole request.
  const isManagement = (draft.survey_type || "").toLowerCase().includes("manage");
  if (!Array.isArray(draft.line_items) || draft.line_items.length === 0) {
    const managementNote =
      "This is an asbestos MANAGEMENT survey: the materials identified are recommended to be managed in place, not removed, so no removal works have been quoted. If you need asbestos removal, you'll usually need a refurbishment/demolition survey first — please contact us and we'll advise.";
    const noAsbestosNote =
      "No asbestos-containing materials requiring removal were identified in the uploaded survey, so no removal works have been quoted. Please contact us if you would like a survey or further advice.";
    return {
      survey_summary:
        draft.survey_summary ||
        (isManagement
          ? "This management survey does not identify any asbestos requiring removal (materials are recommended to be managed in place)."
          : "The uploaded survey did not identify any asbestos-containing materials requiring removal."),
      survey_type: draft.survey_type ?? null,
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
        isManagement ? managementNote : noAsbestosNote,
      ],
      exclusions: Array.isArray(draft.exclusions) ? draft.exclusions : [],
      validity_days: typeof draft.validity_days === "number" ? draft.validity_days : 30,
      risk_notes: draft.risk_notes ?? "",
    };
  }

  const priced = applyCatalogRates(draft.line_items, input.catalog);

  // Catalog-gap items: works Gemini found in the survey that don't match a fixed
  // Service Catalog entry. For each one, try to price it with OpenAI (applying the
  // LOWER end of its estimated range). Extraction (Gemini) is untouched — this only
  // adds pricing for gaps. If OpenAI is unavailable or can't confidently price an
  // item, that item falls back to a visible "Manual quote required" line so scope
  // is never silently dropped.
  const catalogLineItems: QuoteLineItem[] = priced.line_items.map((li) => ({
    description: li.description,
    quantity: li.quantity,
    unit: li.unit,
    unit_price_gbp: li.unit_price_gbp,
    total_gbp: li.total_gbp,
    catalog_name: li.catalog_name,
  }));

  const estimatedLineItems: QuoteLineItem[] = [];
  const manualLineItems: QuoteLineItem[] = [];

  if (priced.unmatched.length > 0) {
    const results = await Promise.all(
      priced.unmatched.map(async (u) => ({
        u,
        estimate: isOpenAIConfigured()
          ? await estimateUnmatchedItem({
              description: u.description,
              quantity: u.quantity,
              unit: u.unit,
              city: input.city,
              region: input.region,
              businessName: input.businessName,
              pricingHints: input.pricingHints,
            })
          : null,
      })),
    );

    for (const { u, estimate } of results) {
      if (estimate) {
        estimatedLineItems.push({
          description: `Estimated: ${estimate.identified_item}`,
          quantity: u.quantity,
          unit: u.unit,
          unit_price_gbp: estimate.unit_price_applied_gbp,
          total_gbp: estimate.total_gbp,
          catalog_name: "AI_ESTIMATE",
        });
      } else {
        manualLineItems.push({
          description: `Manual quote required (not priced online): ${u.description}`,
          quantity: u.quantity,
          unit: u.unit,
          unit_price_gbp: 0,
          total_gbp: 0,
          catalog_name: "MANUAL_QUOTE_REQUIRED",
        });
      }
    }
  }

  // Decline safely only if nothing at all could be priced (no catalog match AND no
  // AI estimate).
  if (catalogLineItems.length === 0 && estimatedLineItems.length === 0) {
    throw new Error(
      "No Service Catalog matches for the works found in this survey — please call us for a manual quote",
    );
  }

  // Total includes firm catalog prices AND the AI estimates (min of range applied).
  // £0 "manual quote required" lines never affect the total.
  const pricedForTotal = [...catalogLineItems, ...estimatedLineItems];
  const { subtotal_gbp, vat_gbp, total_gbp } = totalsFromLineItems(pricedForTotal);

  const assumptions = [
    ...(Array.isArray(draft.assumptions) ? draft.assumptions : []),
    ...priced.assumptions,
    "Unit prices for catalogued works are taken from the Asbestos UK Teams Service Catalog (Base44) — same rates on every website.",
  ];

  if (estimatedLineItems.length > 0) {
    assumptions.push(
      `${estimatedLineItems.length} line item(s) marked "Estimated" are for works not in our fixed catalog; the price shown is an automated estimate (lower end of the assessed range) and may be refined after a site visit.`,
    );
  }

  if (manualLineItems.length > 0) {
    assumptions.unshift(
      `PARTIAL QUOTE — ${manualLineItems.length} item(s) below are marked "Manual quote required" and are NOT included in the total above. Please contact us so we can price these works before proceeding.`,
    );
  }

  if (isManagement) {
    assumptions.unshift(
      "This is a management survey, so only items the report marks for removal have been quoted; materials recommended to be managed in place are not included. Removal of those normally requires a refurbishment/demolition survey first.",
    );
  }

  return {
    survey_summary: draft.survey_summary,
    survey_type: draft.survey_type ?? null,
    property_address: draft.property_address ?? null,
    property_type: draft.property_type ?? null,
    identified_acms: draft.identified_acms ?? [],
    recommended_works: draft.recommended_works ?? [],
    line_items: [...catalogLineItems, ...estimatedLineItems, ...manualLineItems],
    subtotal_gbp,
    vat_gbp,
    total_gbp,
    assumptions,
    exclusions: Array.isArray(draft.exclusions) ? draft.exclusions : [],
    validity_days: typeof draft.validity_days === "number" ? draft.validity_days : 30,
    risk_notes: draft.risk_notes ?? "",
  };
}
