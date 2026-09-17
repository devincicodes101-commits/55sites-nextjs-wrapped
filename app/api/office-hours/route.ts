import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * "Is the office open?" for the phone agent.
 *
 * The 0800 goes straight to Vapi, so there is no telephony-level business-hours
 * routing in front of it — the assistant asks this at the start of every call and
 * transfers the caller to a human when the team is in.
 *
 * Hours are Europe/London so BST is handled without us tracking the clock change.
 */
const OPEN_HOUR = Number(process.env.OFFICE_OPEN_HOUR ?? 9); // 9am
const CLOSE_HOUR = Number(process.env.OFFICE_CLOSE_HOUR ?? 17); // 5pm
// Days the office is staffed at all. 0 = Sunday … 6 = Saturday.
const OPEN_DAYS = (process.env.OFFICE_OPEN_DAYS ?? "1,2,3,4,5,6")
  .split(",")
  .map((d) => Number(d.trim()))
  .filter((d) => Number.isFinite(d));

function londonNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    weekday: dayNames.indexOf(get("weekday")),
    hour: Number(get("hour")),
    clock: `${get("hour")}:${get("minute")}`,
  };
}

function officeState() {
  const { weekday, hour, clock } = londonNow();
  const isOpen = OPEN_DAYS.includes(weekday) && hour >= OPEN_HOUR && hour < CLOSE_HOUR;
  return { isOpen, clock, weekday };
}

/** Vapi reads `result` aloud to the model, so it must say what to DO. */
function spokenResult(isOpen: boolean, clock: string) {
  return isOpen
    ? `OPEN. The team are in the office right now (${clock} UK time) and they handle daytime enquiries themselves. Do NOT quote and do NOT ask for measurements or the site address. Tell the caller the team are in and someone will call them straight back, take only their full name, phone number and a short description of the work, then call send_quote with those details and NO services so the lead is logged. Then end the call politely.`
    : `CLOSED. The office is closed right now (${clock} UK time). Handle the call yourself: take their details and produce the quotation as normal.`;
}

function respond(toolCallId: string | null) {
  const { isOpen, clock } = officeState();
  const spoken = spokenResult(isOpen, clock);
  if (toolCallId) {
    return NextResponse.json({ results: [{ toolCallId, result: spoken }] });
  }
  return NextResponse.json({
    isOpen,
    ukTime: clock,
    openHour: OPEN_HOUR,
    closeHour: CLOSE_HOUR,
    openDays: OPEN_DAYS,
    message: spoken,
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    // Vapi sometimes posts an empty body; the answer doesn't depend on input.
  }
  const message = body.message as { toolCalls?: Array<{ id?: string }> } | undefined;
  const id = Array.isArray(message?.toolCalls) ? message!.toolCalls[0]?.id : undefined;
  return respond(typeof id === "string" ? id : null);
}

/** Plain GET so the hours can be checked in a browser. */
export async function GET() {
  return respond(null);
}
