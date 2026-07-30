import { NextResponse } from "next/server";
import {
  buildLeadDetailsFromQuote,
  createQuoteInBase44,
  isBase44Configured,
  splitPersonName,
} from "@/lib/base44";
import { loadCatalogServices } from "@/lib/catalog-pricing";
import { extractEmailIntent, isEmailAgentConfigured } from "@/lib/email-agent";
import { assessEnquiry } from "@/lib/enquiry-quote";

export const runtime = "nodejs";
export const maxDuration = 60;

function money(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

function makeQuoteRef(city: string) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const code = (city || "UK").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "UK";
  return `Q-${code}-${stamp}-${rand}`;
}

/**
 * Task C — email inquiry agent (brain endpoint, called by n8n).
 *
 * n8n owns the email I/O (IMAP in, SMTP reply out). This endpoint owns the
 * intelligence: read the thread, decide, draft the reply, and (when complete)
 * generate the quote + save the CRM lead. It returns everything n8n needs to send.
 *
 * Request JSON:
 *   { fromEmail, fromName?, subject?, threadText, businessName?, city?, phoneDisplay? }
 * Response JSON:
 *   { action: "ask"|"quote"|"handoff", replyText, replySubject,
 *     isComplete, notifyRep, notifyText?, quoteRef?, totalGbp? }
 */
