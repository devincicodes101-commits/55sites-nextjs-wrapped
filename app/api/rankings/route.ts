import { NextResponse } from "next/server";
import { fetchAllRankings, isGscConfigured } from "@/lib/gsc";
import registry from "@/lib/sites/registry";

export const runtime = "nodejs";
export const maxDuration = 60;

// Returns last-28-days Google Search Console performance for every registered
// site. Powers the /rankings admin dashboard.
export async function GET() {
  if (!isGscConfigured()) {
    return NextResponse.json(
      { error: "Rankings not configured (GOOGLE_SERVICE_ACCOUNT_JSON missing)" },
      { status: 500 },
    );
  }

  const domains = Object.keys(registry);
  const rankings = await fetchAllRankings(domains);
  if (!rankings) {
    return NextResponse.json({ error: "Could not authenticate to Google Search Console" }, { status: 500 });
  }

  // Attach the friendly city name for display.
  const sites = rankings
    .map((r) => ({ ...r, city: registry[r.domain]?.city ?? r.domain }))
    .sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks);

  return NextResponse.json({ ok: true, updated: new Date().toISOString(), sites });
}
