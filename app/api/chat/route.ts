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
import { getRequestOriginDomain, getSiteConfig } from "@/lib/sites/registry";
import { GOGREEN_BRAND, sendSurveyChatLead } from "@/lib/survey-lead";
import { priceSurvey, SURVEY_TYPE_LABELS } from "@/lib/survey-pricing";
import type { ChatTurn } from "@/lib/chat-agent";

export const runtime = "nodejs";
export const maxDuration = 60;

function money(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

/**
 * What we tell GoGreen the customer was quoted. Recomputed here from the survey
 * details rather than trusting the figure the model reported saying — if the two
 * ever disagree, the rep should be working from the price list, not from what
 * the chat happened to say.
 */
function summariseSurveyQuote(survey: ChatTurn["survey"]): {
  summary: string | null;
  mismatch: string | null;
} {
  // Survey work is never estimated — if it isn't in the list a specialist prices
  // it, and the rep needs to see that before anything else in the email.
  if (survey.needs_specialist) {
    return { summary: "SPECIALIST QUOTE REQUIRED — not covered by the price list, no price given", mismatch: null };
  }
  if (!survey.property_kind || !survey.survey_type) return { summary: null, mismatch: null };

  const priced = priceSurvey({
    property: survey.property_kind,
    type: survey.survey_type,
    bedrooms: survey.bedrooms,
    sqm: survey.floor_area_sqm,
  });

  if (priced.kind === "poa") {
    return {
      summary: `SPECIALIST QUOTE REQUIRED — ${priced.label}, price on application. ${priced.reason}`,
      mismatch: null,
    };
  }
  if (priced.kind === "needs_size") {
    return { summary: `${SURVEY_TYPE_LABELS[survey.survey_type]} — size not confirmed`, mismatch: null };
  }

  const expected = survey.discount_offered ? priced.discountedGbp : priced.gbp;
  const parts = [`${priced.label}: £${expected.toFixed(2)} + VAT`];
  if (survey.discount_offered) parts.push(`(10% discount applied, list £${priced.gbp.toFixed(2)})`);

  // The model quotes from a table it was handed, so this should always agree.
  // Surface it if it ever doesn't rather than letting a wrong number go quiet.
  const said = survey.quoted_gbp;
  const mismatch =
    said !== null && Math.abs(said - expected) > 0.5
      ? `Chat said £${said.toFixed(2)} but the price list gives £${expected.toFixed(2)}`
      : null;

  return { summary: parts.join(" "), mismatch };
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

  // The chat stays open after a survey lead is handed over, and the whole
  // history is replayed on every turn — so without this the same lead would be
  // emailed to GoGreen again on each subsequent message. The widget holds the
  // flag and sends it back.
  const surveyLeadAlreadySent = body.surveyLeadSent === true;

  // Reported to GoGreen as the source website. Deliberately separate from
  // brandDomain: the removal lane's behaviour must not change, and an embedded
  // site we hold no config for still has to be named correctly on the lead.
  const surveySourceDomain =
    String(body.brandDomain || "").trim() || getRequestOriginDomain() || site.domain;

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

    // ---- SURVEY LANE ------------------------------------------------------
    // Survey/testing work is fulfilled by GoGreen Surveyors, so it is handed
    // over by email and deliberately never becomes a CRM quote.
    if (turn.lane === "survey") {
      let leadSent = surveyLeadAlreadySent;
      let sentStage = String(body.surveyLeadStage || "");

      // The model sets survey_lead_ready, but the same facts are already in the
      // extracted fields — so derive it here too rather than lose a lead to a
      // flag the model forgot to flip.
      //
      // A booking waits for the date. Handing over the instant a name appears
      // told the partner "customer wants to book" while the customer was still
      // deciding — and one then changed their mind a turn later, after the email
      // had gone. The prompt guarantees a date value, so this cannot stall.
      const hasSettledBooking = turn.survey.status === "book" && Boolean(turn.survey.preferred_date);

      // The client asked for the follow-up preference to be recorded, so wait for
      // it the same way a booking waits for its date — otherwise the lead goes out
      // saying "not given" one turn before the customer actually answers.
      const hasSettledFollowUp =
        turn.survey.status === "follow_up" && Boolean(turn.survey.follow_up_preference);

      // A specialist case has nothing left to settle — no price to agree, no date
      // to pick, nothing to prefer — so an email address is the whole requirement.
      const settled = hasSettledBooking || hasSettledFollowUp || turn.survey.needs_specialist;

      // Safety net. Survey work that is neither Management nor R&D (air testing,
      // a register update) never gets survey_type set, and the assistant does not
      // reliably raise needs_specialist for it either — so the bot was promising
      // a specialist callback while nothing was sent. Once someone has given an
      // email and the conversation has actually run, hand it over regardless.
      // Last-resort backstop for work the assistant never flags and never prices —
      // air testing, a register update — so it cannot promise a callback and send
      // nothing. Details are now collected BEFORE the survey type is known, so
      // this has to sit well clear of the name/email/phone steps or it fires
      // mid-flow on ordinary enquiries that were about to be quoted normally.
      const userTurns = messages.filter((m) => m.role === "user").length;
      const unpriceable =
        turn.survey.survey_type === null &&
        turn.survey.quoted_gbp === null &&
        turn.survey.property_kind === null &&
        Boolean(turn.customer_name) &&
        userTurns >= 8;

      const readyToHandOver = Boolean(turn.customer_email) && (settled || unpriceable);

      // Capturing early must not cost us the booking that comes afterwards, so a
      // settled outcome is allowed to send once more. Two emails at most.
      const stage = settled ? "final" : "capture";
      const alreadySentStage = String(body.surveyLeadStage || "");
      const wouldDuplicate = alreadySentStage === "final" || alreadySentStage === stage;

      if (readyToHandOver && turn.customer_email && !wouldDuplicate) {
        const { summary, mismatch } = summariseSurveyQuote(turn.survey);
        if (mismatch) console.error("survey quote mismatch:", mismatch, turn.survey);

        // The transcript is the whole conversation including the reply we are
        // about to send, so the rep sees exactly what the customer saw.
        const transcript = [...messages, { role: "assistant" as const, content: turn.reply }]
          .map((m) => `${m.role === "user" ? "Customer" : "Assistant"}: ${m.content}`)
          .join("\n\n");

        const r = await sendSurveyChatLead({
          customerName: turn.customer_name || "Website enquiry",
          customerEmail: turn.customer_email,
          customerPhone: turn.customer_phone,
          status: turn.survey.status === "book" ? "book" : "follow_up",
          preferredDate: turn.survey.preferred_date,
          followUpPreference: turn.survey.follow_up_preference,
          quotedSummary:
            summary ?? (stage === "capture" ? "No price given — see transcript for what they asked for" : null),
          transcript,
          city: brandCity,
          domain: surveySourceDomain,
        });
        leadSent = r.sent;
        if (r.sent) sentStage = stage;
        if (!r.sent) console.error("survey lead handover failed:", r.error);
      }

      return NextResponse.json({
        reply: turn.reply,
        done: false,
        lane: "survey",
        surveyLeadSent: leadSent,
        surveyLeadStage: sentStage,
        partner: GOGREEN_BRAND,
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
