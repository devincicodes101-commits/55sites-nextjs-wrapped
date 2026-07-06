import { NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/sites/registry";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { firstName, lastName, name, phone, email, service, message } = body as Record<string, unknown>;

  if (!phone || typeof phone !== "string") {
    return NextResponse.json({ error: "Phone is required" }, { status: 400 });
  }

  const { city, domain } = getSiteConfig();

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("contact_submissions").insert({
      city,
      domain,
      first_name: (firstName as string) ?? (name as string) ?? null,
      last_name: (lastName as string) ?? null,
      phone,
      email: (email as string) ?? null,
      service: (service as string) ?? null,
      message: (message as string) ?? null,
    });

    if (error) {
      console.error("Supabase insert failed", error);
      return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact form submission error", err);
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
}
