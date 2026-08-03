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
import { buildQuoteDocFromQuote } from "@/lib/quote-document";
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

/** Professional, per-brand HTML quotation email (logo, table, coloured total banner). */
function brandedQuoteHtml(o: {
  businessName: string;
  logoLetter: string;
  primary: string;
  dark: string;
  contactEmail: string;
  phoneDisplay: string;
  customerName: string;
  quoteRef: string;
  lineItems: { description: string; quantity: number; unit: string; total_gbp: number }[];
  vat: number;
  total: number;
  validityDays: number;
}): string {
  const rows = o.lineItems
    .map(
      (li) => `
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid #eee;font-size:14px;color:#222">${escapeHtml(li.description)}</td>
        <td style="padding:14px 20px;border-bottom:1px solid #eee;font-size:14px;color:#222;text-align:center">${li.quantity}</td>
        <td style="padding:14px 20px;border-bottom:1px solid #eee;font-size:14px;color:#222;text-align:right">${money(li.total_gbp)}</td>
      </tr>`,
    )
    .join("");

  const contact = o.contactEmail
    ? `<a href="mailto:${escapeHtml(o.contactEmail)}" style="color:#fff;text-decoration:underline">${escapeHtml(o.contactEmail)}</a>`
    : escapeHtml(o.phoneDisplay);
  const callLine = o.phoneDisplay ? ` or call us on ${escapeHtml(o.phoneDisplay)}` : "";

  return `<div style="background:#f4f4f5;padding:24px 0;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
    <tr><td style="background:${o.dark};padding:22px 24px">
      <table role="presentation" width="100%"><tr>
        <td style="vertical-align:middle">
          <span style="display:inline-block;width:34px;height:34px;line-height:34px;text-align:center;background:${o.primary};color:#fff;font-weight:bold;border-radius:6px;font-size:16px">${escapeHtml(o.logoLetter)}</span>
          <span style="color:#fff;font-size:18px;font-weight:bold;margin-left:10px;vertical-align:middle">${escapeHtml(o.businessName)}</span>
        </td>
        <td style="text-align:right;color:#cbd5e1;font-size:13px;letter-spacing:2px;font-weight:bold;vertical-align:middle">QUOTATION</td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:24px 24px 8px">
      <table role="presentation" width="100%"><tr>
        <td style="font-size:11px;color:#888;letter-spacing:1px">PREPARED FOR<br><span style="font-size:15px;color:#222;font-weight:bold">${escapeHtml(o.customerName)}</span></td>
        <td style="text-align:right;font-size:11px;color:#888;letter-spacing:1px">QUOTE NUMBER<br><span style="font-size:15px;color:#222;font-weight:bold">${escapeHtml(o.quoteRef)}</span></td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:12px 24px 4px;font-size:14px;color:#333;line-height:1.5">
      <p style="margin:0 0 6px">Hi ${escapeHtml(o.customerName)},</p>
      <p style="margin:0">Thank you for your enquiry. Please find your fixed-price quotation below.</p>
    </td></tr>
    <tr><td style="padding:16px 24px 0">
      <table role="presentation" width="100%" style="border-collapse:collapse">
        <tr style="background:#f9fafb">
          <td style="padding:10px 20px;font-size:11px;color:#888;letter-spacing:1px">SERVICE</td>
          <td style="padding:10px 20px;font-size:11px;color:#888;letter-spacing:1px;text-align:center">QTY</td>
          <td style="padding:10px 20px;font-size:11px;color:#888;letter-spacing:1px;text-align:right">TOTAL</td>
        </tr>
        ${rows}
        <tr><td colspan="2" style="padding:12px 20px;text-align:right;font-size:13px;color:#666">VAT (20%)</td><td style="padding:12px 20px;text-align:right;font-size:13px;color:#666">${money(o.vat)}</td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:8px 24px 20px">
      <table role="presentation" width="100%" style="background:${o.primary};border-radius:6px"><tr>
        <td style="padding:14px 20px;color:#fff;font-size:16px;font-weight:bold">Total (inc. VAT)</td>
        <td style="padding:14px 20px;color:#fff;font-size:16px;font-weight:bold;text-align:right">${money(o.total)}</td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:0 24px 22px;font-size:13px;color:#666;line-height:1.5">
      This quote is valid for ${o.validityDays} days and is based on the information you've provided; a site visit may refine it. To go ahead or arrange a visit, just reply to this email${callLine}.
    </td></tr>
    <tr><td style="background:${o.primary};padding:16px 24px;text-align:center;color:#fff;font-size:13px">
      Questions? Contact us at ${contact}<br>
      <span style="font-size:11px;opacity:.85">Payment terms: payment on completion</span>
    </td></tr>
  </table>
</div>`;
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

    const replyHtml = buildQuoteDocFromQuote({
      quote,
      customerName: displayName,
      customerEmail: fromEmail,
      customerAddress: intent.customer_address || undefined,
      quoteRef,
      catalog,
    });

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
