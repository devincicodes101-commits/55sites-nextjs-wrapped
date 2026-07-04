import type { ContentBlock, SiteConfig } from "./types";

// Every coverage-area page shares the same structure: a local intro, a
// service-by-service breakdown, a "why choose us" list, and a closing CTA.
// Rather than hand-writing near-duplicate copy for every town, we generate
// the boilerplate from the area's name + one-line blurb and the site's own
// service list. Swap in bespoke paragraphs later for any area that deserves
// unique copy - this just guarantees every area starts from a consistent,
// complete page.
export function buildAreaContent(
  areaName: string,
  blurb: string,
  config: SiteConfig
): ContentBlock[] {
  const { city, phoneDisplay } = config;

  const infoCards = config.services
    .filter((s) => s.slug !== "cost")
    .slice(0, 7)
    .map((s) => ({
      icon: s.icon,
      title: `${s.title} in ${areaName}`,
      text: `${s.shortDescription} Available to all ${areaName} properties as part of our ${city} service network.`,
    }));

  return [
    { type: "p", text: blurb },
    {
      type: "callout",
      tone: "info",
      text: `📍 ${areaName} is covered as part of our ${city} service network. We provide same-day site visits, emergency callouts, and the full range of asbestos services to all ${areaName} addresses.`,
    },
    { type: "h2", text: `Our Full Range of Asbestos Services in ${areaName}` },
    { type: "infoCards", items: infoCards },
    { type: "h2", text: `Why Choose Us for Asbestos Work in ${areaName}?` },
    {
      type: "ul",
      items: [
        `Local expertise: we operate throughout ${config.region} and understand the property stock in ${areaName} and the surrounding area.`,
        `HSE licensed: our full HSE licence covers all categories of licensed asbestos removal work in ${areaName} and across ${config.region}.`,
        `UKAS-accredited analysis: all samples taken at ${areaName} properties are analysed in our UKAS-accredited laboratory to ISO 17025.`,
        `Transparent pricing: every quote for ${areaName} work is fixed-price with a full itemised breakdown - no hidden charges.`,
        `Fast response: same-day and emergency response available across ${areaName} and all surrounding areas.`,
        `Full documentation: waste consignment notes, clearance certificates, and survey reports provided for every ${areaName} project.`,
      ],
    },
    {
      type: "callout",
      tone: "warning",
      text: `⚠️ If asbestos has been accidentally disturbed at a ${areaName} property, call us immediately on ${phoneDisplay}. Our 24/7 emergency team covers ${areaName} and will mobilise within hours.`,
    },
    { type: "h2", text: `Get a Free Quote for Your ${areaName} Property` },
    {
      type: "p",
      text: `Contact our ${city} team today for a free, no-obligation site visit and fixed-price quotation for any asbestos work in ${areaName}. We respond to all ${areaName} enquiries within 2 hours during business hours.`,
    },
  ];
}
