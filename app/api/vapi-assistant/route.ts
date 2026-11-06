import { NextResponse } from "next/server";
import { CATALOG_PRICING } from "@/lib/catalog-pricing";
import { buildServiceList, loadVoiceCatalog } from "@/lib/voice-catalog";
import { rejectUnlessFromVapi } from "@/lib/vapi-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vapi's assistant-request webhook: which assistant takes this call, and the live
 * service list for its prompt. If this errors or takes over 7.5 seconds the call
 * doesn't connect, so nothing below may stop it answering.
 */
export async function POST(request: Request) {
  const rejected = rejectUnlessFromVapi(request);
  if (rejected) return rejected;

  // An unreadable body is treated as a call: wrongly answering is harmless, and
  // wrongly not answering drops the caller.
  const body = (await request.json().catch(() => null)) as { message?: { type?: unknown } } | null;
  const type = body?.message?.type;
  if (type && type !== "assistant-request") return NextResponse.json({});

  const assistantId = process.env.VAPI_ASSISTANT_ID?.trim();
  if (!assistantId) {
    console.error("[vapi-assistant] VAPI_ASSISTANT_ID is not set, so this call cannot connect");
    // Vapi speaks `error` to the caller.
    return NextResponse.json({ error: "Sorry, our phone line isn't available right now. Please call back shortly." });
  }

  const started = Date.now();
  let serviceList: string;
  try {
    const catalog = await loadVoiceCatalog();
    serviceList = buildServiceList(catalog.services);
    console.log(`[vapi-assistant] catalog=${catalog.source} services=${catalog.services.length} ms=${Date.now() - started}`);
  } catch (err) {
    console.error("[vapi-assistant] catalog=snapshot, building the list failed:", err);
    serviceList = buildServiceList(CATALOG_PRICING);
  }

  return NextResponse.json({
    assistantId,
    assistantOverrides: { variableValues: { service_list: serviceList } },
  });
}
