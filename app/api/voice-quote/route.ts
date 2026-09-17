import { NextResponse } from "next/server";
import {
  buildLeadDetailsFromQuote,
  createQuoteInBase44,
  isBase44Configured,
  splitPersonName,
} from "@/lib/base44";
import { loadCatalogServices } from "@/lib/catalog-pricing";
import { createAndSendCrmQuote, createCrmLead, isCrmConfigured } from "@/lib/crm";
import { assessEnquiryItems } from "@/lib/enquiry-quote";
import { officeState } from "@/lib/office-hours";

export const runtime = "nodejs";
export const maxDuration = 60;

// The phone agent is national, not a city site: a call can come from anywhere.
const BRAND_NAME = "Asbestos UK Teams Ltd";
const BRAND_CITY = "UK";
const BRAND_DOMAIN = "asbestosukteams.co.uk";

function money(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

function makeQuoteRef() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `Q-${BRAND_CITY}-${stamp}-${rand}`;
}

type VoiceService = { service?: unknown; quantity?: unknown };

/**
 * Vapi posts tool calls wrapped in its own envelope and expects
 * `{ results: [{ toolCallId, result }] }` back. Accept that shape, and also a
 * plain JSON body so the endpoint can be tested with curl.
 */
function unwrap(body: Record<string, unknown>): {
  args: Record<string, unknown>;
  toolCallId: string | null;
} {
  const message = body.message as { toolCalls?: unknown[] } | undefined;
  const call = Array.isArray(message?.toolCalls) ? (message!.toolCalls[0] as Record<string, unknown>) : null;
  if (!call) return { args: body, toolCallId: null };

  const fn = (call.function ?? {}) as { arguments?: unknown };
  let args: Record<string, unknown> = {};
  if (typeof fn.arguments === "string") {
    try {
      args = JSON.parse(fn.arguments) as Record<string, unknown>;
    } catch {
      args = {};
    }
  } else if (fn.arguments && typeof fn.arguments === "object") {
    args = fn.arguments as Record<string, unknown>;
  }
  return { args, toolCallId: typeof call.id === "string" ? call.id : null };
}

