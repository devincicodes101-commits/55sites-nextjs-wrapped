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
import { rejectUnlessFromVapi } from "@/lib/vapi-auth";
import { resolveServiceName } from "@/lib/voice-catalog";

export const runtime = "nodejs";
export const maxDuration = 60;

// The phone agent is national, not a city site: a call can come from anywhere.
const BRAND_NAME = "Asbestos UK Teams Ltd";
const BRAND_CITY = "UK";
const BRAND_DOMAIN = "asbestosukteams.co.uk";

// More than this many of a fixed-price job on one call is more likely a mistake
// (an area or a sheet count given as the quantity) than a real order.
const MAX_FIXED_QUANTITY = 3;

function money(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

function makeQuoteRef() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `Q-${BRAND_CITY}-${stamp}-${rand}`;
}

type VoiceService = { service?: unknown; quantity?: unknown };

// What this request did, logged once at the end. No customer details.
type TraceService = { asked: string; quantity: unknown; resolved?: string; match?: string; reason?: string };
type Trace = { callId: string | null; outcome: string; services: TraceService[] };

// Calls where the agent has been told a name isn't on the list, so a second miss
// goes to the team. Held per server instance: if a retry lands on another instance
// the agent is simply told again, and the prompt limits how often it retries.
const NAME_RETRY_TTL_MS = 30 * 60 * 1000;
const nameRetries = new Map<string, number>();

function hasNameRetry(key: string | null): boolean {
  const now = Date.now();
  nameRetries.forEach((expires, k) => {
    if (expires < now) nameRetries.delete(k);
  });
  return key != null && nameRetries.has(key);
}

function notOnListMessage(unmatched: { name: string; closest: string[] }[]): string {
  const names = unmatched
    .map(({ name, closest }) =>
      closest.length > 0
        ? `"${name}" isn't on the service list. The closest exact names are: ${closest.map((c) => `"${c}"`).join(", ")}.`
        : `"${name}" isn't on the service list, and nothing on it is close.`,
    )
    .join(" ");
  return `${names} Nothing has been priced or logged yet. Call send_quote again with the exact name, copied character for character, and all the same details. If more than one name could fit, ask the caller which one first. If none of them fit, call send_quote again with the same words and the team will follow it up.`;
}

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
  const trace: Trace = { callId: null, outcome: "error", services: [] };
  try {
    return await handle(request, trace);
  } finally {
    console.log(`[voice-quote] call=${trace.callId ?? "none"} outcome=${trace.outcome} services=${JSON.stringify(trace.services)}`);
  }
}

