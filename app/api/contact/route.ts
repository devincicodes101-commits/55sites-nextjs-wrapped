import { NextResponse } from "next/server";
import { createQuoteInBase44, isBase44Configured } from "@/lib/base44";
import { getSiteConfig } from "@/lib/sites/registry";
import { getSupabaseClient } from "@/lib/supabase";

function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { firstName, lastName, name, phone, email, service, message } = body as Record<
    string,
    unknown
  >;

  if (!phone || typeof phone !== "string") {
    return NextResponse.json({ error: "Phone is required" }, { status: 400 });
  }

  const { city, domain } = getSiteConfig();

  const first_name = (typeof firstName === "string" ? firstName : null) ??
    (typeof name === "string" ? name : null);
  const last_name = typeof lastName === "string" ? lastName : null;
  const emailValue = typeof email === "string" ? email : null;
  const serviceValue = typeof service === "string" ? service : null;
  const messageValue = typeof message === "string" ? message : null;

  const useBase44 = isBase44Configured();
  const useSupabase = isSupabaseConfigured();

  if (!useBase44 && !useSupabase) {
    console.error("Contact form: neither Base44 nor Supabase is configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  try {
    if (useBase44) {
      await createQuoteInBase44({
        firstName: first_name,
        lastName: last_name,
        phone,
        email: emailValue,
        service: serviceValue,
        message: messageValue,
        city,
        domain,
      });
    }

    if (useSupabase) {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from("contact_submissions").insert({
        city,
        domain,
        first_name,
        last_name,
        phone,
        email: emailValue,
        service: serviceValue,
        message: messageValue,
      });

      if (error) {
        // If Base44 already saved the lead, don't fail the user — log the backup miss.
        if (useBase44) {
          console.error("Supabase backup insert failed after Base44 success", error);
        } else {
          console.error("Supabase insert failed", error);
          return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact form submission error", err);
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
  }
}
