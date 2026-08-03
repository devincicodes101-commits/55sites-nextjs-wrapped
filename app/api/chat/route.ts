import { NextResponse } from "next/server";
import {
  buildLeadDetailsFromQuote,
  createQuoteInBase44,
  isBase44Configured,
  splitPersonName,
} from "@/lib/base44";
import { loadCatalogServices } from "@/lib/catalog-pricing";
import { isChatConfigured, runChatTurn, type ChatMessage } from "@/lib/chat-agent";
import { assessEnquiry } from "@/lib/enquiry-quote";
import { sendBrandedQuoteEmail } from "@/lib/send-quote-email";
import { getSiteConfig } from "@/lib/sites/registry";

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
 * Website AI sales chat. The site's host resolves the brand (via getSiteConfig),
 * so it themes and quotes per domain automatically. The model gathers the
 * requirements; when complete the quote is priced in code and the lead is saved.
 */
export async function POST(request: Request) {
  if (!isChatConfigured()) {
    return NextResponse.json({ error: "Chat is not configured (OPENAI_API_KEY)" }, { status: 500 });
  }

  const site = getSiteConfig();

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const messages: ChatMessage[] = Array.isArray(body.messages)
    ? (body.messages as unknown[])
        .filter(
          (m): m is ChatMessage =>
            !!m &&
            typeof m === "object" &&
            ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
            typeof (m as ChatMessage).content === "string",
        )
        .slice(-20)
    : [];

  if (messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  try {
    const catalog = await loadCatalogServices();
    const turn = await runChatTurn({
      messages,
      catalog,
      businessName: site.businessName,
      city: site.city,
      phoneDisplay: site.phoneDisplay,
    });

    if (!turn) {
      return NextResponse.json({
        reply: `Sorry, I'm having trouble right now — please call us on ${site.phoneDisplay} and we'll help.`,
        done: false,
      });
    }

    // Still gathering info -> just return the assistant's next message.
    if (!turn.ready_to_quote || !turn.service) {
      return NextResponse.json({ reply: turn.reply, done: false });
    }

    // Ready -> price deterministically from the catalog.
    const assessment = assessEnquiry({
      service: turn.service,
      fields: { area_sqm: turn.area_sqm, length_lm: turn.length_lm, quantity: turn.quantity },
      catalog,
    });

    if (assessment.status !== "quoted") {
      // AI signalled ready but we still need something, or it isn't auto-priceable.
      return NextResponse.json({ reply: turn.reply, done: false });
    }

    const quote = assessment.quote;
    const quoteRef = makeQuoteRef(site.city);

    // Email the branded quote to the visitor (if we captured an email).
    let emailSent = false;
    if (turn.customer_email) {
      try {
        const r = await sendBrandedQuoteEmail({
          to: turn.customer_email,
          businessName: site.businessName,
          logoLetter: site.logoLetter || site.businessName.charAt(0).toUpperCase() || "A",
          primary: site.theme?.primary || "#c2410c",
          dark: site.theme?.dark || "#1f2937",
          contactEmail: site.email || "",
          phoneDisplay: site.phoneDisplay,
          customerName: turn.customer_name || "there",
          customerAddress: turn.customer_address || undefined,
          quoteRef,
          quote,
          catalog,
        });
        emailSent = r.sent;
      } catch (err) {
        console.error("chat quote email failed (continuing):", err);
      }
    }

    // Save the lead if we captured an email.
    if (turn.customer_email && isBase44Configured()) {
      const { firstName, lastName } = splitPersonName(turn.customer_name || "");
      try {
        await createQuoteInBase44({
          firstName: firstName || "Chat enquiry",
          lastName,
          phone: turn.customer_phone || "",
          email: turn.customer_email,
          service: turn.service,
          details: buildLeadDetailsFromQuote(quote),
          city: site.city,
          domain: site.domain,
          quote_ref: quoteRef,
          quote_total_gbp: quote.total_gbp,
          quote_json: JSON.stringify(quote),
          survey_summary: quote.survey_summary,
          quote_emailed: emailSent,
          lead_source: "chat_agent",
          status: "quoted",
        });
      } catch (err) {
        console.error("chat lead save failed (continuing):", err);
      }
    }

    return NextResponse.json({
      reply: turn.reply,
      done: true,
      quote: {
        ref: quoteRef,
        businessName: site.businessName,
        primary: site.theme?.primary || "#c2410c",
        lineItems: quote.line_items.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unit: li.unit,
          total_gbp: li.total_gbp,
        })),
        subtotal: quote.subtotal_gbp,
        vat: quote.vat_gbp,
        total: quote.total_gbp,
        totalDisplay: money(quote.total_gbp),
        validityDays: quote.validity_days,
      },
    });
  } catch (err) {
    console.error("chat failed", err);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
