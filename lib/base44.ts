import { createClient } from "@base44/sdk";

export type QuoteLeadPayload = {
  firstName: string | null;
  lastName: string | null;
  phone: string;
  email: string | null;
  service: string | null;
  details: string | null;
  city: string;
  domain: string;
};

function getBase44Config() {
  const appId = process.env.BASE44_APP_ID;
  if (!appId) {
    throw new Error("Missing BASE44_APP_ID environment variable");
  }

  const entityName = process.env.BASE44_ENTITY ?? "Quote";
  const token = process.env.BASE44_API_TOKEN;
  const serviceToken = process.env.BASE44_SERVICE_TOKEN;

  return { appId, entityName, token, serviceToken };
}

export function isBase44Configured(): boolean {
  return Boolean(process.env.BASE44_APP_ID);
}

/**
 * Creates a quote/lead record in the Base44 CRM app.
 *
 * Auth options (pick one):
 * - BASE44_SERVICE_TOKEN → uses asServiceRole (bypasses entity access rules)
 * - BASE44_API_TOKEN → authenticated user create
 * - neither → anonymous create (entity must allow public create in Base44)
 */
export async function createQuoteInBase44(payload: QuoteLeadPayload) {
  const { appId, entityName, token, serviceToken } = getBase44Config();

  const base44 = createClient({
    appId,
    ...(token ? { token } : {}),
    ...(serviceToken ? { serviceToken } : {}),
  });

  const record = {
    first_name: payload.firstName,
    last_name: payload.lastName,
    phone: payload.phone,
    email: payload.email,
    service: payload.service,
    details: payload.details,
    city: payload.city,
    domain: payload.domain,
    source: "website",
    status: "new",
  };

  const entities = serviceToken
    ? base44.asServiceRole.entities
    : base44.entities;

  // Entity name is dynamic (Quote, Lead, ContactSubmission, etc.)
  const entity = (entities as Record<string, { create: (data: typeof record) => Promise<unknown> }>)[
    entityName
  ];
  if (!entity?.create) {
    throw new Error(`Base44 entity "${entityName}" is not available`);
  }

  return entity.create(record);
}
