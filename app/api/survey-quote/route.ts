import { NextResponse } from "next/server";
import { createQuoteInBase44, buildLeadDetailsFromQuote, isBase44Configured } from "@/lib/base44";
import { catalogToPricingHints, loadCatalogServices } from "@/lib/catalog-pricing";
import { generateQuoteFromSurvey, isGeminiConfigured } from "@/lib/gemini-quote";
import { isSurveyQuotePilotEnabled } from "@/lib/pilot";
import { isEmailConfigured, sendQuoteEmail } from "@/lib/send-quote-email";
import { getSiteConfig } from "@/lib/sites/registry";

export const runtime = "nodejs";
export const maxDuration = 120;

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 12 * 1024 * 1024; // 12MB

function makeQuoteRef(city: string) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const code = city.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "UK";
  return `Q-${code}-${stamp}-${rand}`;
}

export async function POST(request: Request) {
  const site = getSiteConfig();

  if (!isSurveyQuotePilotEnabled(site.city)) {
    return NextResponse.json({ error: "Survey quote pilot is not enabled for this site" }, { status: 403 });
  }

  if (!isGeminiConfigured()) {
    return NextResponse.json({ error: "Gemini is not configured (GEMINI_API_KEY)" }, { status: 500 });
  }

  if (!isBase44Configured()) {
    return NextResponse.json({ error: "CRM is not configured (BASE44_APP_ID)" }, { status: 500 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const firstName = String(form.get("firstName") || "").trim();
  const lastName = String(form.get("lastName") || "").trim();
  const phone = String(form.get("phone") || "").trim();
  const email = String(form.get("email") || "").trim();
  const service = String(form.get("service") || "").trim();
  const details = String(form.get("details") || "").trim();
  const file = form.get("surveyReport");

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "First and last name are required" }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: "Phone is required" }, { status: 400 });
  }
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required to receive your quote" }, { status: 400 });
  }
  if (!service) {
    return NextResponse.json({ error: "Service is required" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Please upload a survey report (PDF or image)" }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Upload a PDF or image (JPG, PNG, WEBP)." },
      { status: 400 },
    );
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Survey file must be between 1 byte and 12MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const quoteRef = makeQuoteRef(site.city);
  const customerName = `${firstName} ${lastName}`.trim();

  try {
    const catalog = await loadCatalogServices();
    const quote = await generateQuoteFromSurvey({
      fileBuffer: buffer,
      mimeType: file.type,
      fileName: file.name,
      customerName,
      city: site.city,
      region: site.region,
      businessName: site.businessName,
      pricingHints: catalogToPricingHints(catalog),
      catalog,
    });

    const emailResult = await sendQuoteEmail({
      to: email,
      customerName,
      businessName: site.businessName,
      city: site.city,
      phoneDisplay: site.phoneDisplay,
      quote,
      quoteRef,
    });

    await createQuoteInBase44({
      firstName,
      lastName,
      phone,
      email,
      service,
      details: buildLeadDetailsFromQuote(quote, details || undefined),
      city: site.city,
      domain: site.domain,
      quote_ref: quoteRef,
      quote_total_gbp: quote.total_gbp,
      quote_json: JSON.stringify(quote),
      survey_summary: quote.survey_summary,
      survey_file_name: file.name,
      quote_emailed: emailResult.sent,
      lead_source: "survey_quote_pilot",
      status: "quoted",
    });

    return NextResponse.json({
      ok: true,
      quoteRef,
      totalGbp: quote.total_gbp,
      emailSent: emailResult.sent,
      emailWarning: emailResult.sent ? undefined : emailResult.error,
      quote: {
        survey_summary: quote.survey_summary,
        property_address: quote.property_address,
        line_items: quote.line_items,
        subtotal_gbp: quote.subtotal_gbp,
        vat_gbp: quote.vat_gbp,
        total_gbp: quote.total_gbp,
        validity_days: quote.validity_days,
        assumptions: quote.assumptions,
        exclusions: quote.exclusions,
      },
      emailConfigured: isEmailConfigured(),
    });
  } catch (err) {
    console.error("Survey quote pipeline failed", err);
    const message = err instanceof Error ? err.message : "Quote generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
