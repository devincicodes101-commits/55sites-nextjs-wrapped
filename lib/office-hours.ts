/**
 * Are the team in? Shared by the phone agent's check_office_hours tool and by
 * the quote endpoint, so the answer cannot differ between them.
 *
 * Europe/London, so the clock change is handled without us tracking it.
 */
const OPEN_HOUR = Number(process.env.OFFICE_OPEN_HOUR ?? 9);
const CLOSE_HOUR = Number(process.env.OFFICE_CLOSE_HOUR ?? 17);
const OPEN_DAYS = (process.env.OFFICE_OPEN_DAYS ?? "1,2,3,4,5,6")
  .split(",")
  .map((d) => Number(d.trim()))
  .filter((d) => Number.isFinite(d));

export function officeState(): { isOpen: boolean; clock: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const hour = Number(get("hour"));
  return {
    isOpen: OPEN_DAYS.includes(weekday) && hour >= OPEN_HOUR && hour < CLOSE_HOUR,
    clock: `${get("hour")}:${get("minute")}`,
  };
}

export const OFFICE_HOURS_CONFIG = { OPEN_HOUR, CLOSE_HOUR, OPEN_DAYS };
