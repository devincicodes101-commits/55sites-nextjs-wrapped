import { NextResponse } from "next/server";
import { createQuoteInBase44, buildLeadDetailsFromQuote, isBase44Configured } from "@/lib/base44";
import { catalogToPricingHints, loadCatalogServices } from "@/lib/catalog-pricing";
import { generateQuoteFromSurvey, isGeminiConfigured } from "@/lib/gemini-quote";
import { isSurveyQuotePilotEnabled } from "@/lib/pilot";
import { createAndSendCrmQuote, isCrmConfigured } from "@/lib/crm";
import { isEmailConfigured, sendQuoteEmail } from "@/lib/send-quote-email";
import { getSiteConfig } from "@/lib/sites/registry";

export const runtime = "nodejs";
// Large, photo-heavy surveys (60-90+ pages) need longer to OCR/extract.
export const maxDuration = 300;

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// NOTE: Vercel serverless functions cap the *request body* at ~4.5MB, so a direct
// upload larger than that is rejected by the platform (413) before this runs. This
// app-level cap is the secondary ceiling; genuinely huge surveys need a direct-to-
// storage upload flow (see follow-up) rather than posting the file inline.
const MAX_BYTES = 50 * 1024 * 1024; // 50MB (large surveys read via Gemini File API)

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

  // Two upload paths:
  //  - JSON with `surveyUrl`: the browser already uploaded the file straight to
  //    Vercel Blob (bypasses the ~4.5MB request-body limit) — we fetch it here.
  //  - multipart form-data: the file is posted inline (small files only).
  let firstName: string;
  let lastName: string;
  let phone: string;
  let email: string;
  let service: string;
  let details: string;
  let buffer: Buffer;
  let fileType: string;
  let fileName: string;

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    firstName = String(body.firstName || "").trim();
    lastName = String(body.lastName || "").trim();
    phone = String(body.phone || "").trim();
    email = String(body.email || "").trim();
    service = String(body.service || "").trim();
    details = String(body.details || "").trim();
    const surveyUrl = String(body.surveyUrl || "").trim();
    fileName = String(body.fileName || "survey").trim();

    // Only allow fetching from our own Blob store, never arbitrary URLs.
    if (!/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(surveyUrl)) {
      return NextResponse.json({ error: "Invalid survey upload reference" }, { status: 400 });
    }
    const fileRes = await fetch(surveyUrl);
    if (!fileRes.ok) {
      return NextResponse.json({ error: "Could not read the uploaded survey" }, { status: 400 });
    }
    fileType = fileRes.headers.get("content-type")?.split(";")[0] || "application/pdf";
    buffer = Buffer.from(await fileRes.arrayBuffer());
  } else {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
    }
    firstName = String(form.get("firstName") || "").trim();
    lastName = String(form.get("lastName") || "").trim();
    phone = String(form.get("phone") || "").trim();
    email = String(form.get("email") || "").trim();
    service = String(form.get("service") || "").trim();
    details = String(form.get("details") || "").trim();
    const file = form.get("surveyReport");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please upload a survey report (PDF or image)" }, { status: 400 });
    }
    fileType = file.type;
    fileName = file.name;
    buffer = Buffer.from(await file.arrayBuffer());
  }

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
  if (!ALLOWED_MIME.has(fileType)) {
    return NextResponse.json(
      { error: "Unsupported file type. Upload a PDF or image (JPG, PNG, WEBP)." },
      { status: 400 },
    );
  }
  if (buffer.length <= 0 || buffer.length > MAX_BYTES) {
    return NextResponse.json(
      { error: "Survey file must be between 1 byte and 50MB" },
      { status: 400 },
    );
  }
  const quoteRef = makeQuoteRef(site.city);
  const customerName = `${firstName} ${lastName}`.trim();

  try {
    const catalog = await loadCatalogServices();
    const quote = await generateQuoteFromSurvey({
      fileBuffer: buffer,
      mimeType: fileType,
      fileName,
      customerName,
      city: site.city,
      region: site.region,
      businessName: site.businessName,
      pricingHints: catalogToPricingHints(catalog),
      catalog,
    });

    // Send the quote via the CRM (branded quote + Accept button + choose-date/
    // diary + stored in Quotes, like a real rep); fall back to our own email.
    let emailSent = false;
    let emailWarning: string | undefined;
    if (isCrmConfigured()) {
      const r = await createAndSendCrmQuote({
        customerName,
        customerEmail: email,
        customerAddress: quote.property_address || undefined,
        customerPhone: phone,
        serviceInterest: service,
        quote,
        salesAgentName: "AI Survey Assistant",
      });
      emailSent = r.sent;
    } else {
      const emailResult = await sendQuoteEmail({
        to: email,
        customerName,
        businessName: site.businessName,
        city: site.city,
        phoneDisplay: site.phoneDisplay,
        quote,
        quoteRef,
        catalog,
      });
      emailSent = emailResult.sent;
      emailWarning = emailResult.sent ? undefined : emailResult.error;
    }

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
      survey_file_name: fileName,
      quote_emailed: emailSent,
      lead_source: "survey_quote_pilot",
      status: "quoted",
    });

    return NextResponse.json({
      ok: true,
      quoteRef,
      totalGbp: quote.total_gbp,
      emailSent,
      emailWarning,
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
