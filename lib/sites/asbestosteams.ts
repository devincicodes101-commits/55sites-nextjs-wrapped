import type { SiteConfig } from "../types";
import london from "./london";

// National brand site for asbestosteams.co.uk. It reuses the London site's page
// structure/content but rebrands to the central "Asbestos UK Teams" identity
// with the national sales contact details (the same email/phone used on quotes).
// Deeper body copy can be tailored to national wording later; the priority here
// is that the site runs the standard app (chatbot + lead form + CRM leads) with
// the correct brand + contact details.
const config: SiteConfig = {
  ...london,
  businessName: "Asbestos UK Teams",
  logoLetter: "A",
  city: "the UK",
  region: "Nationwide",
  country: "GB",
  phoneDisplay: "0800 041 8212",
  phoneHref: "tel:08000418212",
  email: "sales@asbestosteams.co.uk",
  domain: "asbestosukteams.co.uk",

  hero: {
    ...london.hero,
    tag: "Nationwide asbestos specialists",
    titleBefore: "Professional",
    titleHighlight: "Asbestos Removal",
    titleAfter: "across the UK",
    subtitle:
      "Safe, certified, and competitively priced asbestos removal, survey, testing, and disposal services across the UK. HSE-licensed operatives, UKAS-accredited laboratory analysis, and a commitment to protecting your property and your health.",
  },

  // National wording — the London site's local sections are rewritten here so the
  // central brand site doesn't show London boroughs, HS2/Crossrail, etc.
  localInfo: {
    tag: "Nationwide Coverage",
    title: "Asbestos Across the UK's Building Stock",
    paragraphs: [
      "Asbestos was used in millions of UK buildings put up before the year 2000, from Victorian terraces and post-war council housing to 1960s tower blocks, factories, schools, and offices. Wherever you are in the country, professional asbestos surveys and removal are essential for homeowners, landlords, developers, and the public sector.",
      "Our teams cover every region of the UK, delivering expert surveys, testing, and licensed removal for all property types. From city-centre commercial units to rural farm buildings, you get the same HSE-licensed, UKAS-accredited standard of service wherever the work is.",
    ],
    facts: [
      {
        label: "National Fact",
        text: "An estimated 6 million tonnes of asbestos still remains in around 1.5 million UK buildings, making safe management and removal a nationwide priority.",
      },
      {
        label: "Why Act Now",
        text: "Any building work, refurbishment, or demolition on a pre-2000 property risks disturbing asbestos. A survey before works begin protects your health and keeps you legally compliant.",
      },
    ],
    calloutText:
      "📊 Around 5,000 people die each year in the UK from past asbestos exposure, more than are killed on the roads, which is why safe, licensed removal matters wherever you are.",
    keywords: [
      "asbestos removal UK",
      "asbestos survey UK",
      "HSE licensed asbestos removal",
      "asbestos testing UK",
      "asbestos disposal UK",
      "nationwide asbestos removal",
    ],
  },

  whyChooseUs: {
    ...london.whyChooseUs,
    title: "Trusted Asbestos Specialists Across the UK",
    subtitle: "Protecting UK properties and people for over four decades.",
    items: london.whyChooseUs.items.map((it) =>
      it.title === "Fast, Efficient Service"
        ? { ...it, text: "Fast site visits nationwide. We work to your schedule with minimal disruption." }
        : it,
    ),
  },

  process: [
    {
      title: "Free Consultation",
      text: "Contact us for a no-obligation discussion about your requirements.",
    },
    {
      title: "Survey & Assessment",
      text: "Our surveyor visits your property and produces a detailed risk assessment.",
    },
    {
      title: "Safe Removal",
      text: "Licensed operatives carry out removal with full containment and air monitoring.",
    },
    {
      title: "Clearance & Docs",
      text: "Four-stage clearance testing confirms safety. Full documentation provided.",
    },
  ],

  testimonials: [
    {
      initials: "JH",
      name: "James H.",
      location: "Manchester",
      quote:
        "Outstanding from first contact to project completion. The team were professional, efficient, and kept us fully informed. The clearance documentation was comprehensive. Highly recommended.",
    },
    {
      initials: "SM",
      name: "Sarah M.",
      location: "Birmingham",
      quote:
        "Used for a commercial property survey and removal. Excellent communication, the report was detailed and easy to understand. Competitive pricing with no hidden extras.",
    },
    {
      initials: "DP",
      name: "David P.",
      location: "Leeds",
      quote:
        "Had the garage roof removed. They arrived promptly, completed the work ahead of schedule, and cleaned up immaculately. Professional team throughout. I'll use them again.",
    },
  ],

  seoKeywordBlock: {
    title: "Asbestos Services Across the UK — Common Questions & Topics",
    columns: [
      {
        heading: "Our Services",
        items: [
          "Asbestos removal UK",
          "Asbestos testing near me",
          "Licensed asbestos abatement",
          "Certified asbestos contractors",
          "Asbestos inspection near me",
          "Asbestos survey UK",
          "Residential asbestos removal",
          "Commercial asbestos abatement",
        ],
      },
      {
        heading: "Specialist Removal",
        items: [
          "Asbestos testing services",
          "Asbestos management survey",
          "Asbestos bulk testing",
          "Asbestos inspection report",
          "Licensed asbestos removal",
          "Asbestos roof removal",
          "Asbestos pipe removal",
          "Asbestos floor tile removal",
          "Asbestos ceiling removal",
          "Emergency asbestos removal",
        ],
      },
      {
        heading: "Questions & Guides",
        items: [
          "How much does an asbestos survey cost?",
          "Safe asbestos disposal",
          "Professional asbestos remediation",
          "Signs of asbestos in pre-2000 homes",
          "Asbestos removal regulations in the UK",
          "Can I remove asbestos myself?",
          "How much does asbestos removal cost?",
          "What is an asbestos management survey?",
          "Do I need an asbestos survey before selling?",
        ],
      },
    ],
  },

  // Major UK cities as coverage areas. Hero images are borrowed from the London
  // site's area set (same asbestos imagery) so we don't duplicate assets.
  areas: [
    {
      slug: "london",
      name: "London",
      blurb:
        "Coverage across Greater London, from Victorian terraces to post-war tower blocks and commercial premises, all property types known to contain asbestos materials including textured coatings, pipe lagging, and asbestos cement roofing.",
    },
    {
      slug: "manchester",
      name: "Manchester",
      blurb:
        "Serving Greater Manchester's mix of Victorian housing, converted mills, and modern developments, common locations for asbestos in insulation, roofing, and floor tiles across residential and commercial buildings.",
    },
    {
      slug: "birmingham",
      name: "Birmingham",
      blurb:
        "Covering Birmingham and the West Midlands, from inter-war semis to industrial units, where asbestos cement, textured coatings, and pipe lagging are frequently found in pre-2000 buildings.",
    },
    {
      slug: "leeds",
      name: "Leeds",
      blurb:
        "Serving Leeds and West Yorkshire's back-to-back terraces, post-war estates, and commercial stock, all property types where asbestos materials require professional survey and licensed removal.",
    },
    {
      slug: "liverpool",
      name: "Liverpool",
      blurb:
        "Covering Liverpool and Merseyside, from Georgian and Victorian housing to dockland conversions, where asbestos insulation, roofing, and coatings are commonly disturbed during renovation.",
    },
    {
      slug: "bristol",
      name: "Bristol",
      blurb:
        "Serving Bristol and the South West, from period townhouses to post-war and industrial buildings, all property types known to contain asbestos-containing materials requiring safe, licensed removal.",
    },
    {
      slug: "sheffield",
      name: "Sheffield",
      blurb:
        "Covering Sheffield and South Yorkshire's Victorian terraces, council estates, and former industrial sites, where asbestos in roofing, lagging, and floor tiles is frequently identified in older buildings.",
    },
    {
      slug: "newcastle",
      name: "Newcastle",
      blurb:
        "Serving Newcastle and the North East, from Tyneside flats to post-war housing and commercial premises, common locations for asbestos cement, textured coatings, and insulation in pre-2000 property.",
    },
  ].map((a, i) => ({
    ...a,
    tags: ["📋 Surveys", "🧪 Testing", "🔧 Licensed Removal", "🔩 Non-Licensed", "🌬️ Air Testing"],
    heroImage: london.areas[i % london.areas.length].heroImage,
    figureCaption: `HSE Licensed Asbestos Removal — ${a.name}`,
    content: [],
  })),
};

export default config;
