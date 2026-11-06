import { NextResponse } from "next/server";
import { loadCatalogWithSource } from "@/lib/catalog-pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Read-only: shows which catalog the agents are pricing from right now. */
export async function GET() {
  const { services, source, via, reason } = await loadCatalogWithSource();

  return NextResponse.json({
    source,
    via: via ?? null,
    reason: reason ?? null,
    count: services.length,
    services: services.map((s) => ({
      name: s.name,
      unit_type: s.unit_type,
      from_base44: source === "base44",
      minimum_charge: s.minimum_charge ?? null,
      voice_enabled: s.voice_enabled !== false,
      voice_summary: s.voice_summary ?? null,
    })),
  });
}