export async function POST(request: Request) {
  if (!isEmailAgentConfigured()) {
    return NextResponse.json({ error: "Email agent not configured (OPENAI_API_KEY)" }, { status: 500 });
  }
  if (!isBase44Configured()) {
    return NextResponse.json({ error: "CRM not configured (BASE44_APP_ID)" }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const fromEmail = String(body.fromEmail || "").trim();
  const fromName = String(body.fromName || "").trim();
  const subject = String(body.subject || "").trim();
  const threadText = String(body.threadText || "").trim();
  const businessName = String(body.businessName || "").trim() || "Asbestos Teams";
  const city = String(body.city || "").trim();
  const phoneDisplay = String(body.phoneDisplay || "").trim();

  if (!fromEmail || !fromEmail.includes("@")) {
    return NextResponse.json({ error: "A valid fromEmail is required" }, { status: 400 });
  }
  if (!threadText) {
    return NextResponse.json({ error: "threadText is required" }, { status: 400 });
  }

  const replySubject = subject.toLowerCase().startsWith("re:") ? subject : `Re: ${subject || "Your asbestos enquiry"}`;
  const callLine = phoneDisplay ? ` or call us on ${phoneDisplay}` : "";

  try {
    const catalog = await loadCatalogServices();
    const intent = await extractEmailIntent({ threadText, catalog });

    // Resolve a display name + names for the CRM.
    const displayName = intent?.customer_name || fromName || "there";
    const { firstName, lastName } = splitPersonName(intent?.customer_name || fromName || fromEmail.split("@")[0]);
    const phone = intent?.customer_phone || "";

    // Helper: save a lead, never let a CRM failure block the reply.
    async function saveLead(status: string, details: string, extra?: Record<string, unknown>) {
      try {
        await createQuoteInBase44({
          firstName,
          lastName,
          phone,
          email: fromEmail,
          service: intent?.identified_service && intent.identified_service !== "unknown" && intent.identified_service !== "ambiguous"
            ? intent.identified_service
            : "Email enquiry",
          details,
          city,
          domain: "",
          lead_source: "email_agent",
          status,
          ...extra,
        });
      } catch (err) {
        console.error("email-agent CRM save failed (continuing):", err);
      }
    }

    // 1) Couldn't parse, or clearly not a catalog service -> human handoff.
    if (!intent || intent.identified_service === "unknown") {
      await saveLead("new", `Email enquiry needing review.${intent?.summary ? ` Summary: ${intent.summary}` : ""}`);
      return NextResponse.json({
        action: "handoff",
        replySubject,
        replyText: `Hi ${displayName},\n\nThanks for your enquiry. One of our asbestos specialists will review the details and be in touch shortly to help you further${callLine}.\n\nKind regards,\n${businessName}`,
        isComplete: false,
        notifyRep: true,
        notifyText: `Email lead needs review — ${fromEmail}. ${intent?.summary || "(could not auto-identify service)"}`,
      });
    }

    // 2) Ambiguous -> ask the one clarifying question.
    if (intent.identified_service === "ambiguous") {
      const q = intent.clarification_question || "Could you tell us a little more about the job so we can price it accurately?";
      await saveLead("awaiting_info", `Awaiting clarification: ${q} Summary: ${intent.summary}`);
      return NextResponse.json({
        action: "ask",
        replySubject,
        replyText: `Hi ${displayName},\n\nThanks for getting in touch about your asbestos enquiry. To prepare an accurate fixed-price quote, could you let me know:\n\n- ${q}\n\nJust reply to this email and I'll send your quote straight over${callLine}.\n\nKind regards,\n${businessName}`,
        isComplete: false,
        notifyRep: false,
      });
    }

    // 3) Identified a catalog service -> assess whether we have the quantity to price it.
    const assessment = assessEnquiry({
      service: intent.identified_service,
      fields: {
        area_sqm: intent.area_sqm,
        length_lm: intent.length_lm,
        quantity: intent.quantity,
      },
      catalog,
    });

    if (assessment.status === "info_required") {
      const asks = assessment.missing.map((m) => `- ${m}`).join("\n");
      await saveLead("awaiting_info", `Awaiting: ${assessment.missing.join("; ")}. Service: ${intent.identified_service}.`);
      return NextResponse.json({
        action: "ask",
        replySubject,
        replyText: `Hi ${displayName},\n\nThanks for the details about your ${intent.summary || "asbestos job"}. To finish your fixed-price quote, could you let me know:\n\n${asks}\n\nReply to this email with that and I'll send the quote straight over${callLine}.\n\nKind regards,\n${businessName}`,
        isComplete: false,
        notifyRep: false,
      });
    }

    if (assessment.status === "unquotable") {
      await saveLead("new", `Email enquiry (not auto-priceable): ${intent.summary}`);
      return NextResponse.json({
        action: "handoff",
        replySubject,
        replyText: `Hi ${displayName},\n\nThanks for your enquiry. A member of our team will be in touch shortly to help with this${callLine}.\n\nKind regards,\n${businessName}`,
        isComplete: false,
        notifyRep: true,
        notifyText: `Email lead needs review — ${fromEmail}. ${intent.summary}`,
      });
    }

    // 4) Complete -> quote, save, and reply with it.
    const quote = assessment.quote;
    const quoteRef = makeQuoteRef(city);
    const line = quote.line_items[0];
    const lineText = line ? `${line.description} — ${line.quantity} ${line.unit} — ${money(line.total_gbp)}` : "";

    await saveLead("quoted", buildLeadDetailsFromQuote(quote, intent.summary), {
      quote_ref: quoteRef,
      quote_total_gbp: quote.total_gbp,
      quote_json: JSON.stringify(quote),
      survey_summary: quote.survey_summary,
      quote_emailed: true,
    });

    return NextResponse.json({
      action: "quote",
      replySubject,
      replyText: `Hi ${displayName},\n\nThank you — here is your fixed-price quotation (ref ${quoteRef}):\n\n${lineText}\nSubtotal ${money(quote.subtotal_gbp)} · VAT ${money(quote.vat_gbp)} · Total (inc. VAT) ${money(quote.total_gbp)}\n\nThis quote is valid for ${quote.validity_days} days and is based on the information you've provided; a site visit may refine it. To go ahead or arrange a visit, just reply${callLine}.\n\nKind regards,\n${businessName}`,
      isComplete: true,
      notifyRep: true,
      notifyText: `Qualified & quoted — ${displayName} (${fromEmail}). ${intent.identified_service}: ${money(quote.total_gbp)} inc. VAT (ref ${quoteRef}).`,
      quoteRef,
      totalGbp: quote.total_gbp,
    });
  } catch (err) {
    console.error("email-agent failed", err);
    const message = err instanceof Error ? err.message : "Email agent failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
