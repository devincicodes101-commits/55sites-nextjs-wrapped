/**
 * Survey/testing leads are handled by our partner GoGreen Surveyors, not by us.
 * This module decides which lane an enquiry is in and hands the survey ones over
 * by email. Nothing here writes to the CRM — the client was explicit that the
 * CRM stays for the removal business until they start using it for surveying.
 */

/**
 * The live destination, per the client's brief. Deliberately NOT the built-in
 * default: GOGREEN_LEADS_EMAIL has to be set explicitly, so that testing on a
 * staging site cannot put invented customers into a partner's support inbox.
 * Until it is set, leads go to our own notification address with a subject that
 * makes the misconfiguration impossible to miss.
 */
export const GOGREEN_LIVE_EMAIL = "support@gogreensurveyors.co.uk";

export const GOGREEN_BRAND = "GoGreen Surveyors";

function resolveRecipient(): { to: string | null; routed: boolean } {
  const configured = process.env.GOGREEN_LEADS_EMAIL?.trim();
  if (configured) return { to: configured, routed: true };
  // Not configured yet. Send it to ourselves rather than dropping it — a lead
  // that fails silently is worse than one that lands in the wrong inbox with a
  // subject line explaining why. Falls back to the sending address itself so
  // there is always somewhere to deliver.
  const from = process.env.QUOTE_FROM_EMAIL?.trim() || "";
  const fallback =
    process.env.LEADS_NOTIFY_EMAIL?.trim() || from.match(/<([^>]+)>/)?.[1] || from;
  return { to: fallback && fallback.includes("@") ? fallback : null, routed: false };
}

/** Where survey leads are actually going right now. */
export const GOGREEN_EMAIL = resolveRecipient().to ?? GOGREEN_LIVE_EMAIL;

/**
 * Service slugs that belong to GoGreen rather than the removal business.
 *
 * Note "demolition" is NOT here: that service is demolition *works*, which we
 * carry out. A demolition *survey* is part of R&D and is reached through the
 * survey lane. Two different things that read almost the same.
 */
export const SURVEY_SERVICE_SLUGS = new Set(["survey", "testing", "air-testing"]);

const SURVEY_TITLE_PATTERNS = [
  /asbestos\s+survey/i,
  /asbestos\s+testing/i,
  /air\s+testing/i,
  /air\s+monitoring/i,
  /\bsurvey\b/i,
  /\bsampling\b/i,
  /management\s+survey/i,
  /refurbishment\s*(&|and)\s*demolition\s+survey/i,
  /\br\s*&\s*d\s+survey/i,
];

/**
 * Matched on the service title, because that is what the form posts — the slug
 * never reaches the API. Removal services are checked first so "Soil
 * Remediation & Testing" (remediation works) is not dragged into the survey lane
 * by the word "testing".
 */
const REMOVAL_TITLE_PATTERNS = [
  // A "free survey" is the free pre-removal site visit our own team makes, not a
  // paid GoGreen survey — GoGreen's surveys all cost money. Routing these to the
  // partner would hand away removal jobs the client wants to win themselves.
  /\bfree\b[^.]*\bsurvey\b/i,
  /\bsurvey\b[^.]*\bfree\b/i,
  // Call-to-action button labels, not services the visitor chose.
  /^\s*(get|book|request|claim)\b[^.]*\b(quote|survey|visit|callback)\s*$/i,
  /removal/i,
  /re-?roofing/i,
  /reboard/i,
  /plastering/i,
  /disposal/i,
  /muck\s*away/i,
  /remediation/i,
  /demolition\s+services/i,
  /transparent\s+pricing/i,
];

export function isSurveyService(serviceTitle: string): boolean {
  const s = (serviceTitle || "").trim();
  if (!s) return false;
  if (REMOVAL_TITLE_PATTERNS.some((re) => re.test(s))) return false;
  return SURVEY_TITLE_PATTERNS.some((re) => re.test(s));
}

/** UK date+time for the subject line, e.g. "20/09/2026 14:35". */
export function ukTimestamp(d = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(d)
    .replace(",", "");
}

function esc(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.QUOTE_FROM_EMAIL);
}

