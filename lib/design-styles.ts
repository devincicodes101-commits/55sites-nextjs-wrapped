import type { DesignStyle } from "./types";

/**
 * Maps each city (lowercase) to the HTML design style from DomainCraft.
 * getSiteConfig() attaches this so every page can switch layout.
 */
const BY_CITY: Record<string, DesignStyle> = {
  // CLASSIC
  bath: "classic",
  canterbury: "classic",
  coventry: "classic",
  gloucester: "classic",
  lichfield: "classic",
  "newcastle upon tyne": "classic",
  portsmouth: "classic",
  southampton: "classic",
  wakefield: "classic",
  york: "classic",

  // BOLD
  birmingham: "bold",
  carlisle: "bold",
  derby: "bold",
  hereford: "bold",
  lincoln: "bold",
  norwich: "bold",
  preston: "bold",
  "southend-on-sea": "bold",
  wells: "bold",

  // SIDEBAR
  bradford: "sidebar",
  chelmsford: "sidebar",
  doncaster: "sidebar",
  "kingston upon hull": "sidebar",
  liverpool: "sidebar",
  nottingham: "sidebar",
  ripon: "sidebar",
  "st albans": "sidebar",
  westminster: "sidebar",

  // CARD
  "brighton & hove": "card",
  chester: "card",
  durham: "card",
  lancaster: "card",
  london: "card",
  oxford: "card",
  salford: "card",
  "stoke-on-trent": "card",
  winchester: "card",

  // BANNER
  bristol: "banner",
  chichester: "banner",
  ely: "banner",
  leeds: "banner",
  manchester: "banner",
  peterborough: "banner",
  salisbury: "banner",
  sunderland: "banner",
  wolverhampton: "banner",

  // CLEAN
  cambridge: "clean",
  colchester: "clean",
  exeter: "clean",
  leicester: "clean",
  "milton keynes": "clean",
  plymouth: "clean",
  sheffield: "clean",
  truro: "clean",
  worcester: "clean",
};

export function getDesignStyleForCity(city: string): DesignStyle {
  const key = city.trim().toLowerCase();
  return BY_CITY[key] ?? "classic";
}
