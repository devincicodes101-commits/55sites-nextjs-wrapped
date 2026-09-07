import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Allow the AI chat + lead form to be embedded on other sites (e.g. the Base44
// "DomainCraft" city sites) by permitting cross-origin calls to our /api routes.
// The caller's origin is reflected back so any embedding site is accepted.
function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "*";
  const headers = corsHeaders(origin);

  // Preflight — answer the browser's OPTIONS check before the real request.
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }

  const res = NextResponse.next();
  for (const [key, value] of Object.entries(headers)) res.headers.set(key, value);
  return res;
}

// Only touch the API routes; the pages render normally.
export const config = { matcher: "/api/:path*" };
