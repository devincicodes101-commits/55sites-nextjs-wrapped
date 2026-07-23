import { NextResponse } from "next/server";
import {
  createQuoteInBase44,
  isBase44Configured,
  splitPersonName,
  withTimeout,
} from "@/lib/base44";
import { isEmailConfigured, sendLeadAlertEmail } from "@/lib/send-quote-email";
import { getSiteConfig } from "@/lib/sites/registry";
import { getSupabaseClient } from "@/lib/supabase";

const CRM_TIMEOUT_MS = 12_000;

function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function asOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    firstName,
    lastName,
    name,
    phone,
    email,
    service,
    details,
    message,
    source,
  } = body as Record<string, unknown>;

  if (!phone || typeof phone !== "string" || !phone.trim()) {
    return NextResponse.json({ error: "Phone is required" }, { status: 400 });
  }

  if (!service || typeof service !== "string" || !service.trim()) {
    return NextResponse.json({ error: "Service is required" }, { status: 400 });
  }

  const { city, domain } = getSiteConfig();

  const explicitFirst = asOptionalString(firstName);
  const explicitLast = asOptionalString(lastName);
  const fromFullName = splitPersonName(asOptionalString(name));

  const first_name = explicitFirst ?? fromFullName.firstName;
  // Only use split last-name when the form sent a single full-name field.
  const last_name = explicitLast ?? (explicitFirst ? null : fromFullName.lastName);
  const emailValue = asOptionalString(email);
  const serviceValue = service.trim();
  const detailsValue = asOptionalString(details) ?? asOptionalString(message);
  const leadSource = asOptionalString(source) ?? "website";
  const phoneValue = phone.trim();

  if (!first_name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const useBase44 = isBase44Configured();
  const useSupabase = isSupabaseConfigured();
  const useEmailFallback = isEmailConfigured();

  if (!useBase44 && !useSupabase && !useEmailFallback) {
    console.error("Contact form: neither Base44, Supabase, nor email is configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  let savedToCrm = false;
  let crmError: string | null = null;

  try {
    if (useBase44) {
      try {
        await withTimeout(
          createQuoteInBase44({
            firstName: first_name,
            lastName: last_name,
            phone: phoneValue,
            email: emailValue,
            service: serviceValue,
            details: detailsValue,
            city,
            domain,
            lead_source: leadSource,
            status: "new",
          }),
          CRM_TIMEOUT_MS,
          "Base44 Lead.create",
        );
        savedToCrm = true;
      } catch (err) {
        crmError = err instanceof Error ? err.message : String(err);
        console.error("Base44 contact lead failed", err);
      }
    }

    if (useSupabase) {
      try {
        const supabase = getSupabaseClient();
        const result = await withTimeout(
          Promise.resolve(
            supabase.from("contact_submissions").insert({
              city,
              domain,
              first_name,
              last_name,
              phone: phoneValue,
              email: emailValue,
              service: serviceValue,
              details: detailsValue,
              message: detailsValue,
            }),
          ),
          CRM_TIMEOUT_MS,
          "Supabase contact insert",
        );

        if (result.error) {
          console.error("Supabase contact insert failed", result.error);
        } else {
          savedToCrm = true;
        }
      } catch (err) {
        console.error("Supabase contact insert error", err);
      }
    }

    // Email fallback when CRM write failed/hung — keeps sidebar callbacks from being lost.
    if (!savedToCrm && useEmailFallback) {
      const alert = await sendLeadAlertEmail({
        firstName: first_name,
        lastName: last_name,
        phone: phoneValue,
        email: emailValue,
        service: serviceValue,
        details: detailsValue,
        city,
        domain,
        source: leadSource,
      });
      if (!alert.sent) {
        console.error("Lead alert email failed", alert.error, crmError);
        return NextResponse.json(
          {
            error: "Failed to save submission",
            detail: process.env.NODE_ENV === "development" ? crmError || alert.error : undefined,
          },
          { status: 500 },
        );
      }
      console.warn("Contact lead saved via email fallback after CRM failure", crmError);
    }

    if (!savedToCrm && !useEmailFallback) {
      return NextResponse.json(
        {
          error: "Failed to save submission",
          detail: process.env.NODE_ENV === "development" ? crmError : undefined,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, crmSaved: savedToCrm });
  } catch (err) {
    console.error("Contact form submission error", err);
    const messageText = err instanceof Error ? err.message : "Failed to save submission";
    return NextResponse.json(
      {
        error: "Failed to save submission",
        detail: process.env.NODE_ENV === "development" ? messageText : undefined,
      },
      { status: 500 },
    );
  }
}
