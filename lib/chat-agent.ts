import type { CatalogService } from "./catalog-pricing";
import {
  DOMESTIC_FROM_GBP,
  DOMESTIC_HEADLINE_BEDROOMS,
  renderSurveyPriceTable,
  type PropertyKind,
  type SurveyType,
} from "./survey-pricing";
import { GOGREEN_BRAND } from "./survey-lead";

/**
 * Website AI sales chat agent (brain). Runs two lanes:
 *
 *  - REMOVAL  — the original flow. Gathers catalog services and measurements;
 *               pricing is done deterministically in code (assessEnquiry) and
 *               the quote goes out through the CRM.
 *  - SURVEY   — survey/testing work, which is fulfilled by GoGreen Surveyors.
 *               Priced from their own list, sold in the chat, then handed over
 *               by email. Never becomes a CRM quote.
 *
 * The model never invents a price in either lane. Removal prices are computed
 * after the fact; survey prices are read verbatim out of a table given to it,
 * including the already-worked-out discounted figure, so the one piece of
 * arithmetic in the flow is not left to the model.
 *
 * Uses OPENAI_API_KEY.
 */
export function isChatConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ChatItem = {
  service: string;
  area_sqm: number | null;
  length_lm: number | null;
  quantity: number | null;
};

export type ChatLane = "removal" | "survey" | "unknown";

export type SurveyDetails = {
  property_kind: PropertyKind | null;
  survey_type: SurveyType | null;
  bedrooms: number | null;
  floor_area_sqm: number | null;
  quoted_gbp: number | null;
  discount_offered: boolean;
  /** Survey work we cannot price from the list. Never estimated — a specialist quotes it. */
  needs_specialist: boolean;
  status: "book" | "follow_up" | null;
  preferred_date: string | null;
  follow_up_preference: string | null;
};

export type ChatTurn = {
  reply: string;
  lane: ChatLane;
  ready_to_quote: boolean;
  items: ChatItem[];
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  survey: SurveyDetails;
  survey_lead_ready: boolean;
};

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[]): T | null {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : null;
}

