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
import { resolveSiteByRecipient } from "@/lib/sites/registry";

export const runtime = "nodejs";
export const maxDuration = 60;

function money(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Build a plain-text + HTML reply from paragraphs (+ an optional bullet list after the first para). */
function renderReply(
  name: string,
  paras: string[],
  bullets: string[] | null,
  businessName: string,
): { text: string; html: string } {
  const textLines: string[] = [`Hi ${name},`, ""];
  paras.forEach((p, i) => {
    textLines.push(p);
    if (i === 0 && bullets && bullets.length) {
      textLines.push("");
      bullets.forEach((b) => textLines.push(`  - ${b}`));
    }
    textLines.push("");
  });
  textLines.push("Kind regards,", businessName);

  const htmlParts: string[] = [`<p>Hi ${escapeHtml(name)},</p>`];
  paras.forEach((p, i) => {
    htmlParts.push(`<p>${escapeHtml(p)}</p>`);
    if (i === 0 && bullets && bullets.length) {
      htmlParts.push(`<ul>${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`);
    }
  });
  htmlParts.push(`<p>Kind regards,<br>${escapeHtml(businessName)}</p>`);

  return {
    text: textLines.join("\n"),
    html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#222">${htmlParts.join("")}</div>`,
  };
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
 * n8n owns the email I/O (Gmail in, reply out). This endpoint owns the
 * intelligence: read the thread, decide, draft the reply (plain + HTML), and
 * (when complete) generate the quote + save the CRM lead.
 *
 * Response JSON:
 *   { action: "ask"|"quote"|"handoff", replySubject, replyText, replyHtml,
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
  const recipientEmail = String(body.recipientEmail || "").trim();

  // Resolve the brand from the recipient domain (e.g. info@bathasbestosabatement.co.uk
  // -> Bath), so one workflow signs correctly for all domains. Falls back to any
  // values passed in the body, then to a generic default.
  const site = resolveSiteByRecipient(recipientEmail);
  const businessName = site?.businessName || String(body.businessName || "").trim() || "Asbestos Teams";
  const phoneDisplay = site?.phoneDisplay || String(body.phoneDisplay || "").trim() || "";
  const city = site?.city || String(body.city || "").trim();

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

    const displayName = intent?.customer_name || fromName || "there";
    const { firstName, lastName } = splitPersonName(intent?.customer_name || fromName || fromEmail.split("@")[0]);
    const phone = intent?.customer_phone || "";

    async function saveLead(status: string, details: string, extra?: Record<string, unknown>) {
      try {
        await createQuoteInBase44({
          firstName,
          lastName,
          phone,
          email: fromEmail,
          service:
            intent?.identified_service &&
            intent.identified_service !== "unknown" &&
            intent.identified_service !== "ambiguous"
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
      const r = renderReply(
        displayName,
        [`Thanks for your enquiry. One of our asbestos specialists will review the details and be in touch shortly to help you further${callLine}.`],
        null,
        businessName,
      );
      await saveLead("new", `Email enquiry needing review.${intent?.summary ? ` Summary: ${intent.summary}` : ""}`);
      return NextResponse.json({
        action: "handoff",
        replySubject,
        replyText: r.text,
        replyHtml: r.html,
        isComplete: false,
        notifyRep: true,
        notifyText: `Email lead needs review — ${fromEmail}. ${intent?.summary || "(could not auto-identify service)"}`,
      });
    }

    // 2) Ambiguous -> ask the one clarifying question.
    if (intent.identified_service === "ambiguous") {
      const q = intent.clarification_question || "Could you tell us a little more about the job so we can price it accurately?";
      const r = renderReply(
        displayName,
        [
          "Thanks for getting in touch about your asbestos enquiry. To prepare an accurate fixed-price quote, could you let me know:",
          `Just reply to this email and I'll send your quote straight over${callLine}.`,
        ],
        [q],
        businessName,
      );
      await saveLead("awaiting_info", `Awaiting clarification: ${q} Summary: ${intent.summary}`);
      return NextResponse.json({
        action: "ask",
        replySubject,
        replyText: r.text,
        replyHtml: r.html,
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
      const r = renderReply(
        displayName,
        [
          `Thanks for the details about your ${intent.summary || "asbestos job"}. To finish your fixed-price quote, could you let me know:`,
          `Reply to this email with that and I'll send the quote straight over${callLine}.`,
        ],
        assessment.missing,
        businessName,
      );
      await saveLead("awaiting_info", `Awaiting: ${assessment.missing.join("; ")}. Service: ${intent.identified_service}.`);
      return NextResponse.json({
        action: "ask",
        replySubject,
        replyText: r.text,
        replyHtml: r.html,
        isComplete: false,
        notifyRep: false,
      });
    }

    if (assessment.status === "unquotable") {
      const r = renderReply(
        displayName,
        [`Thanks for your enquiry. A member of our team will be in touch shortly to help with this${callLine}.`],
        null,
        businessName,
      );
      await saveLead("new", `Email enquiry (not auto-priceable): ${intent.summary}`);
      return NextResponse.json({
        action: "handoff",
        replySubject,
        replyText: r.text,
        replyHtml: r.html,
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

    const replyText = [
      `Hi ${displayName},`,
      "",
      `Thank you — here is your fixed-price quotation (ref ${quoteRef}):`,
      "",
      lineText,
      `Subtotal ${money(quote.subtotal_gbp)} · VAT ${money(quote.vat_gbp)} · Total (inc. VAT) ${money(quote.total_gbp)}`,
      "",
      `This quote is valid for ${quote.validity_days} days and is based on the information you've provided; a site visit may refine it. To go ahead or arrange a visit, just reply${callLine}.`,
      "",
      "Kind regards,",
      businessName,
    ].join("\n");

    const replyHtml = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#222">
<p>Hi ${escapeHtml(displayName)},</p>
<p>Thank you — here is your fixed-price quotation (ref <strong>${escapeHtml(quoteRef)}</strong>):</p>
<table style="border-collapse:collapse;font-size:14px;margin:8px 0 4px">
<tr>
<td style="padding:6px 16px 6px 0">${escapeHtml(line ? line.description : "")}</td>
<td style="padding:6px 16px;color:#555">${line ? `${line.quantity} ${escapeHtml(line.unit)}` : ""}</td>
<td style="padding:6px 0;text-align:right">${money(line ? line.total_gbp : 0)}</td>
</tr>
</table>
<p style="margin:4px 0">Subtotal ${money(quote.subtotal_gbp)} &middot; VAT ${money(quote.vat_gbp)} &middot; <strong>Total (inc. VAT) ${money(quote.total_gbp)}</strong></p>
<p>This quote is valid for ${quote.validity_days} days and is based on the information you've provided; a site visit may refine it. To go ahead or arrange a visit, just reply${escapeHtml(callLine)}.</p>
<p>Kind regards,<br>${escapeHtml(businessName)}</p>
</div>`;

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
      replyText,
      replyHtml,
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
