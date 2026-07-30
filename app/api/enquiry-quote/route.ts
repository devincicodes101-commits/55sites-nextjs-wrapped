import { NextResponse } from "next/server";
import {
  buildLeadDetailsFromQuote,
  createQuoteInBase44,
  isBase44Configured,
} from "@/lib/base44";
import { loadCatalogServices } from "@/lib/catalog-pricing";
import { assessEnquiry, type EnquiryFields } from "@/lib/enquiry-quote";
import { isSurveyQuotePilotEnabled } from "@/lib/pilot";
import {
  isEmailConfigured,
  sendMissingInfoEmail,
  sendQuoteEmail,
} from "@/lib/send-quote-email";
import { getSiteConfig } from "@/lib/sites/registry";

export const runtime = "nodejs";
export const maxDuration = 60;

function makeQuoteRef(city: string) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const code = city.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "UK";
  return `Q-${code}-${stamp}-${rand}`;
}

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Enquiry → instant quote (no survey document).
 *  - complete info      -> generate quote + email it + CRM lead ("quoted")
 *  - missing info        -> email the customer what's needed + hold lead ("awaiting_info")
 *  - non-priceable svc   -> normal lead for the team ("new")
 */
export async function POST(request: Request) {
  const site = getSiteConfig();

  if (!isSurveyQuotePilotEnabled(site.city)) {
    return NextResponse.json(
      { error: "Instant quote is not enabled for this site" },
      { status: 403 },
    );
  }
  if (!isBase44Configured()) {
    return NextResponse.json(
      { error: "CRM is not configured (BASE44_APP_ID)" },
      { status: 500 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "").trim();
  const service = String(body.service || "").trim();
  const details = String(body.details || "").trim();

  if (!firstName) return NextResponse.json({ error: "First name is required" }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "Phone is required" }, { status: 400 });
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required to receive your quote" }, { status: 400 });
  }
  if (!service) return NextResponse.json({ error: "Service is required" }, { status: 400 });

  const fields: EnquiryFields = {
    area_sqm: num(body.area_sqm),
    length_lm: num(body.length_lm),
    quantity: num(body.quantity),
    hours: num(body.hours),
    days: num(body.days),
  };

  const customerName = `${firstName} ${lastName}`.trim();

  try {
    const catalog = await loadCatalogServices();
    const assessment = assessEnquiry({ service, fields, catalog });

    // 1) Missing info -> ask the customer, hold the lead, do not quote yet.
    if (assessment.status === "info_required") {
      const emailResult = await sendMissingInfoEmail({
        to: email,
        customerName,
        businessName: site.businessName,
        city: site.city,
        phoneDisplay: site.phoneDisplay,
        service,
        missing: assessment.missing,
      });
      await createQuoteInBase44({
        firstName,
        lastName,
        phone,
        email,
        service,
        details: `Enquiry pending info. Still needed: ${assessment.missing.join("; ")}.${details ? ` Customer note: ${details}` : ""}`,
        city: site.city,
        domain: site.domain,
        lead_source: "enquiry_quote",
        status: "awaiting_info",
      });
      return NextResponse.json({
        status: "info_required",
        missing: assessment.missing,
        emailSent: emailResult.sent,
        emailConfigured: isEmailConfigured(),
      });
    }

    // 2) Service not in the catalog -> normal lead for the team to handle.
    if (assessment.status === "unquotable") {
      await createQuoteInBase44({
        firstName,
        lastName,
        phone,
        email,
        service,
        details: details || assessment.reason,
        city: site.city,
        domain: site.domain,
        lead_source: "enquiry_quote",
        status: "new",
      });
      return NextResponse.json({ status: "received", reason: assessment.reason });
    }

    // 3) Complete -> generate quote, email it, save lead with the quote attached.
    const { quote } = assessment;
    const quoteRef = makeQuoteRef(site.city);
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
      quote_emailed: emailResult.sent,
      lead_source: "enquiry_quote",
      status: "quoted",
    });

    return NextResponse.json({
      status: "quoted",
      quoteRef,
      totalGbp: quote.total_gbp,
      emailSent: emailResult.sent,
      emailWarning: emailResult.sent ? undefined : emailResult.error,
      quote: {
        survey_summary: quote.survey_summary,
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
    console.error("Enquiry quote pipeline failed", err);
    const message = err instanceof Error ? err.message : "Enquiry processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