/** Renders "Label: value" rows as both HTML and plain text from one source. */
function renderBody(rows: Array<[string, string]>, transcript?: string) {
  const text = rows
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n")
    .concat(transcript ? `\n\nChat Transcript:\n${transcript}` : "");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#1f2937;line-height:1.5">
    ${rows
      .map(
        ([k, v]) =>
          `<p style="margin:0 0 6px"><strong>${esc(k)}:</strong> ${esc(v) || "&mdash;"}</p>`,
      )
      .join("")}
    ${
      transcript
        ? `<p style="margin:18px 0 6px"><strong>Chat Transcript:</strong></p>
           <div style="white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;font-size:13px">${esc(
             transcript,
           )}</div>`
        : ""
    }
  </div>`;

  return { html, text };
}

async function sendToGoGreen(input: {
  subject: string;
  html: string;
  text: string;
}): Promise<{ sent: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { sent: false, error: "Email not configured (RESEND_API_KEY / QUOTE_FROM_EMAIL)" };
  }
  const { to, routed } = resolveRecipient();
  if (!to) {
    return {
      sent: false,
      error: "No survey lead recipient — set GOGREEN_LEADS_EMAIL (or LEADS_NOTIFY_EMAIL)",
    };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.QUOTE_FROM_EMAIL!,
        to: [to],
        subject: routed
          ? input.subject
          : `[NOT ROUTED — set GOGREEN_LEADS_EMAIL] ${input.subject}`,
        html: input.html,
        text: routed
          ? input.text
          : `This survey lead was NOT sent to ${GOGREEN_BRAND}, because GOGREEN_LEADS_EMAIL is not set. It should go to ${GOGREEN_LIVE_EMAIL}.\n\n---\n\n${input.text}`,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) return { sent: false, error: data.message || `Resend error ${res.status}` };
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * A survey lead exists nowhere except this email, so if it fails to send the
 * lead is simply gone. Copy it to our own notification inbox as a backstop —
 * that is a mail copy, not a CRM record, so it stays inside what was agreed.
 */
async function alertUsThatHandoverFailed(subject: string, text: string, error?: string) {
  const notifyTo = process.env.LEADS_NOTIFY_EMAIL?.trim();
  if (!notifyTo || !isEmailConfigured()) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.QUOTE_FROM_EMAIL!,
      to: [notifyTo],
      subject: `[NOT DELIVERED to ${GOGREEN_BRAND}] ${subject}`,
      text: `This survey lead could not be delivered to ${GOGREEN_EMAIL} and needs forwarding by hand.\n\nReason: ${
        error || "unknown"
      }\n\n---\n\n${text}`,
    }),
  }).catch(() => {});
}

/** Website Quote/Contact form — a survey service was selected. */
export async function sendSurveyFormLead(input: {
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  service: string;
  message: string | null;
  city: string;
  domain: string;
}): Promise<{ sent: boolean; error?: string }> {
  const subject = `New Lead - Web - ${ukTimestamp()}`;
  const { html, text } = renderBody([
    ["Customer Name", input.customerName],
    ["Type", "Asbestos Survey Request"],
    ["Customer Email", input.customerEmail || ""],
    ["Customer Phone", input.customerPhone || ""],
    ["Service Selected", input.service],
    ["Customer Message", input.message || ""],
    ["Website", `${input.domain} (${input.city})`],
  ]);

  const result = await sendToGoGreen({ subject, html, text });
  if (!result.sent) await alertUsThatHandoverFailed(subject, text, result.error);
  return result;
}

export type SurveyLeadStatus = "book" | "follow_up";

/** Chatbot — the visitor wants to book, or wants a follow-up tomorrow. */
export async function sendSurveyChatLead(input: {
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  status: SurveyLeadStatus;
  preferredDate: string | null;
  followUpPreference: string | null;
  quotedSummary: string | null;
  transcript: string;
  city: string;
  domain: string;
}): Promise<{ sent: boolean; error?: string }> {
  const subject = `New Lead - Chat - ${ukTimestamp()}`;
  const rows: Array<[string, string]> = [
    ["Customer Name", input.customerName],
    ["Email", input.customerEmail],
    ["Phone", input.customerPhone || ""],
    [
      "Status",
      input.status === "book" ? "Customer wants to book" : "Follow-up tomorrow",
    ],
  ];
  if (input.status === "book") {
    rows.push(["Preferred Survey Date", input.preferredDate || "not given"]);
  } else {
    rows.push(["Follow-up Preference", input.followUpPreference || "not given"]);
  }
  if (input.quotedSummary) rows.push(["Quoted", input.quotedSummary]);
  rows.push(["Website", `${input.domain} (${input.city})`]);

  const { html, text } = renderBody(rows, input.transcript);

  const result = await sendToGoGreen({ subject, html, text });
  if (!result.sent) await alertUsThatHandoverFailed(subject, text, result.error);
  return result;
}
