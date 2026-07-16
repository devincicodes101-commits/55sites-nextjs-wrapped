/**
 * Feature flag: survey upload → Gemini quote → email → CRM.
 * Enable with SURVEY_QUOTE_PILOT_ENABLED=true.
 * SURVEY_QUOTE_PILOT_CITIES=* (or empty) = all domains; otherwise comma-separated city names.
 */
export function isSurveyQuotePilotEnabled(city: string): boolean {
  if (process.env.SURVEY_QUOTE_PILOT_ENABLED !== "true") return false;
  const raw = (process.env.SURVEY_QUOTE_PILOT_CITIES ?? "").trim();
  if (!raw || raw === "*") return true;
  const cities = raw
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
  return cities.includes(city.trim().toLowerCase());
}
