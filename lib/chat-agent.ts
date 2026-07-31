import type { CatalogService } from "./catalog-pricing";

/**
 * Website AI sales chat agent (brain). Converses with a site visitor, identifies
 * the catalog service they need and the required measurement, and signals when
 * it has enough to produce a quote. Pricing itself is done deterministically in
 * code (assessEnquiry) — the model only gathers, never invents prices.
 *
 * Uses OPENAI_API_KEY.
 */
export function isChatConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ChatTurn = {
  reply: string;
  ready_to_quote: boolean;
  service: string;
  area_sqm: number | null;
  length_lm: number | null;
  quantity: number | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
};

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
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

  const system = `You are a friendly, professional sales assistant for ${input.businessName}, a UK HSE-licensed asbestos removal company serving ${input.city}. Your goal is to help the visitor get an instant fixed-price quote in a short, natural chat.

You can quote these catalog services:
${catalogList}

How to run the conversation:
- Greet briefly and find out which service they need.
- Map their words to the closest catalog service above. If it could match more than one (e.g. a garage roof could be single or double), ask which.
- Ask for the measurement that service needs: a "per_sqm" service needs the area in m²; a "per_unit" service needs a count; a "per_lm" service needs a length in linear metres; a "fixed" service needs no measurement.
- Also collect the visitor's name, email, AND phone number so we can send the quote and follow up.
- Keep replies short, warm, and helpful — one question at a time. Never invent prices; a quote is produced automatically once you have enough.
- If they ask something you can't price (survey, testing, demolition, general enquiry), collect their name, email + phone and tell them a specialist will follow up.

Respond ONLY as strict JSON (no prose, no markdown):
{
  "reply": "<your next message to the visitor>",
  "ready_to_quote": <true ONLY when you know the exact catalog service, its required measurement (or it's fixed-price), AND the visitor's email AND phone>,
  "service": "<exact catalog name from the list, or ''>",
  "area_sqm": <number or null>,
  "length_lm": <number or null>,
  "quantity": <number or null>,
  "customer_name": "<name or null>",
  "customer_email": "<email or null>",
  "customer_phone": "<phone or null>"
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

    return {
      reply: typeof p.reply === "string" && p.reply.trim() ? p.reply.trim() : "Sorry, could you say that again?",
      ready_to_quote: p.ready_to_quote === true,
      service: typeof p.service === "string" ? p.service.trim() : "",
      area_sqm: num(p.area_sqm),
      length_lm: num(p.length_lm),
      quantity: num(p.quantity),
      customer_name:
        typeof p.customer_name === "string" && p.customer_name.trim() ? p.customer_name.trim() : null,
      customer_email:
        typeof p.customer_email === "string" && p.customer_email.trim() ? p.customer_email.trim() : null,
      customer_phone:
        typeof p.customer_phone === "string" && p.customer_phone.trim() ? p.customer_phone.trim() : null,
    };
  } catch {
    return null;
  }
}