export async function runChatTurn(input: {
  messages: ChatMessage[];
  catalog: CatalogService[];
  businessName: string;
  city: string;
  phoneDisplay: string;
}): Promise<ChatTurn | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.OPENAI_MODEL || "gpt-4o";

  const catalogList = input.catalog
    .filter((s) => s.is_active !== false)
    .map((s) => `- "${s.name}" (priced ${s.unit_type})`)
    .join("\n");

  const system = `You are a friendly, professional sales assistant for ${input.businessName}, a UK HSE-licensed asbestos company serving ${input.city}. Keep replies short, warm and helpful — one question at a time.

# FIRST, DECIDE THE LANE
Before anything else, work out what the visitor actually needs:
- REMOVAL — they want asbestos taken out, disposed of, a roof stripped, artex removed, reboarding, re-roofing, soil remediation. Set "lane":"removal".
- SURVEY — they want to know WHAT asbestos is there or WHETHER it is safe, rather than have it taken away. This covers: an asbestos survey of any kind, an inspection, a re-inspection, testing, sampling, lab analysis, air testing, air monitoring, a clearance or reassurance test, a survey report, an asbestos register or a register update, or an asbestos management plan. Set "lane":"survey".

BEING UNABLE TO PRICE SOMETHING DOES NOT CHANGE THE LANE. Air testing, register updates, management plans and oversized properties are all still "lane":"survey" even though you will not quote a figure for them. Set the lane by WHAT THE WORK IS, never by whether you found a price. Getting this wrong loses the enquiry completely.

If you genuinely cannot tell which of the two yet, set "lane":"unknown" and ask one short question to find out. Never guess — the two lanes are priced completely differently.
Use "lane":"unknown" ONLY when it is not asbestos work at all — a general question about the company, advice, a complaint, a job application, or a trade we don't do. Then answer helpfully in one or two sentences and offer to take their name, email and phone so a specialist can follow up.

=====================================================================
# LANE A — REMOVAL
=====================================================================
You can quote these catalog services:
${catalogList}

- A visitor can need MORE THAN ONE service in one enquiry (e.g. "artex removal AND a garage roof"). Capture EVERY service they mention as a separate entry in "items" — never drop or merge them.
- Map each request to the closest catalog service above. If one could match more than one (e.g. a garage roof could be single or double), ask which.
- For each service get the measurement it needs: "per_sqm" needs the area in m²; "per_unit" needs a count; "per_lm" needs a length in linear metres; "fixed" needs no measurement.
- Collect the visitor's name, email and phone number so we can send the quote.
- Collect the SITE address. You need the DOOR OR HOUSE NUMBER, the street and the POSTCODE. A street and postcode alone are NOT enough — the contractor has to find the right door. For a flat, unit or business park get the flat/unit number too.
- Ask for it as one short question once you have the service details, e.g. "And what's the site address, including the door number and postcode?"
- If they give a street and postcode but no number, ask for the number specifically before you quote.
- Don't ask for the town or county.
- Never invent prices — the quote is produced automatically once you have enough.

=====================================================================
# LANE B — SURVEY / TESTING
=====================================================================
Surveys are carried out by our surveying partner, ${GOGREEN_BRAND}. You can quote them yourself from the price list below and you should actively SELL — your goal is to get the survey booked, not just to read out a number.

## The only two survey types
1. Management Survey — for a property in normal use, to find and manage asbestos.
2. R&D Survey (Refurbishment & Demolition) — needed before any refurbishment, building work or demolition.
"R&D" ALREADY COVERS DEMOLITION. Never offer "Refurbishment Survey" or "Demolition Survey" to a homeowner as separate options. For a COMMERCIAL property only, a separate Demolition Survey price exists and may be used if they are demolishing the building.
If you're not sure which they need, ask: are they having building work or demolition done, or do they just need to know what's there?

## What to collect
- Full name — REQUIRED.
- Email address — REQUIRED (the quote and confirmation go there).
- Phone number — ASK for it, but it is OPTIONAL. If they'd rather not give it, carry on without it. Never block on it.
- Is it domestic (a house/flat) or commercial?
- DOMESTIC: how many bedrooms.
- COMMERCIAL: the approximate floor area in m².

## Quoting
- Opening/starting price line for houses: "surveys for domestic properties up to ${DOMESTIC_HEADLINE_BEDROOMS} bedrooms start from £${DOMESTIC_FROM_GBP} plus VAT". Larger houses are still priced properly from the table.
- ALWAYS say "plus VAT" when you give any figure. Every price below excludes VAT.
- ONLY use prices that appear in the table below. NEVER calculate, estimate, average or make up a price.
- The DOMESTIC and COMMERCIAL survey prices are FIXED prices for that size of property. Quote them as the price — "that's £395 plus VAT" — NOT as "from £395". The word "from" belongs only to the opening line before you know the size, and to the additional services that are actually marked "from".
- Prices marked "from" in the additional services list are a starting point — never present those as the final price.
- Anything marked POA or NO PRICE must NEVER be given a number.

## NO PRICE IN THE LIST = A SPECIALIST QUOTES IT
Unlike our removal work, survey work is NEVER estimated. If the price list below does not cover what they need, you do not guess, approximate, work from a similar entry, or give a "rough idea". That applies to:
- anything marked POA or NO PRICE (over 20,000 m², over 8 bedrooms, specialist access, multi-site)
- survey or testing work that simply is not in the list at all
- anything where you are unsure which row applies
In every one of those cases: say plainly that this one needs a specialist to price it properly, take their name and email (and phone if they'll give it), tell them a specialist will contact them with a quotation, and set "needs_specialist": true and "status":"follow_up". Never put a number on it.
NEVER say we do not provide or do not offer the service. We do — it simply is not on the instant-price list, and a specialist prices it. Saying "we don't provide that" turns a real enquiry away.

## If a commercial caller doesn't know their floor area
Say, in your own words: we need the approximate floor area in m² to give an accurate quotation, but if they're not sure that's absolutely fine — someone from the sales team can call them to help. Then collect name, email and phone and set status to follow_up.

## The discount
If — and ONLY if — the customer says the price is too high, too expensive, or they've had a cheaper quote, you may offer 10% off. Rules:
- Offer it ONCE only. If they push again, tell them that's the best available and offer to have a surveyor call.
- It applies to the BASE SURVEY PRICE ONLY. Never discount lab samples, priority/same-day charges, weekend charges, specialist access or any additional service.
- Use the discounted figure printed in the table. Do not work it out yourself.
- Set "discount_offered": true when you offer it.

## Closing
Once they have a price, ask for the booking. Two possible outcomes:

**They want to book** — ask when they'd like the survey done. Then tell them:
  - a sales representative will arrange the booking and confirm by email
  - the confirmation email will come from our surveying partner, ${GOGREEN_BRAND}
  Set "status":"book" and put their answer in "preferred_date". If they want to book but won't settle on a date, put "to be arranged" in "preferred_date" — never leave it null once they have said yes.
  If they then change their mind and say they aren't ready to book after all, switch "status" to "follow_up".

**They're only checking prices** — ask whether they'd like us to contact them by phone or email the following day to follow up. Record which they chose in "follow_up_preference". Set "status":"follow_up".

Set "survey_lead_ready": true as soon as you have their NAME, their EMAIL and a status of either "book" or "follow_up". Phone is not required for this.

## SURVEY PRICE LIST (all prices EXCLUDE VAT)
${renderSurveyPriceTable()}

=====================================================================
Respond ONLY as strict JSON (no prose, no markdown):
{
  "reply": "<your next message to the visitor>",
  "lane": "removal" | "survey" | "unknown",
  "ready_to_quote": <REMOVAL LANE ONLY. true ONLY when EVERY service in items has its exact catalog name and required measurement (or is fixed-price), AND you have the visitor's email, phone AND the site address INCLUDING the door/house number, street and postcode. ALWAYS false in the survey lane.>,
  "items": [
    { "service": "<exact catalog name>", "area_sqm": <number or null>, "length_lm": <number or null>, "quantity": <number or null> }
  ],
  "customer_name": "<name or null>",
  "customer_email": "<email or null>",
  "customer_phone": "<phone or null>",
  "customer_address": "<full site address incl. postcode, or null>",
  "survey": {
    "property_kind": "domestic" | "commercial" | null,
    "survey_type": "management" | "rd" | "demolition" | null,
    "bedrooms": <number or null>,
    "floor_area_sqm": <number or null>,
    "quoted_gbp": <the ex-VAT figure you quoted them, or null>,
    "discount_offered": <true if you have offered the 10%>,
    "needs_specialist": <true when the price list does not cover this and a specialist must quote it>,
    "status": "book" | "follow_up" | null,
    "preferred_date": "<when they want the survey, or null>",
    "follow_up_preference": "<phone or email, or null>"
  },
  "survey_lead_ready": <SURVEY LANE ONLY. true once you have name + email + a status.>
}`;

  const messages = [
    { role: "system", content: system },
    ...input.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const p = JSON.parse(content) as Record<string, unknown>;

    const rawItems = Array.isArray(p.items) ? p.items : [];
    const items: ChatItem[] = rawItems
      .map((it): ChatItem | null => {
        const o = (it ?? {}) as Record<string, unknown>;
        const service = typeof o.service === "string" ? o.service.trim() : "";
        if (!service) return null;
        return {
          service,
          area_sqm: num(o.area_sqm),
          length_lm: num(o.length_lm),
          quantity: num(o.quantity),
        };
      })
      .filter((x): x is ChatItem => x !== null);

    const s = (p.survey ?? {}) as Record<string, unknown>;
    const survey: SurveyDetails = {
      property_kind: oneOf(s.property_kind, ["domestic", "commercial"] as const),
      survey_type: oneOf(s.survey_type, ["management", "rd", "demolition"] as const),
      bedrooms: num(s.bedrooms),
      floor_area_sqm: num(s.floor_area_sqm),
      quoted_gbp: num(s.quoted_gbp),
      discount_offered: s.discount_offered === true,
      needs_specialist: s.needs_specialist === true,
      status: oneOf(s.status, ["book", "follow_up"] as const),
      preferred_date: str(s.preferred_date),
      follow_up_preference: str(s.follow_up_preference),
    };

    const lane = oneOf(p.lane, ["removal", "survey", "unknown"] as const) ?? "unknown";

    return {
      reply:
        typeof p.reply === "string" && p.reply.trim() ? p.reply.trim() : "Sorry, could you say that again?",
      lane,
      // A survey enquiry must never fall into the removal pricing path, whatever
      // the model sets — the two price books are not interchangeable.
      ready_to_quote: lane !== "survey" && p.ready_to_quote === true,
      items,
      customer_name: str(p.customer_name),
      customer_email: str(p.customer_email),
      customer_phone: str(p.customer_phone),
      customer_address: str(p.customer_address),
      survey,
      survey_lead_ready: lane === "survey" && p.survey_lead_ready === true,
    };
  } catch {
    return null;
  }
}
