import { GoogleGenAI } from "@google/genai";

export type QuoteLineItem = {
  description: string;
  quantity: number;
  unit: string;
  unit_price_gbp: number;
  total_gbp: number;
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

const QUOTE_JSON_SCHEMA = {
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
          description: { type: "string" },
          quantity: { type: "number" },
          unit: { type: "string" },
          unit_price_gbp: { type: "number" },
          total_gbp: { type: "number" },
        },
        required: ["description", "quantity", "unit", "unit_price_gbp", "total_gbp"],
      },
    },
    subtotal_gbp: { type: "number" },
    vat_gbp: { type: "number" },
    total_gbp: { type: "number" },
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
    "subtotal_gbp",
    "vat_gbp",
    "total_gbp",
    "assumptions",
    "exclusions",
    "validity_days",
    "risk_notes",
  ],
} as const;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
  return new GoogleGenAI({ apiKey });
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * Reads a survey PDF/image with Gemini and returns a structured formal quote.
 */
export async function generateQuoteFromSurvey(input: {
  fileBuffer: Buffer;
  mimeType: string;
  fileName: string;
  customerName: string;
  city: string;
  region: string;
  businessName: string;
  pricingHints: {
    label: string;
    price: string;
    note: string;
    unit_type?: string;
    unit_price_gbp?: number;
  }[];
}): Promise<GeneratedQuote> {
  const ai = getClient();
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";

  const pricingText = input.pricingHints
    .map((p) => {
      const rate =
        "unit_price_gbp" in p && typeof p.unit_price_gbp === "number"
          ? `£${p.unit_price_gbp} (${p.price})`
          : p.price;
      return `- ${p.label}: ${rate}\n  Scope/notes: ${p.note}`;
    })
    .join("\n");

  const prompt = `You are a senior estimator for a UK HSE-licensed asbestos removal contractor (${input.businessName}) operating in ${input.city}, ${input.region}.

A customer named ${input.customerName} uploaded a site survey / asbestos report. Read the document carefully (OCR if needed) and produce a formal fixed-price quotation in GBP.

PRICE BOOK (company Service Catalog — use these rates as the primary basis for line items; match the closest catalog item to each ACM/work found in the report):
${pricingText}

Rules:
- Prefer catalog rates above. Use exact unit_price_gbp where the work matches a catalog item.
- For measured works (per m² / per unit / linear metre), estimate quantity from the report and multiply by the catalog rate.
- For fixed catalog items (garage roofs, tanks, boilers, etc.), use the fixed price when scope matches; note size/access assumptions if the report differs.
- If work is not in the catalog, price conservatively and state that in assumptions.
- Currency is GBP. Include 20% VAT as a separate vat_gbp field.
- line_items totals must add up to subtotal_gbp; subtotal + vat = total_gbp.
- Be specific: reference ACMs, locations, and works actually described in the report.
- If the report is unclear, state assumptions and use conservative mid-range pricing from the catalog.
- validity_days should be 30 unless the report implies urgency.
- Do not invent a property address if none is present — use null.
- risk_notes should highlight HSE / CAR 2012 considerations relevant to this job.
- Typical exclusions (unless clearly included in the catalog item): scaffolding by others, bitumen/resin adhesive removal under floor tiles, client-supplied access equipment where noted.
- Return ONLY structured JSON matching the schema.`;

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
      responseJsonSchema: QUOTE_JSON_SCHEMA,
      temperature: 0.2,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Gemini returned an empty quote response");

  const parsed = JSON.parse(text) as GeneratedQuote;

  if (!Array.isArray(parsed.line_items) || parsed.line_items.length === 0) {
    throw new Error("Gemini quote missing line items");
  }

  return parsed;
}
