/**
 * Make customer-facing copy read naturally. Em/en dashes are a tell-tale sign of
 * AI-written text, so a spaced dash used as a pause becomes a comma and any
 * remaining dash becomes a plain hyphen. Safe on already-clean text.
 */
export function naturalize(text: string): string {
  if (!text) return text;
  return text
    .replace(/\s+[—–]\s+/g, ", ")
    .replace(/[—–]/g, "-")
    .replace(/ ,/g, ",")
    .replace(/,{2,}/g, ",");
}
