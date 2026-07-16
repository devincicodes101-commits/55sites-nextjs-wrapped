import { createClient } from "@base44/sdk";
import type { GeneratedQuote } from "./gemini-quote";

export type QuoteLeadPayload = {
  firstName: string | null;
  lastName: string | null;
  phone: string;
  email: string | null;
  service: string | null;
  details: string | null;
  city: string;
  domain: string;
  /** Extended fields for survey-quote pilot leads */
  quote_ref?: string | null;
  quote_total_gbp?: number | null;
  quote_json?: string | null;
  survey_summary?: string | null;
  survey_file_name?: string | null;
  quote_emailed?: boolean | null;
  lead_source?: string | null;
  status?: string | null;
};

function getBase44Config() {
  const appId = process.env.BASE44_APP_ID;
  if (!appId) {
    throw new Error("Missing BASE44_APP_ID environment variable");
  }

  const entityName = process.env.BASE44_ENTITY ?? "Lead";
  const token = process.env.BASE44_API_TOKEN;
  const serviceToken = process.env.BASE44_SERVICE_TOKEN;

  return { appId, entityName, token, serviceToken };
}

export function isBase44Configured(): boolean {
  return Boolean(process.env.BASE44_APP_ID);
}

function getEntities(base44: ReturnType<typeof createClient>, serviceToken?: string) {
  return serviceToken ? base44.asServiceRole.entities : base44.entities;
}

/**
 * Creates a quote/lead record in the Base44 CRM app.
 */
export async function createQuoteInBase44(payload: QuoteLeadPayload) {
  const { appId, entityName, token, serviceToken } = getBase44Config();

  const base44 = createClient({
    appId,
    ...(token ? { token } : {}),
    ...(serviceToken ? { serviceToken } : {}),
  });

  const record: Record<string, unknown> = {
    first_name: payload.firstName,
    last_name: payload.lastName,
    phone: payload.phone,
    email: payload.email,
    service: payload.service,
    details: payload.details,
    city: payload.city,
    domain: payload.domain,
    source: payload.lead_source ?? "website",
    status: payload.status ?? "new",
  };

  if (payload.quote_ref != null) record.quote_ref = payload.quote_ref;
  if (payload.quote_total_gbp != null) record.quote_total_gbp = payload.quote_total_gbp;
  if (payload.quote_json != null) record.quote_json = payload.quote_json;
  if (payload.survey_summary != null) record.survey_summary = payload.survey_summary;
  if (payload.survey_file_name != null) record.survey_file_name = payload.survey_file_name;
  if (payload.quote_emailed != null) record.quote_emailed = payload.quote_emailed;

  const entities = getEntities(base44, serviceToken);
  const entity = (entities as Record<string, { create: (data: Record<string, unknown>) => Promise<unknown> }>)[
    entityName
  ];
  if (!entity?.create) {
    throw new Error(`Base44 entity "${entityName}" is not available`);
  }

  return entity.create(record);
}

export function buildLeadDetailsFromQuote(quote: GeneratedQuote, extras?: string): string {
  const lines = [
    extras?.trim() || null,
    `Survey summary: ${quote.survey_summary}`,
    quote.property_address ? `Property: ${quote.property_address}` : null,
    `ACMs: ${quote.identified_acms.join("; ") || "n/a"}`,
    `Works: ${quote.recommended_works.join("; ") || "n/a"}`,
    `Quote total (inc VAT): £${quote.total_gbp.toFixed(2)}`,
  ].filter(Boolean);
  return lines.join("\n\n");
}
