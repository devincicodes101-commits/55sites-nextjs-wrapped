import { NextResponse } from "next/server";
import {
  buildLeadDetailsFromQuote,
  createQuoteInBase44,
  isBase44Configured,
  splitPersonName,
} from "@/lib/base44";
import { loadCatalogServices } from "@/lib/catalog-pricing";
import { isChatConfigured, runChatTurn, type ChatMessage } from "@/lib/chat-agent";
import { createAndSendCrmQuote, isCrmConfigured } from "@/lib/crm";
import { assessEnquiryItems } from "@/lib/enquiry-quote";
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

  // Optional brand override sent by embedded widgets (Base44 sites on other
  // domains). Cross-origin calls arrive on our host, so getSiteConfig() falls
  // back to the default brand — the widget passes its own name/city/phone so the
  // quote ref + branding match that site, with no per-domain config for all 277.
  const brandCity = String(body.brandCity || "").trim() || site.city;
  const brandName = String(body.brandName || "").trim() || site.businessName;
  const brandPhone = String(body.brandPhone || "").trim() || site.phoneDisplay;
  const brandDomain = String(body.brandDomain || "").trim() || site.domain;

  try {
    const catalog = await loadCatalogServices();
    const turn = await runChatTurn({
      messages,
      catalog,
      businessName: brandName,
      city: brandCity,
      phoneDisplay: brandPhone,
    });

    if (!turn) {
      return NextResponse.json({
        reply: `Sorry, I'm having trouble right now — please call us on ${brandPhone} and we'll help.`,
        done: false,
      });
    }

    // Still gathering info -> just return the assistant's next message.
    if (!turn.ready_to_quote || !turn.items?.length) {
      return NextResponse.json({ reply: turn.reply, done: false });
    }

    // Ready -> price EVERY requested service from the catalog and combine them
    // into one quote (so "artex AND a garage roof" becomes a 2-line quotation).
    const assessment = assessEnquiryItems({
      items: turn.items.map((it) => ({
        service: it.service,
        fields: { area_sqm: it.area_sqm, length_lm: it.length_lm, quantity: it.quantity },
      })),
      catalog,
    });

    if (assessment.status !== "quoted") {
      // AI signalled ready but we still need something, or it isn't auto-priceable.
      return NextResponse.json({ reply: turn.reply, done: false });
    }

    const quote = assessment.quote;
    const quoteRef = makeQuoteRef(brandCity);
    const serviceLabel = turn.items.map((it) => it.service).filter(Boolean).join(", ");

    // Send the quote. Prefer the CRM (branded quote + Accept button + diary +
    // stored in Quotes, like a real rep); fall back to our own email otherwise.
    let emailSent = false;
    if (turn.customer_email) {
      if (isCrmConfigured()) {
        const r = await createAndSendCrmQuote({
          customerName: turn.customer_name || "there",
          customerEmail: turn.customer_email,
          customerAddress: turn.customer_address || undefined,
          customerPhone: turn.customer_phone || undefined,
          serviceInterest: serviceLabel,
          originCity: brandCity,
          originDomain: brandDomain,
          quote,
          salesAgentName: "AI Chat Assistant",
        });
        emailSent = r.sent;
      } else {
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
          service: serviceLabel,
          details: buildLeadDetailsFromQuote(quote),
          city: brandCity,
          domain: brandDomain,
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
        businessName: brandName,
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
