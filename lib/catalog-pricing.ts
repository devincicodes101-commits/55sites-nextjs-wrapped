/**
 * Operational price book from Asbestos UK Teams Base44 Service Catalog
 * (app 6a27307f924688c6c670d92b). Used for AI quote generation and site pricing.
 *
 * Live refresh: set BASE44_CATALOG_APP_ID (and optional token) to pull Service
 * entities at quote time; falls back to this snapshot if fetch fails.
 */

export type CatalogUnitType = "fixed" | "per_sqm" | "per_unit" | string;

export type CatalogService = {
  name: string;
  description: string;
  category: string;
  unit_price: number;
  unit_type: CatalogUnitType;
  estimated_duration: string | null;
  is_active: boolean;
};

export type PricingHint = {
  label: string;
  price: string;
  note: string;
  unit_type: string;
  unit_price_gbp: number;
};

/** Snapshot of the Base44 Service Catalog (12 active services). */
export const CATALOG_PRICING: CatalogService[] = [
  {
    name: "Aib Soffits/Canopy Area ( Licensed) Price Per Linear M2",
    description:
      "Full removal and disposal of soffit boards from the property; scaffolding to be provided by the client or contractor on site. Price includes HSE notification, 2 men / 2 days labour, E11 environmental clean certification and waste disposal certification on completion. Priced per linear metre.",
    category: "general",
    unit_price: 145,
    unit_type: "per_unit",
    estimated_duration: null,
    is_active: true,
  },
  {
    name: "Asbestos Loft Insulation Removal Vermiculite",
    description:
      "Asbestos loft insulation removal per m². Includes full removal, disposal and waste consignment note; loft covered with 1200 gauge polymer plastic to contain dust. Replacement insulation available at £45 per linear measure.",
    category: "general",
    unit_price: 55,
    unit_type: "per_sqm",
    estimated_duration: "1",
    is_active: true,
  },
  {
    name: "Asbestos Water Tank Removal",
    description:
      "Safe removal & disposal of an existing asbestos water tank (approx. max 600 × 600). Includes legal waste note certificate. Typically 2-man / 2-hour job.",
    category: "general",
    unit_price: 650,
    unit_type: "fixed",
    estimated_duration: null,
    is_active: true,
  },
  {
    name: "Asbestos Boiler Removal",
    description:
      "Asbestos-lined / encased boiler removal. Includes full removal, disposal and waste consignment note; room covered with 1200 gauge polymer plastic. Typically half day.",
    category: "general",
    unit_price: 450,
    unit_type: "fixed",
    estimated_duration: "Half Day",
    is_active: true,
  },
  {
    name: "Asbestos Corrugated Sheet Collection",
    description:
      "Collection and disposal of corrugated asbestos sheets with waste consignment note. £30 per sheet; minimum call-out £350 (10 sheets). Quantities over 100 sheets negotiable.",
    category: "general",
    unit_price: 30,
    unit_type: "per_unit",
    estimated_duration: null,
    is_active: true,
  },
  {
    name: "Asbestos Waste Collection 25 KG Bags",
    description:
      "Collection and disposal of asbestos waste in 25 kg bags, including legal waste note certificate. 2-man collection. £30 per bag.",
    category: "general",
    unit_price: 30,
    unit_type: "per_unit",
    estimated_duration: null,
    is_active: true,
  },
  {
    name: "Double Garage Roof Removal",
    description:
      "Full removal and disposal of an existing asbestos double garage roof. Includes legal waste certificate (issued 1 day after completion) and full environmental clean. Typically half day.",
    category: "general",
    unit_price: 750,
    unit_type: "fixed",
    estimated_duration: "Half Day",
    is_active: true,
  },
  {
    name: "Asbestos Single Roof Removal",
    description:
      "Full removal and disposal of an existing asbestos single garage roof. Includes legal waste certificate (issued 1 day after completion) and full environmental clean. Typically half day.",
    category: "asbestos",
    unit_price: 550,
    unit_type: "fixed",
    estimated_duration: "Half Day",
    is_active: true,
  },
  {
    name: "Asbestos Artex Removal",
    description:
      "Full removal and disposal of asbestos Artex / textured coatings. Includes waste certificate on completion. Priced per m².",
    category: "asbestos",
    unit_price: 45,
    unit_type: "per_sqm",
    estimated_duration: "1",
    is_active: true,
  },
  {
    name: "Asbestos Floor Tile Removal",
    description:
      "Full removal and disposal of asbestos floor tiles. Excludes bitumen / resin adhesive removal. Includes waste consignment note and full environmental clean. Priced per m².",
    category: "asbestos",
    unit_price: 45,
    unit_type: "per_sqm",
    estimated_duration: "1",
    is_active: true,
  },
  {
    name: "Corrugated Steel Roof Replacement",
    description:
      "Full removal and disposal of single garage asbestos roof, replaced with 9mm boxed-profile steel sheets in Merlin Grey.",
    category: "roofing",
    unit_price: 1850,
    unit_type: "fixed",
    estimated_duration: "1",
    is_active: true,
  },
  {
    name: "Full Roof Replacement",
    description:
      "Complete removal and replacement of existing roof including felt, battens and tiles. Includes waste disposal and a 10-year guarantee. Typically 5–7 days.",
    category: "roofing",
    unit_price: 8500,
    unit_type: "fixed",
    estimated_duration: "5-7 days",
    is_active: true,
  },
];