async function handle(request: Request, trace: Trace) {
  const rejected = rejectUnlessFromVapi(request);
  if (rejected) {
    trace.outcome = "unauthorized";
    return rejected;
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    trace.outcome = "invalid_json";
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

  const vapiCall = (body.message as { call?: { id?: unknown } } | undefined)?.call;
  trace.callId = typeof vapiCall?.id === "string" ? vapiCall.id : null;
  trace.services = rawServices.map((s) => ({ asked: String(s.service || "").trim(), quantity: s.quantity ?? null }));
  const unpriced = (reason: string) => trace.services.forEach((s) => (s.reason = reason));
  // Identifies this call between send_quote attempts. Contact details are only the
  // fallback for a request with no Vapi call id, such as a curl test.
  const retryKey = trace.callId ?? (customerPhone || customerEmail || null);

  const hasEmail = Boolean(customerEmail && customerEmail.includes("@"));

  // The team handle daytime enquiries themselves. Enforce that here rather than
  // trusting the assistant to have called check_office_hours first — on a live
  // 14:27 call it skipped that check and quoted anyway. Deciding it server-side
  // means it cannot be skipped. Must come before the email guard below: a
  // daytime callback is never emailed, so it must not demand an email address.
  const { isOpen, clock } = officeState();
  const officeHoursCallback = isOpen && rawServices.length > 0;
  const allServices = rawServices.map((s) => String(s.service || "")).filter(Boolean).join(", ");
  const needContact = "I need either an email address or a phone number so the team can reach you.";

  const { firstName, lastName } = splitPersonName(customerName || "Phone enquiry");

  const logLead = async (lead: {
    serviceInterest: string;
    notes: string;
    message?: string;
    estimatedValue?: number;
    quoteId?: string;
  }) => {
    if (!isCrmConfigured()) {
      console.error("[voice-quote] CRM is not configured, so this lead was not logged:", lead.notes);
      return;
    }
    await createCrmLead({
      name: customerName || "Phone enquiry",
      email: customerEmail,
      phone: customerPhone,
      source: "AI Phone Agent",
      originCity: BRAND_CITY,
      originDomain: BRAND_DOMAIN,
      ...lead,
    });
  };

  // No services given, or the office is open -> capture the lead instead.
  if (rawServices.length === 0 || officeHoursCallback) {
    if (!hasEmail && !customerPhone) {
      trace.outcome = "need_contact";
      unpriced("no contact details");
      return reply(toolCallId, needContact);
    }

    trace.outcome = officeHoursCallback ? "office_hours_callback" : "callback";
    unpriced(isOpen ? "office hours" : "no services sent");
    await logLead({
      serviceInterest: notes || "Phone enquiry",
      notes: `CALLBACK REQUESTED — ${isOpen ? `caller rang at ${clock} UK, during office hours, so no price was given` : "caller had no priceable service to quote"}. Told the team would ring back. Phone: ${customerPhone || "not given"}. ${notes}`.trim(),
      message: [notes, officeHoursCallback ? `Asked about: ${allServices}` : ""].filter(Boolean).join(" | "),
    });
    return reply(
      toolCallId,
      officeHoursCallback
        ? `The office is open right now (${clock} UK time), so do NOT give a price. Tell the caller our team are in the office and someone will call them straight back shortly, then end the call politely.`
        : "Thanks, I've passed your details to the team and someone will call you back shortly.",
    );
  }

  try {
    // Fetched fresh on every quote, so a price change in Base44 applies at once.
    // A service switched off for the phone can't be quoted even if the assistant
    // names it anyway; it goes to the team like any other unlisted service.
    const catalog = (await loadCatalogServices()).filter((s) => s.voice_enabled !== false);

    // Turn each name the agent sent into a catalog name, where that's safe.
    const unmatched: { name: string; closest: string[] }[] = [];
    const items = rawServices.map((s, i) => {
      const asked = trace.services[i].asked;
      if (!asked) return { service: asked, quantity: s.quantity };
      const match = resolveServiceName(asked, catalog);
      trace.services[i].match = match.kind;
      if (match.kind === "none") {
        unmatched.push({ name: asked, closest: match.closest });
        return { service: asked, quantity: s.quantity };
      }
      trace.services[i].resolved = match.service.name;
      return { service: match.service.name, quantity: s.quantity };
    });

    // A name we don't recognise is usually the agent shortening it, so give it the
    // chance to correct that before anything is priced or logged.
    if (unmatched.length > 0 && !hasNameRetry(retryKey)) {
      if (retryKey) nameRetries.set(retryKey, Date.now() + NAME_RETRY_TTL_MS);
      trace.outcome = "name_not_on_list";
      unpriced("waiting for a name from the list");
      return reply(toolCallId, notOnListMessage(unmatched));
    }
    if (unmatched.length === 0 && retryKey) nameRetries.delete(retryKey);

    const requested = items.map((i) => i.service).filter(Boolean).join(", ");
    // Say what the caller asked for, so the team can see why it was left out
    // (e.g. a quantity over the fixed-price cap).
    const withQuantity = (name: string) => {
      const quantity = items.find((i) => i.service === name)?.quantity;
      return quantity != null && quantity !== "" ? `${name} (quantity ${String(quantity)})` : name;
    };

    // The caller gives one number per service; which field it belongs in depends
    // on how that service is priced, so offer it in every field and let the
    // pricing engine take the one it needs.
    const assessment = assessEnquiryItems({
      items: items.map(({ service, quantity }) => {
        const q = Number(quantity);
        const v = Number.isFinite(q) && q > 0 ? q : null;
        return { service, fields: { area_sqm: v, length_lm: v, quantity: v, hours: v, days: v } };
      }),
      catalog,
      options: { allowPartial: false, maxFixedQuantity: MAX_FIXED_QUANTITY },
    });

    // Nothing has been created yet, so the assistant can simply ask and call again.
    if (assessment.status === "info_required") {
      trace.outcome = "info_required";
      unpriced("waiting on another service's measurement");
      trace.services.filter((s) => (s.resolved ?? s.asked) === assessment.service).forEach((s) => {
        s.reason = `needs ${assessment.missing.join(" and ")}`;
      });
      return reply(
        toolCallId,
        `Before I can price ${assessment.service} I need ${assessment.missing.join(" and ")}. Ask the caller for it, then call send_quote again with the same details.`,
      );
    }

    trace.services.forEach((s) => {
      const reason = assessment.skippedReasons?.[s.resolved ?? s.asked];
      if (reason) s.reason = reason;
    });

    if (assessment.status !== "quoted") {
      if (!hasEmail && !customerPhone) {
        trace.outcome = "need_contact";
        return reply(toolCallId, needContact);
      }

      if (retryKey) nameRetries.delete(retryKey);
      trace.outcome = "lead_not_priced";
      await logLead({
        serviceInterest: requested,
        notes: `Phone enquiry the AI could not auto-price: ${items.map((i) => i.service).filter(Boolean).map(withQuantity).join(", ")}. ${notes}`.trim(),
      });
      return reply(toolCallId, "I can't price that one automatically, but I've logged it and a specialist will call you back shortly.");
    }

    // A quote has to be emailed somewhere, so an address is required to issue one.
    // Asked here rather than up front because a callback lead doesn't need one.
    if (!hasEmail) {
      trace.outcome = "need_email";
      return reply(toolCallId, "I need a valid email address before I can send the quotation.");
    }

    if (retryKey) nameRetries.delete(retryKey);

    const quote = assessment.quote;
    const quoteRef = makeQuoteRef();
    const serviceLabel = quote.recommended_works.join(", ");
    const total = money(quote.total_gbp);

    const skippedLabel = assessment.skipped.map(withQuantity).join(", ");
    const skippedNote = skippedLabel
      ? `NOT IN THE QUOTE — the team must quote these and call the caller back: ${skippedLabel}.`
      : "";

    let emailSent = false;
    let quoteId: string | null = null;
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
      quoteId = r.quoteId;
    }
    trace.outcome = emailSent ? "quoted_sent" : quoteId ? "quoted_email_failed" : "quote_not_created";

    // Anything the team has to pick up by hand goes on ONE lead. lib/crm.ts logs no
    // lead at all when the quote can't be created, and one saying the quote was
    // sent when only the email failed, so this lead is what tells the team.
    const deliveryNote = emailSent
      ? ""
      : quoteId
        ? `QUOTE EMAIL NOT SENT — quote ${quoteId} (${total} incl VAT, ${serviceLabel}) exists in the CRM but did not reach ${customerEmail}. Please send it.`
        : `QUOTE NOT CREATED — the caller was told ${total} incl VAT for ${serviceLabel}. Please create it and send it to ${customerEmail}.`;
    if (deliveryNote || skippedNote) {
      await logLead({
        serviceInterest: [deliveryNote ? serviceLabel : "", assessment.skipped.join(", ")].filter(Boolean).join(", "),
        notes: [deliveryNote, skippedNote, notes].filter(Boolean).join(" "),
        ...(deliveryNote ? { estimatedValue: quote.total_gbp } : {}),
        ...(quoteId ? { quoteId } : {}),
      });
    }

    if (isBase44Configured()) {
      try {
        await createQuoteInBase44({
          firstName: firstName || "Phone enquiry",
          lastName,
          phone: customerPhone,
          email: customerEmail,
          service: serviceLabel,
          details: buildLeadDetailsFromQuote(quote, [skippedNote, notes].filter(Boolean).join(" ") || undefined),
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

    const delivery = emailSent
      ? `I've sent the quotation to ${customerEmail} — it has a button to accept and choose a date.`
      : `The quotation is ready, and our team will make sure it reaches you at ${customerEmail}.`;
    const skippedLine = assessment.skipped.length
      ? ` I couldn't price ${assessment.skipped.join(" or ")} automatically, so our team will quote ${assessment.skipped.length > 1 ? "those" : "that"} separately and call you back.`
      : "";

    return reply(toolCallId, `That comes to ${total} including VAT. ${delivery}${skippedLine}`, {
      quoteRef,
      totalGbp: quote.total_gbp,
      emailSent,
      skipped: assessment.skipped,
    });
  } catch (err) {
    console.error("voice quote failed", err);
    trace.outcome = "error";
    unpriced("error while quoting");
    await logLead({
      serviceInterest: allServices,
      notes: `Phone quote failed with an error, so the caller was told someone will call straight back. Asked about: ${allServices}. ${notes}`.trim(),
    });
    return reply(toolCallId, "Sorry, I couldn't generate that quotation just now. I've taken your details and someone will call you straight back.");
  }
}