/** Vapi reads `result` aloud, so it must be a short spoken sentence. */
function reply(toolCallId: string | null, spoken: string, extra: Record<string, unknown> = {}) {
  if (toolCallId) {
    return NextResponse.json({ results: [{ toolCallId, result: spoken }] });
  }
  return NextResponse.json({ ok: true, message: spoken, ...extra });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { args, toolCallId } = unwrap(body);

  // Vapi sends whatever the tool schema declares, so tolerate snake_case too —
  // a schema edited to site_address would otherwise silently drop the address.
  const arg = (camel: string) => {
    const snake = camel.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    return String(args[camel] ?? args[snake] ?? "").trim();
  };
  const customerName = arg("customerName");
  const customerEmail = arg("customerEmail");
  const customerPhone = arg("customerPhone");
  const siteAddress = arg("siteAddress");
  const notes = arg("notes");
  const rawServices: VoiceService[] = Array.isArray(args.services) ? (args.services as VoiceService[]) : [];

  const hasEmail = Boolean(customerEmail && customerEmail.includes("@"));

  // The team handle daytime enquiries themselves. Enforce that here rather than
  // trusting the assistant to have called check_office_hours first — on a live
  // 14:27 call it skipped that check and quoted anyway. Deciding it server-side
  // means it cannot be skipped. Must come before the email guard below: a
  // daytime callback is never emailed, so it must not demand an email address.
  const { isOpen, clock } = officeState();
  const officeHoursCallback = isOpen && rawServices.length > 0;
  const quoting = rawServices.length > 0 && !officeHoursCallback;

  // A quote has to be emailed somewhere, so an address is required to price one.
  // A callback lead is not emailed, so a phone number is enough.
  if (quoting && !hasEmail) {
    return reply(toolCallId, "I need a valid email address before I can send the quotation.");
  }
  if (!hasEmail && !customerPhone) {
    return reply(toolCallId, "I need either an email address or a phone number so the team can reach you.");
  }

  const { firstName, lastName } = splitPersonName(customerName || "Phone enquiry");

  // No priceable service, or the office is open -> capture the lead instead.
  if (rawServices.length === 0 || officeHoursCallback) {
    if (isCrmConfigured()) {
      await createCrmLead({
        name: customerName || "Phone enquiry",
        email: customerEmail,
        phone: customerPhone,
        serviceInterest: notes || "Phone enquiry",
        source: "AI Phone Agent",
        originCity: BRAND_CITY,
        originDomain: BRAND_DOMAIN,
        notes: `CALLBACK REQUESTED — ${officeHoursCallback ? `caller rang at ${clock} UK, during office hours, so no price was given` : "caller had no priceable service to quote"}. Told the team would ring back. Phone: ${customerPhone || "not given"}. ${notes}`.trim(),
        message: [notes, officeHoursCallback ? `Asked about: ${rawServices.map((s) => String(s.service || "")).filter(Boolean).join(", ")}` : ""]
          .filter(Boolean)
          .join(" | "),
      });
    }
    return reply(
      toolCallId,
      officeHoursCallback
        ? `The office is open right now (${clock} UK time), so do NOT give a price. Tell the caller our team are in the office and someone will call them straight back shortly, then end the call politely.`
        : "Thanks, I've passed your details to the team and someone will call you back shortly.",
    );
  }

  try {
    const catalog = await loadCatalogServices();

    // The caller gives one number per service; which field it belongs in depends
    // on how that service is priced, so offer it as all three and let the pricing
    // engine take the one it needs.
    const assessment = assessEnquiryItems({
      items: rawServices.map((s) => {
        const q = Number(s.quantity);
        const v = Number.isFinite(q) && q > 0 ? q : null;
        return {
          service: String(s.service || "").trim(),
          fields: { area_sqm: v, length_lm: v, quantity: v },
        };
      }),
      catalog,
    });

    if (assessment.status !== "quoted") {
      if (isCrmConfigured()) {
        await createCrmLead({
          name: customerName || "Phone enquiry",
          email: customerEmail,
          phone: customerPhone,
          serviceInterest: rawServices.map((s) => String(s.service || "")).join(", "),
          source: "AI Phone Agent",
          originCity: BRAND_CITY,
          originDomain: BRAND_DOMAIN,
          notes: `Phone enquiry the AI could not auto-price. ${notes}`.trim(),
        });
      }
      return reply(toolCallId, "I can't price that one automatically, but I've logged it and a specialist will call you back shortly.");
    }

    const quote = assessment.quote;
    const quoteRef = makeQuoteRef();
    const serviceLabel = rawServices.map((s) => String(s.service || "")).filter(Boolean).join(", ");

    let emailSent = false;
    if (isCrmConfigured()) {
      const r = await createAndSendCrmQuote({
        customerName: customerName || "Phone enquiry",
        customerEmail,
        customerAddress: siteAddress || undefined,
        customerPhone: customerPhone || undefined,
        serviceInterest: serviceLabel,
        originCity: BRAND_CITY,
        originDomain: BRAND_DOMAIN,
        quote,
        salesAgentName: "AI Phone Assistant",
      });
      emailSent = r.sent;
    }

    if (isBase44Configured()) {
      try {
        await createQuoteInBase44({
          firstName: firstName || "Phone enquiry",
          lastName,
          phone: customerPhone,
          email: customerEmail,
          service: serviceLabel,
          details: buildLeadDetailsFromQuote(quote, notes || undefined),
          city: BRAND_CITY,
          domain: BRAND_DOMAIN,
          quote_ref: quoteRef,
          quote_total_gbp: quote.total_gbp,
          quote_json: JSON.stringify(quote),
          survey_summary: quote.survey_summary,
          quote_emailed: emailSent,
          lead_source: "voice_agent",
          status: "quoted",
        });
      } catch (err) {
        console.error("voice quote lead save failed (continuing):", err);
      }
    }

    return reply(
      toolCallId,
      `That comes to ${money(quote.total_gbp)} including VAT. I've sent the quotation to ${customerEmail} — it has a button to accept and choose a date.`,
      { quoteRef, totalGbp: quote.total_gbp, emailSent },
    );
  } catch (err) {
    console.error("voice quote failed", err);
    return reply(toolCallId, "Sorry, I couldn't generate that quotation just now. I've taken your details and someone will call you straight back.");
  }
}