export function formatCatalogUnit(unitType: CatalogUnitType): string {
  switch (unitType) {
    case "per_sqm":
      return "per m²";
    case "per_unit":
      return "per unit";
    case "fixed":
      return "fixed";
    default:
      return String(unitType).replace(/_/g, " ");
  }
}

function shortNote(description: string, max = 160): string {
  const cleaned = description
    .replace(/IMPORTANT NOTE:[\s\S]*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trim()}…`;
}

export function catalogToPricingHints(services: CatalogService[] = CATALOG_PRICING): PricingHint[] {
  return services
    .filter((s) => s.is_active !== false)
    .map((s) => {
      const unit = formatCatalogUnit(s.unit_type);
      const price =
        s.unit_type === "fixed"
          ? `£${s.unit_price} fixed`
          : `£${s.unit_price} ${unit}`;
      return {
        label: s.name,
        price,
        note: shortNote(s.description),
        unit_type: s.unit_type,
        unit_price_gbp: s.unit_price,
      };
    });
}

/** Compact price cards for website Transparent Pricing pages. */
export function catalogToPriceItems(services: CatalogService[] = CATALOG_PRICING) {
  const featured = new Set([
    "Asbestos Single Roof Removal",
    "Asbestos Artex Removal",
    "Double Garage Roof Removal",
    "Asbestos Floor Tile Removal",
  ]);

  return services
    .filter((s) => s.is_active !== false)
    .map((s) => ({
      label: s.name.replace(/\s+/g, " ").trim(),
      price: `£${s.unit_price}`,
      unit:
        s.unit_type === "fixed"
          ? "fixed"
          : s.unit_type === "per_sqm"
            ? "from /m²"
            : "from / unit",
      note: shortNote(s.description, 90),
      featured: featured.has(s.name),
    }));
}

export function normalizeCatalogKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Match a Gemini-selected catalog name to a Service row (exact, then fuzzy). */
export function findCatalogService(
  catalogName: string | null | undefined,
  services: CatalogService[] = CATALOG_PRICING,
): CatalogService | null {
  if (!catalogName || catalogName.toUpperCase() === "OTHER") return null;
  const needle = normalizeCatalogKey(catalogName);
  if (!needle) return null;

  const active = services.filter((s) => s.is_active !== false);
  const exact = active.find((s) => normalizeCatalogKey(s.name) === needle);
  if (exact) return exact;

  const partial = active.find(
    (s) =>
      needle.includes(normalizeCatalogKey(s.name)) ||
      normalizeCatalogKey(s.name).includes(needle),
  );
  return partial ?? null;
}

export type CatalogScopeLine = {
  catalog_name: string;
  description: string;
  quantity: number;
  unit: string;
};

export type PricedLineItem = {
  catalog_name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price_gbp: number;
  total_gbp: number;
};

/** A scope line we could not match to a Service Catalog entry (so cannot auto-price). */
export type UnmatchedScopeLine = {
  description: string;
  quantity: number;
  unit: string;
};

/**
 * Apply Base44 Service Catalog unit prices as the single source of truth.
 * Gemini may only supply catalog_name + quantity; rates come from the catalog.
 */
export function applyCatalogRates(
  lines: CatalogScopeLine[],
  services: CatalogService[] = CATALOG_PRICING,
): { line_items: PricedLineItem[]; unmatched: UnmatchedScopeLine[]; assumptions: string[] } {
  const line_items: PricedLineItem[] = [];
  const unmatched: UnmatchedScopeLine[] = [];
  const assumptions: string[] = [];

  for (const line of lines) {
    const qty = Number(line.quantity);
    if (!Number.isFinite(qty) || qty <= 0) continue;

    const service = findCatalogService(line.catalog_name, services);
    if (!service) {
      unmatched.push({
        description: line.description || line.catalog_name || "Unknown work",
        quantity: round2(qty),
        unit: line.unit || "unit",
      });
      continue;
    }

    let quantity = qty;
    let unitPrice = service.unit_price;
    let total = round2(quantity * unitPrice);
    let unit = formatDisplayUnit(service.unit_type, line.unit);

    // Catalog rule: corrugated sheet collection has £350 minimum call-out (10 sheets).
    if (normalizeCatalogKey(service.name).includes("corrugated sheet collection")) {
      const minSheets = 10;
      const minCallOut = 350;
      if (quantity < minSheets || total < minCallOut) {
        quantity = minSheets;
        total = minCallOut;
        unitPrice = round2(total / quantity);
        assumptions.push(
          `Corrugated sheet collection: minimum call-out £${minCallOut} (${minSheets} sheets) applied from Service Catalog.`,
        );
      }
    }

    if (service.unit_type === "fixed") {
      // Fixed catalog jobs are priced per occurrence; keep quantity as count of jobs.
      unit = "job";
      total = round2(quantity * service.unit_price);
      unitPrice = service.unit_price;
    }

    line_items.push({
      catalog_name: service.name,
      description: line.description?.trim() || service.name,
      quantity: round2(quantity),
      unit,
      unit_price_gbp: unitPrice,
      total_gbp: total,
    });
  }

  return { line_items, unmatched, assumptions };
}

export function totalsFromLineItems(line_items: { total_gbp: number }[], vatRate = 0.2) {
  const subtotal_gbp = round2(line_items.reduce((sum, li) => sum + li.total_gbp, 0));
  const vat_gbp = round2(subtotal_gbp * vatRate);
  const total_gbp = round2(subtotal_gbp + vat_gbp);
  return { subtotal_gbp, vat_gbp, total_gbp };
}

function formatDisplayUnit(unitType: CatalogUnitType, fallback: string): string {
  switch (unitType) {
    case "per_sqm":
      return "m²";
    case "per_unit":
      return "unit";
    case "fixed":
      return "job";
    default:
      return fallback || String(unitType);
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Prefer live Base44 Service catalog; fall back to the static snapshot.
 */
export async function loadCatalogServices(): Promise<CatalogService[]> {
  const appId = process.env.BASE44_CATALOG_APP_ID?.trim();
  if (!appId) return CATALOG_PRICING;

  try {
    const { createClient } = await import("@base44/sdk");
    const token = process.env.BASE44_API_TOKEN;
    const serviceToken = process.env.BASE44_SERVICE_TOKEN;
    const base44 = createClient({
      appId,
      ...(token ? { token } : {}),
      ...(serviceToken ? { serviceToken } : {}),
    });

    const entities = serviceToken ? base44.asServiceRole.entities : base44.entities;
    const rows = (await entities.Service.list("-updated_date", 100)) as Array<Record<string, unknown>>;
    const mapped: CatalogService[] = rows
      .filter((r) => r.is_active !== false)
      .map((r) => ({
        name: String(r.name ?? ""),
        description: String(r.description ?? ""),
        category: String(r.category ?? "general"),
        unit_price: Number(r.unit_price ?? 0),
        unit_type: String(r.unit_type ?? "fixed"),
        estimated_duration: r.estimated_duration != null ? String(r.estimated_duration) : null,
        is_active: r.is_active !== false,
      }))
      .filter((s) => s.name && s.unit_price > 0);

    return mapped.length > 0 ? mapped : CATALOG_PRICING;
  } catch {
    return CATALOG_PRICING;
  }
}
