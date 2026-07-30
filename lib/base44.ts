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

/** Split a single "Full Name" into first/last for CRM fields. */
export function splitPersonName(fullName: string | null | undefined): {
  firstName: string | null;
  lastName: string | null;
} {
  const cleaned = (fullName ?? "").trim().replace(/\s+/g, " ");
  if (!cleaned) return { firstName: null, lastName: null };
  const parts = cleaned.split(" ");
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

/**
 * CRM `source` is typically a fixed enum (e.g. "website").
 * Keep the enum safe and put the form channel into details instead.
 */
export function normalizeCrmSource(source: string | null | undefined): string {
  const raw = (source ?? "").trim().toLowerCase();
  if (!raw || raw.startsWith("callback") || raw === "website" || raw === "survey_quote_pilot") {
    return "website";
  }
  return "website";
}

/** Always produce a non-empty details string for CRM visibility. */
export function buildCrmDetails(input: {
  details?: string | null;
  source?: string | null;
  city: string;
  domain: string;
}): string {
  const userText = (input.details ?? "").trim();
  const channel = (input.source ?? "website").trim() || "website";
  const meta = [`Channel: ${channel}`, `Site: ${input.city} (${input.domain})`];
  if (userText) return `${userText}\n\n${meta.join(" · ")}`;
  return `Callback / quote request (no extra message provided).\n\n${meta.join(" · ")}`;
}

function compactRecord(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    out[key] = value;
  }
  return out;
}

function formatBase44Error(err: unknown): string {
  if (!err || typeof err !== "object") return String(err);
  const e = err as {
    message?: string;
    status?: number;
    statusCode?: number;
    data?: unknown;
    response?: { data?: unknown; status?: number };
  };
  const status = e.status ?? e.statusCode ?? e.response?.status;
  const data = e.data ?? e.response?.data;
  const detail =
    typeof data === "string"
      ? data
      : data && typeof data === "object"
        ? JSON.stringify(data)
        : "";
  return [e.message, status ? `status=${status}` : null, detail || null].filter(Boolean).join(" | ");
}

/**
 * Creates a quote/lead record in the Base44 CRM app.
 * Writes both `details` and `message` so either Lead schema field receives the enquiry text.
 */
export async function createQuoteInBase44(payload: QuoteLeadPayload) {
  const { appId, entityName, token, serviceToken } = getBase44Config();

  const base44 = createClient({
    appId,
    ...(token ? { token } : {}),
    ...(serviceToken ? { serviceToken } : {}),
  });

  const detailsText = buildCrmDetails({
    details: payload.details,
    source: payload.lead_source,
    city: payload.city,
    domain: payload.domain,
  });

  // last_name: CRM schemas often require it — use "-" when the compact form only has one name.
  const lastName = (payload.lastName ?? "").trim() || "-";

  const record = compactRecord({
    first_name: payload.firstName,
    last_name: lastName,
    phone: payload.phone,
    email: payload.email,
    service: payload.service,
    // Dual-write for schema compatibility (pre/post "details" rename).
    details: detailsText,
    message: detailsText,
    city: payload.city,
    domain: payload.domain,
    source: normalizeCrmSource(payload.lead_source),
    status: payload.status ?? "new",
    quote_ref: payload.quote_ref,
    quote_total_gbp: payload.quote_total_gbp,
    quote_json: payload.quote_json,
    survey_summary: payload.survey_summary,
    survey_file_name: payload.survey_file_name,
    quote_emailed: payload.quote_emailed,
  });

  if (!record.phone && !record.email) {
    throw new Error("Phone or email is required to create a Base44 lead");
  }
  if (!record.first_name) {
    throw new Error("first_name is required to create a Base44 lead");
  }

  const entities = getEntities(base44, serviceToken);
  const entity = (entities as Record<string, { create: (data: Record<string, unknown>) => Promise<unknown> }>)[
    entityName
  ];
  if (!entity?.create) {
    throw new Error(`Base44 entity "${entityName}" is not available`);
  }

  try {
    return await entity.create(record);
  } catch (err) {
    throw new Error(`Base44 Lead.create failed: ${formatBase44Error(err)}`, { cause: err });
  }
}

/** Race a promise against a timeout so hung CRM calls cannot block form UX. */
export async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
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
