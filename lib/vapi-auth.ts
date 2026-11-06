import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/**
 * Checks the `x-vapi-secret` header against VAPI_SERVER_SECRET. Returns the 401 to
 * send, or null if the request may continue.
 *
 * With no secret configured it warns and allows the request, so deploying this
 * before the secret is set doesn't break live calls.
 */
export function rejectUnlessFromVapi(request: Request): NextResponse | null {
  const secret = process.env.VAPI_SERVER_SECRET?.trim();
  if (!secret) {
    console.warn(`[vapi-auth] VAPI_SERVER_SECRET is not set; allowing ${new URL(request.url).pathname} without a check`);
    return null;
  }

  const given = request.headers.get("x-vapi-secret") ?? "";
  if (timingSafeEqual(digest(given), digest(secret))) return null;

  console.warn(`[vapi-auth] rejected ${new URL(request.url).pathname}: ${given ? "wrong secret" : "no secret sent"}`);
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
