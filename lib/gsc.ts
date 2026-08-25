import crypto from "crypto";

/**
 * Google Search Console reader. Authenticates with a service account (JSON key
 * in GOOGLE_SERVICE_ACCOUNT_JSON) and pulls each site's search performance
 * (clicks, impressions, average position, top keywords) for the rankings admin.
 * Read-only (webmasters.readonly scope).
 */
type ServiceKey = { client_email: string; private_key: string; token_uri: string };

export function isGscConfigured(): boolean {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
}

function loadKey(): ServiceKey | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const k = JSON.parse(raw) as ServiceKey;
    if (!k.client_email || !k.private_key) return null;
    return { ...k, token_uri: k.token_uri || "https://oauth2.googleapis.com/token" };
  } catch {
    return null;
  }
}

let cachedToken: { token: string; exp: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.token;
  const key = loadKey();
  if (!key) return null;
  const b64url = (s: string) => Buffer.from(s).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: key.token_uri,
      iat: now,
      exp: now + 3600,
    }),
  );
  const signingInput = `${header}.${claim}`;
  try {
    const sig = crypto.sign("RSA-SHA256", Buffer.from(signingInput), key.private_key).toString("base64url");
    const res = await fetch(key.token_uri, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: `${signingInput}.${sig}`,
      }),
    });
    if (!res.ok) {
      console.error("GSC token error:", res.status);
      return null;
    }
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;
    cachedToken = { token: data.access_token, exp: Date.now() + (data.expires_in ?? 3600) * 1000 };
    return data.access_token;
  } catch (err) {
    console.error("GSC token exception:", err);
    return null;
  }
}

type Row = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number };

async function query(domain: string, token: string, body: object): Promise<Row[]> {
  const site = `sc-domain:${domain}`;
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { rows?: Row[] };
    return data.rows ?? [];
  } catch {
    return [];
  }
}

export type SiteRanking = {
  domain: string;
  clicks: number;
  impressions: number;
  position: number | null;
  topQueries: { query: string; position: number; clicks: number; impressions: number }[];
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Pull the last 28 days of Search Console performance for every given domain. */
export async function fetchAllRankings(domains: string[]): Promise<SiteRanking[] | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 28);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const startDate = fmt(start);
  const endDate = fmt(end);

  return Promise.all(
    domains.map(async (domain): Promise<SiteRanking> => {
      const [totals, queries] = await Promise.all([
        query(domain, token, { startDate, endDate }),
        query(domain, token, { startDate, endDate, dimensions: ["query"], rowLimit: 10 }),
      ]);
      const t = totals[0];
      return {
        domain,
        clicks: t?.clicks ?? 0,
        impressions: t?.impressions ?? 0,
        position: t ? round1(t.position) : null,
        topQueries: queries.map((r) => ({
          query: r.keys?.[0] ?? "",
          position: round1(r.position),
          clicks: r.clicks,
          impressions: r.impressions,
        })),
      };
    }),
  );
}
