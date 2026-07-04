import type { SiteConfig } from "../types";
import { buildAreaContent } from "../content-helpers";

// This file is the ONE thing that changes from site to site. Everything
// under app/ and components/ reads from this object (or from the
// area/service arrays inside it) - nothing else in the template hardcodes
// "Bath". To spin up a new city, copy this file, change the values below,
// and swap the image URLs.
//
// This particular config is a faithful port of asbestosabatementbath.co.uk,
// used as the working example/seed for the template.

const HERO_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/3b4ca6671_AdobeStock_619050401-640w.webp";
const THUMB_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/ec3e3494a_asbestos-removal-thumb.webp";
const SURVEY_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/56f4c7328_asbestos-surveying.jpeg";
const COST_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/b8c42dbfd_asbestos-removal-1.jpg";
const NEARME_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/f254ead1c_download1.jpg";
const AREA_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/f69653a99_download2.jpg";

const config: SiteConfig = {
  businessName: "Bath Asbestos Removal",
  logoLetter: "B",
  city: "Bath",
  region: "Somerset",
  country: "GB",
  phoneDisplay: "01225 617363",
  phoneHref: "tel:01225617363",
  email: "info@asbestosabatementbath.co.uk",
  foundedYear: 1984,
  domain: "asbestosabatementbath.co.uk",

  theme: {
    primary: "#8B6914",
    secondary: "#C49A2A",
    accent: "#FFF8E7",
    dark: "#3D2E08",
    bg: "#FFFDF5",
  },

  nav: {
    hours: "Mon–Fri 7am–6pm | Emergency 24/7",
  },

  hero: {
    tag: "HSE Licensed — Somerset",
    titleBefore: "Bath's Trusted",
    titleHighlight: "Asbestos Removal",
    titleAfter: "Specialists",
    subtitle:
      "Safe, certified, and competitively priced asbestos removal, survey, testing, and disposal services across Bath and Somerset. HSE-licensed operatives, UKAS-accredited laboratory analysis, and a commitment to protecting your property and your health.",
    image: HERO_IMAGE,
    trustPills: [
      "✓ HSE Licensed",
      "✓ UKAS Accredited",
      "✓ Same-Day Response",
      "✓ No Hidden Costs",
    ],
  },

  stats: [
    { value: "40+", label: "Years Experience" },
    { value: "5,000+", label: "Jobs Completed" },
    { value: "100%", label: "HSE Compliant" },
    { value: "24/7", label: "Emergency Line" },
  ],

  trustBar: [
    { icon: "🛡️", label: "HSE Licensed" },
    { icon: "🏅", label: "UKAS Accredited" },
    { icon: "📋", label: "BS Compliant" },
    { icon: "💷", label: "No Hidden Costs" },
    { icon: "⭐", label: "5-Star Rated" },
    { icon: "🔒", label: "Fully Insured" },
  ],

  services: [
    {
      slug: "survey",
      icon: "📋",
      title: "Asbestos Surveys",
      shortDescription:
        "UKAS-accredited management and R&D surveys across Bath and Somerset.",
      heroImage: SURVEY_IMAGE,
      pageSubtitle:
        "UKAS-accredited management and R&D surveys across Bath and Somerset. Detailed reports, expert recommendations, fast booking.",
      figureCaption: "Asbestos Surveys — Bath, Somerset",
      content: [
        {
          type: "h2",
          text: "Professional Asbestos Surveys in Bath, Somerset",
        },
        {
          type: "p",
          text: "An asbestos survey is the critical first step in managing asbestos safely. Under the Control of Asbestos Regulations 2012, all non-domestic properties in Bath must have an up-to-date asbestos register. Our UKAS-accredited surveyors provide thorough, compliant surveys for all property types across Somerset.",
        },
        { type: "h2", text: "Types of Asbestos Survey Available in Bath" },
        { type: "h3", text: "Management Survey" },
        {
          type: "p",
          text: "The standard survey for occupied premises. Our surveyor systematically inspects and samples suspect materials throughout your Bath property, providing a detailed report with risk ratings, photographs, and floor plans. Surveys conducted to HSG264.",
        },
        { type: "h3", text: "Refurbishment & Demolition Survey" },
        {
          type: "p",
          text: "Legally required before any refurbishment or demolition work in Bath. A fully intrusive survey identifying all ACMs, including those in inaccessible areas. Required before submitting notifications to the HSE.",
        },
        { type: "h3", text: "Re-Inspection Survey" },
        {
          type: "p",
          text: "Periodic re-inspections of your existing asbestos register ensure it remains accurate and up-to-date for your Bath property. Recommended annually or following any disturbance event.",
        },
        { type: "h2", text: "What Your Bath Survey Report Includes" },
        {
          type: "ul",
          items: [
            "Full systematic inspection of all accessible areas",
            "UKAS-accredited bulk sample analysis (PLM)",
            "Material condition and risk assessment for each ACM",
            "Colour floor plans marking all identified ACMs",
            "Photographic records of all suspect materials",
            "Clear management recommendations",
            "Asbestos register ready for ongoing use",
          ],
        },
        {
          type: "callout",
          tone: "info",
          text: "📋 Management surveys from £250. R&D surveys priced on application for your Bath property.",
        },
        { type: "h2", text: "Duty to Manage Asbestos in Bath" },
        {
          type: "p",
          text: "Regulation 4 of the Control of Asbestos Regulations 2012 places a legal duty on anyone responsible for a non-domestic property in Bath to manage asbestos. Failure to comply can result in prosecution by the HSE. Our survey service helps you fulfil this duty comprehensively.",
        },
      ],
    },
    {
      slug: "testing",
      icon: "🧪",
      title: "Asbestos Testing",
      shortDescription:
        "Bulk sample analysis and air monitoring. UKAS-accredited results from £60.",
      heroImage: SURVEY_IMAGE,
      pageSubtitle:
        "UKAS-accredited bulk sample analysis and air monitoring for Bath and Somerset properties, with results in 3–5 working days.",
      figureCaption: "Asbestos Testing — Bath, Somerset",
      content: [
        { type: "h2", text: "UKAS-Accredited Asbestos Testing in Bath" },
        {
          type: "p",
          text: "If you suspect a material contains asbestos, testing gives you a definitive answer before you disturb it. We collect bulk samples safely from suspect materials at your Bath property and analyse them in our UKAS-accredited laboratory to ISO 17025.",
        },
        { type: "h2", text: "Testing Services We Offer" },
        {
          type: "ul",
          items: [
            "Bulk sample analysis (PLM) from £60 per sample, results in 3–5 working days",
            "Urgent turnaround available for time-critical projects",
            "Air monitoring and personal air sampling during works",
            "Four-stage clearance testing following removal",
            "Reassurance air testing for occupied buildings",
          ],
        },
        {
          type: "callout",
          tone: "info",
          text: "🧪 Same-day sample collection is available across Bath in most cases, with UKAS-accredited results returned in 3–5 working days.",
        },
        { type: "h2", text: "Why Test Before You Renovate" },
        {
          type: "p",
          text: "Disturbing asbestos-containing materials without testing them first is one of the most common causes of accidental exposure. If your Bath property was built or refurbished before 2000, we strongly recommend testing any suspect material before drilling, cutting, or removing it.",
        },
      ],
    },
    {
      slug: "contractors",
      icon: "🔧",
      title: "Licensed Removal",
      shortDescription:
        "Full HSE-licensed removal with containment, air monitoring, and clearance certification.",
      heroImage: SURVEY_IMAGE,
      pageSubtitle:
        "HSE-licensed removal of high-risk asbestos materials in Bath, with full containment, air monitoring, and four-stage clearance.",
      figureCaption: "Licensed Asbestos Removal — Bath, Somerset",
      content: [
        { type: "h2", text: "HSE-Licensed Asbestos Removal in Bath" },
        {
          type: "p",
          text: "Higher-risk asbestos materials — insulation board, lagging, and sprayed coatings — can only be removed by contractors holding a full HSE licence. Our licensed team carries out this work under strict containment, ensuring your Bath property and everyone in it stays safe.",
        },
        { type: "h2", text: "What's Included" },
        {
          type: "ul",
          items: [
            "Full enclosure and negative-pressure containment",
            "Licensed operatives working to HSE-approved methods",
            "Continuous air monitoring throughout the works",
            "Four-stage clearance testing before re-occupation",
            "Complete waste consignment note documentation",
          ],
        },
        {
          type: "callout",
          tone: "info",
          text: "🔧 Licensed removal from £800, priced after a free site survey of your Bath property.",
        },
        { type: "h2", text: "HSE Notification" },
        {
          type: "p",
          text: "Licensed asbestos removal work in Bath must be notified to the HSE at least 14 days before work begins. We handle this notification on your behalf as part of every licensed project.",
        },
      ],
    },
    {
      slug: "non-licensed",
      icon: "🔩",
      title: "Non-Licensed Removal",
      shortDescription:
        "Asbestos cement, floor tiles, textured coatings & more removed safely by trained operatives.",
      heroImage: SURVEY_IMAGE,
      pageSubtitle:
        "Safe removal of asbestos cement, floor tiles, and textured coatings from Bath properties by trained, competent operatives.",
      figureCaption: "Non-Licensed Asbestos Removal — Bath, Somerset",
      content: [
        { type: "h2", text: "Non-Licensed Asbestos Removal in Bath" },
        {
          type: "p",
          text: "Lower-risk, bonded asbestos materials such as asbestos cement sheeting, textured coatings, and vinyl floor tiles can be removed by trained operatives without a full HSE licence — provided the correct risk assessment, controls, and disposal procedures are followed.",
        },
        { type: "h2", text: "Materials We Commonly Remove" },
        {
          type: "ul",
          items: [
            "Asbestos cement roofing, cladding and guttering",
            "Textured decorative coatings (e.g. Artex)",
            "Vinyl and thermoplastic floor tiles with ACM adhesive",
            "Asbestos cement gutters, downpipes and rainwater goods",
            "Bath panels and modern-day asbestos-containing products",
          ],
        },
        {
          type: "callout",
          tone: "info",
          text: "🔩 Non-licensed removal from £300 for your Bath property, with fixed-price quotations after a free site visit.",
        },
        { type: "h2", text: "Still Notifiable, Still Documented" },
        {
          type: "p",
          text: "Even where a licence isn't required, we still record and notify non-licensed work in line with the Control of Asbestos Regulations 2012, and provide full waste consignment documentation for your Bath property records.",
        },
      ],
    },
    {
      slug: "garage-roof",
      icon: "🏠",
      title: "Garage Roof Removal & Dismantle",
      shortDescription:
        "Specialist removal of asbestos cement garage roofs and full garage dismantle & demolition across Somerset.",
      heroImage: THUMB_IMAGE,
      pageSubtitle:
        "Specialist removal of asbestos cement garage roofs, sheds and outbuildings across Bath and Somerset.",
      figureCaption: "Garage Roof Removal — Bath, Somerset",
      content: [
        { type: "h2", text: "Asbestos Garage Roof Removal in Bath" },
        {
          type: "p",
          text: "Corrugated asbestos cement roofing is extremely common on garages, sheds and outbuildings built before the 1999 ban. Our specialist team removes these roofs safely, with full containment of dust and debris, and complete waste documentation.",
        },
        { type: "h2", text: "Our Garage Roof Service" },
        {
          type: "ul",
          items: [
            "Safe removal of asbestos cement garage roof sheets",
            "Full garage dismantle where the whole structure is being cleared",
            "Site clearance and skip-free removal of all arisings",
            "Waste consignment note provided for every job",
          ],
        },
        {
          type: "callout",
          tone: "info",
          text: "🏠 A standard single garage roof removal in Bath typically costs £400–£800. Call for a free site visit and fixed-price quote.",
        },
        { type: "h2", text: "What Happens After Removal" },
        {
          type: "p",
          text: "Once the roof is removed, most customers choose to have the garage re-roofed rather than left open — see our Re-Roofing Services for fibre cement, steel, GRP and EPDM replacement options.",
        },
      ],
    },
    {
      slug: "reroofing",
      icon: "🏗️",
      title: "Re-Roofing Services",
      shortDescription:
        "Complete re-roofing for garages, factories, commercial and agricultural buildings after asbestos removal.",
      heroImage: THUMB_IMAGE,
      pageSubtitle:
        "Complete re-roofing for garages, factories, commercial and agricultural buildings following asbestos removal in Bath.",
      figureCaption: "Re-Roofing Services — Bath, Somerset",
      content: [
        { type: "h2", text: "Re-Roofing After Asbestos Removal in Bath" },
        {
          type: "p",
          text: "Once an asbestos cement roof has been removed, we offer a complete replacement roofing service so your Bath property is left weatherproof and finished — not just stripped bare.",
        },
        { type: "h2", text: "Roofing Systems Available" },
        {
          type: "ul",
          items: [
            "Fibre cement replacement sheeting",
            "Profiled steel roofing systems",
            "GRP (fibreglass) roofing",
            "EPDM rubber flat-roof systems",
            "Combined removal and re-roof packages for a single fixed price",
          ],
        },
        {
          type: "callout",
          tone: "info",
          text: "🏗️ Ask about our combined asbestos removal + re-roof packages for garages and commercial buildings in Bath.",
        },
        { type: "h2", text: "One Team, Start to Finish" },
        {
          type: "p",
          text: "Because the same team handles both the asbestos removal and the re-roof, your Bath project has a single point of contact and one fixed-price quotation covering the whole job.",
        },
      ],
    },
    {
      slug: "reboard-plaster",
      icon: "🪣",
      title: "Reboard & Plastering",
      shortDescription:
        "Full reboard and skim plaster finish after asbestos artex, AIB ceiling and board removal.",
      heroImage: THUMB_IMAGE,
      pageSubtitle:
        "Full reboard and skim plaster reinstatement following asbestos artex, AIB ceiling and board removal in Bath.",
      figureCaption: "Reboard & Plastering — Bath, Somerset",
      content: [
        { type: "h2", text: "Reboard & Plastering in Bath" },
        {
          type: "p",
          text: "Removing asbestos textured coatings, AIB ceiling tiles or wall boards leaves a surface that needs reinstating. We provide a full reboard and skim plaster finish so your Bath property is left ready to decorate.",
        },
        { type: "h2", text: "What's Included" },
        {
          type: "ul",
          items: [
            "Plasterboard reboarding to ceilings and walls",
            "Fire-rated boarding available where required",
            "Full skim plaster finish, ready for decoration",
            "Combined removal and reboard packages available for one fixed price",
          ],
        },
        {
          type: "callout",
          tone: "info",
          text: "🪣 Book removal and reboard together for your Bath property and receive one fixed-price quotation for the whole job.",
        },
        { type: "h2", text: "A Finished Room, Not Just a Stripped One" },
        {
          type: "p",
          text: "We know an asbestos removal job isn't really finished until the room looks good again — our reboard and plastering service means your Bath property is left decoration-ready, not just safe.",
        },
      ],
    },
    {
      slug: "air-testing",
      icon: "🌬️",
      title: "Air Testing & Monitoring",
      shortDescription:
        "BOHS-qualified air sampling, personal monitoring, and four-stage clearance testing.",
      heroImage: SURVEY_IMAGE,
      pageSubtitle:
        "BOHS P402-qualified air sampling, personal air monitoring, and four-stage clearance testing for Bath asbestos projects.",
      figureCaption: "Air Testing & Monitoring — Bath, Somerset",
      content: [
        { type: "h2", text: "Air Testing & Monitoring in Bath" },
        {
          type: "p",
          text: "Air testing confirms that fibre levels are safe before, during and after asbestos works. Our BOHS P402-qualified analysts provide independent, UKAS-accredited monitoring for projects of every size across Bath and Somerset.",
        },
        { type: "h2", text: "Monitoring Services" },
        {
          type: "ul",
          items: [
            "Background air testing before works begin",
            "Personal air monitoring (PAM) for operatives during removal",
            "Leak testing of enclosures during licensed works",
            "Four-stage clearance testing before re-occupation",
            "Reassurance air sampling for occupied buildings",
          ],
        },
        {
          type: "callout",
          tone: "info",
          text: "🌬️ All air testing for Bath projects is carried out independently of the removal team, in line with HSE guidance on impartiality.",
        },
        { type: "h2", text: "Independent By Design" },
        {
          type: "p",
          text: "Where we also carry out the removal work, air testing is analysed independently to avoid any conflict of interest — giving you and building occupants genuine confidence in the clearance result.",
        },
      ],
    },
    {
      slug: "soil-remediation",
      icon: "🌱",
      title: "Soil Remediation & Testing",
      shortDescription:
        "Asbestos-contaminated land testing and remediation for brownfield, domestic, and commercial sites.",
      heroImage: THUMB_IMAGE,
      pageSubtitle:
        "Asbestos-contaminated soil testing and remediation for brownfield, domestic and commercial sites in Bath and Somerset.",
      figureCaption: "Soil Remediation & Testing — Bath, Somerset",
      content: [
        { type: "h2", text: "Asbestos Soil Testing & Remediation in Bath" },
        {
          type: "p",
          text: "Former industrial land, older gardens, and demolition sites in and around Bath can contain asbestos-contaminated soil. We provide ground investigation, sample testing, and full remediation to make land safe for redevelopment or continued use.",
        },
        { type: "h2", text: "Our Process" },
        {
          type: "ul",
          items: [
            "Initial desk study and site walkover",
            "Trial pit excavation and soil sampling",
            "UKAS-accredited laboratory analysis of samples",
            "Remediation of contaminated soil where required",
            "Validation report suitable for planning submissions",
          ],
        },
        {
          type: "callout",
          tone: "info",
          text: "🌱 We provide validation reports accepted by local planning authorities for developments across Bath and Somerset.",
        },
        { type: "h2", text: "Common on Redevelopment Sites" },
        {
          type: "p",
          text: "If you're developing a brownfield or former industrial site in Bath, a planning condition will typically require asbestos-in-soil testing before work begins — we can turn this around quickly to keep your project on schedule.",
        },
      ],
    },
    {
      slug: "demolition",
      icon: "🏚️",
      title: "Demolition Services",
      shortDescription:
        "Pre-demolition surveys, soft strip, structural demolition, and site clearance across Somerset.",
      heroImage: THUMB_IMAGE,
      pageSubtitle:
        "Pre-demolition surveys, soft strip, structural demolition and site clearance across Bath and Somerset.",
      figureCaption: "Demolition Services — Bath, Somerset",
      content: [
        { type: "h2", text: "Demolition Services in Bath" },
        {
          type: "p",
          text: "Every demolition project in Bath must start with a refurbishment & demolition survey to identify any ACMs before work begins. We provide that survey in-house, then carry out soft strip, structural demolition and full site clearance.",
        },
        { type: "h2", text: "Our Demolition Service" },
        {
          type: "ul",
          items: [
            "Pre-demolition R&D asbestos survey",
            "Soft strip of fixtures, fittings and internal partitions",
            "Structural demolition of buildings and outbuildings",
            "Full site clearance and waste segregation",
            "HSE notification handled where required",
          ],
        },
        {
          type: "callout",
          tone: "info",
          text: "🏚️ Fully insured demolition works for domestic, commercial and agricultural buildings across Bath and Somerset.",
        },
        { type: "h2", text: "One Contractor, Full Compliance" },
        {
          type: "p",
          text: "Because we handle the survey, asbestos removal and demolition under one roof, there's no risk of gaps between contractors — everything on your Bath site is accounted for and documented.",
        },
      ],
    },
    {
      slug: "muck-away",
      icon: "🚛",
      title: "Muck Away",
      shortDescription:
        "Licensed removal and disposal of soil, demolition arisings, and asbestos-contaminated material.",
      heroImage: THUMB_IMAGE,
      pageSubtitle:
        "Licensed removal and disposal of excavated soil, demolition arisings and asbestos-contaminated material from Bath sites.",
      figureCaption: "Muck Away — Bath, Somerset",
      content: [
        { type: "h2", text: "Muck Away Services in Bath" },
        {
          type: "p",
          text: "Whether you're clearing a demolition site or excavating for a new build, we provide licensed muck away services for both clean and asbestos-contaminated material across Bath and Somerset.",
        },
        { type: "h2", text: "What We Handle" },
        {
          type: "ul",
          items: [
            "Excavated soil and subsoil",
            "Demolition arisings and rubble",
            "Asbestos-contaminated material requiring licensed disposal",
            "Full duty of care documentation for every load",
          ],
        },
        {
          type: "callout",
          tone: "info",
          text: "🚛 Clean and hazardous waste streams are kept separate and documented throughout, for full traceability on your Bath project.",
        },
        { type: "h2", text: "Keeping Your Site Moving" },
        {
          type: "p",
          text: "Fast, reliable muck away is essential to keeping a Bath construction or demolition programme on track — we schedule vehicles around your site's needs, not the other way round.",
        },
      ],
    },
    {
      slug: "disposal",
      icon: "♻️",
      title: "Asbestos Disposal",
      shortDescription:
        "Licensed hazardous waste carrier. Full consignment note documentation.",
      heroImage: THUMB_IMAGE,
      pageSubtitle:
        "Licensed hazardous waste carrier services with full consignment note documentation for Bath and Somerset properties.",
      figureCaption: "Asbestos Disposal — Bath, Somerset",
      content: [
        { type: "h2", text: "Licensed Asbestos Disposal in Bath" },
        {
          type: "p",
          text: "As a licensed hazardous waste carrier, we provide safe collection, packaging and disposal of asbestos waste from Bath properties, whether or not we carried out the original removal.",
        },
        { type: "h2", text: "Our Disposal Service" },
        {
          type: "ul",
          items: [
            "Safe double-bagging and labelling of asbestos waste",
            "Licensed transport to a permitted disposal site",
            "Full consignment note documentation",
            "Certificates retained for your property records",
          ],
        },
        {
          type: "callout",
          tone: "info",
          text: "♻️ Consignment notes are essential documentation for future property sales and mortgage applications — keep yours safe.",
        },
        { type: "h2", text: "Standalone Disposal Available" },
        {
          type: "p",
          text: "Already had asbestos removed from your Bath property by someone else and left with bagged waste? We offer standalone collection and disposal without requiring a full removal contract.",
        },
      ],
    },
    {
      slug: "cost",
      icon: "💷",
      title: "Transparent Pricing",
      shortDescription:
        "Fixed-price quotes. Removal from £300, surveys from £250. No hidden charges.",
      heroImage: COST_IMAGE,
      pageSubtitle:
        "Transparent pricing for asbestos removal, surveys, testing, and encapsulation across Bath and Somerset. No hidden fees.",
      figureCaption: "Asbestos Removal Costs — Bath, Somerset",
      content: [
        { type: "h2", text: "Asbestos Removal Costs in Bath, Somerset" },
        {
          type: "p",
          text: "Understanding asbestos removal costs in Bath is essential to planning your project. At Bath Asbestos Removal, we provide fixed-price, fully itemised quotations — no surprises, no hidden charges.",
        },
        {
          type: "priceGrid",
          items: [
            {
              label: "Asbestos Survey",
              price: "£250",
              unit: "from",
              note: "Management surveys for residential properties",
            },
            {
              label: "Asbestos Removal",
              price: "£300",
              unit: "from",
              note: "Non-licensed. Licensed removal from £800",
              featured: true,
            },
            {
              label: "Encapsulation",
              price: "£25",
              unit: "from /m²",
              note: "High-performance sealant coating",
            },
            {
              label: "Asbestos Testing",
              price: "£60",
              unit: "from",
              note: "UKAS-accredited lab analysis per sample",
            },
          ],
        },
        { type: "h2", text: "What Affects Asbestos Removal Costs in Bath?" },
        {
          type: "ul",
          items: [
            "Type of asbestos: friable asbestos (lagging, insulation board) requires licensed removal and costs more than bonded asbestos cement.",
            "Volume of material: more material means more labour, more PPE, and higher disposal costs.",
            "Accessibility: confined spaces, heights, or occupied buildings add to the overall cost.",
            "Location: properties in central Bath versus outlying Somerset areas may have different logistics costs.",
            "Emergency vs. planned: out-of-hours emergency callouts carry a premium.",
          ],
        },
        {
          type: "callout",
          tone: "info",
          text: "💡 Always get quotes from at least three HSE-licensed contractors. Be cautious of unusually low quotes — they may indicate unlicensed or underinsured operators.",
        },
        { type: "h2", text: "Asbestos Encapsulation Costs in Bath" },
        {
          type: "p",
          text: "Where removal is not immediately necessary, asbestos encapsulation provides a cost-effective alternative. This involves applying a penetrating or bridging sealant that prevents fibre release. Costs typically range from £25–£40 per m², dependent on material area and accessibility.",
        },
        { type: "h2", text: "Get an Accurate Quote for Your Bath Property" },
        {
          type: "p",
          text: "Contact our team today for a free site visit and fixed-price quotation for your Bath or Somerset property.",
        },
      ],
    },
  ],

  localInfo: {
    tag: "Local Expertise — Bath",
    title: "Asbestos in Bath's Heritage Properties",
    paragraphs: [
      "Bath's UNESCO World Heritage status means its pre-Georgian, Georgian, and Victorian property stock is among the most asbestos-affected in the South West. Properties across BA1 and BA2 postcodes — from Widcombe terraces to Lansdown villas — frequently contain asbestos insulation board, textured coatings, and asbestos cement roofing hidden beneath heritage exteriors.",
      "Bath's building regulations and conservation area requirements mean that asbestos surveys are frequently requested as part of planning applications. Our surveyors understand the specific construction methods used in Bath's Georgian terraces and later Victorian and Edwardian developments, and provide reports that satisfy both HSE requirements and Bath & North East Somerset Council planning officers.",
    ],
    facts: [
      {
        label: "Local Property Fact",
        text: "Over 62% of Bath's domestic housing stock pre-dates 1980, placing the majority of residential properties in the highest-risk category for asbestos-containing materials.",
      },
      {
        label: "Why Act Now",
        text: "Bath's thriving renovation and conversion market — fuelled by permitted development rights and the city's desirability — creates significant risk of asbestos disturbance without prior survey.",
      },
    ],
    calloutText:
      "📊 Bath & North East Somerset Council registers hundreds of asbestos-related planning notifications annually — evidence of the scale of ACMs present in the local built environment.",
    keywords: [
      "asbestos removal Bath",
      "asbestos survey Bath",
      "HSE licensed asbestos Bath",
      "asbestos testing Somerset",
      "asbestos disposal Bath",
      "garage roof removal Bath",
    ],
  },

  whyChooseUs: {
    image: SURVEY_IMAGE,
    badgeNumber: "40+",
    badgeLabel: "Years Experience",
    title: "Trusted Asbestos Specialists in Bath",
    subtitle:
      "Protecting Somerset properties and people for over four decades.",
    items: [
      {
        icon: "✓",
        title: "HSE Licensed & Fully Insured",
        text: "We hold a full HSE licence for licensed asbestos removal and carry £10m public liability insurance.",
      },
      {
        icon: "🏅",
        title: "UKAS-Accredited Analysis",
        text: "All samples are analysed in our UKAS-accredited laboratory to ISO 17025 for guaranteed accuracy.",
      },
      {
        icon: "💷",
        title: "Transparent Fixed Pricing",
        text: "Every quotation is fixed-price and fully itemised. No hidden charges, no surprises.",
      },
      {
        icon: "⚡",
        title: "Fast, Efficient Service",
        text: "Same-day site visits across Bath. We work to your schedule with minimal disruption.",
      },
    ],
  },

  process: [
    {
      title: "Free Consultation",
      text: "Contact us for a no-obligation discussion about your requirements.",
    },
    {
      title: "Survey & Assessment",
      text: "Our surveyor visits your Bath property and produces a detailed risk assessment.",
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
      location: "Bath",
      quote:
        "Outstanding from first contact to project completion. The team were professional, efficient, and kept us fully informed. The clearance documentation was comprehensive. Highly recommended.",
    },
    {
      initials: "SM",
      name: "Sarah M.",
      location: "Somerset",
      quote:
        "Used for a commercial property survey and removal. Excellent communication, the report was detailed and easy to understand. Competitive pricing with no hidden extras.",
    },
    {
      initials: "DP",
      name: "David P.",
      location: "Bath",
      quote:
        "Had the garage roof removed. They arrived promptly, completed the work ahead of schedule, and cleaned up immaculately. Professional team throughout. I'll use them again.",
    },
  ],

  pricing: [
    {
      label: "Asbestos Survey",
      price: "£250",
      unit: "from",
      note: "Management surveys for residential properties",
    },
    {
      label: "Asbestos Removal",
      price: "£300",
      unit: "from",
      note: "Non-licensed. Licensed removal from £800",
      featured: true,
    },
    {
      label: "Encapsulation",
      price: "£25",
      unit: "from /m²",
      note: "High-performance sealant coating",
    },
    {
      label: "Asbestos Testing",
      price: "£60",
      unit: "from",
      note: "UKAS-accredited lab analysis per sample",
    },
  ],

  faqs: [
    {
      question: "How quickly can you respond in Bath?",
      answer:
        "Our emergency team covers Bath and all of Somerset 24/7. For emergency asbestos incidents we typically have an operative on-site within 2–4 hours. For planned work, we offer same-day or next-day site visits in most cases.",
    },
    {
      question: "Do I need a survey before selling my Bath property?",
      answer:
        "While not legally required for residential sales, many Bath buyers and solicitors now request an asbestos survey as part of the conveyancing process, particularly for pre-2000 properties. A management survey provides complete peace of mind for all parties.",
    },
    {
      question: "Can I remove asbestos myself in Bath?",
      answer:
        "DIY removal of licensed asbestos materials (insulation board, lagging, sprayed coatings) is illegal. Non-licensed materials may technically be removed by the property owner, but this is not recommended. Always use a qualified contractor in Bath.",
    },
    {
      question: "How long does asbestos removal take in Bath?",
      answer:
        "This depends on the type and volume of material. A single garage roof removal in Bath typically takes 2–4 hours. Larger commercial or industrial projects may take several days. We'll provide an accurate programme as part of your quotation.",
    },
    {
      question: "What documentation will I receive?",
      answer:
        "We provide complete documentation including: waste consignment notes, air clearance certificates, four-stage clearance reports, photographic records, and copies of our HSE licence and insurance certificates on request.",
    },
  ],

  seoKeywordBlock: {
    title: "Asbestos Services in Bath — Common Questions & Topics",
    columns: [
      {
        heading: "Local Services",
        items: [
          "Asbestos removal Bath",
          "Asbestos testing near me",
          "Local asbestos abatement",
          "Certified asbestos contractors in Bath",
          "Asbestos inspection near me",
          "Asbestos survey Bath",
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
          "How much does asbestos removal cost in Bath?",
          "What is an asbestos management survey?",
          "Do I need an asbestos survey before selling?",
        ],
      },
    ],
  },

  areas: [
    {
      slug: "bradford-on-avon",
      name: "Bradford on Avon",
      blurb:
        "Bath area — Bradford on Avon is a well-established community in Somerset with a mix of Victorian terraces, interwar semis, and post-war developments — all property types known to contain asbestos materials including textured coatings, pipe lagging, and asbestos cement roofing.",
      tags: [
        "📋 Surveys",
        "🧪 Testing",
        "🔧 Licensed Removal",
        "🔩 Non-Licensed",
        "🌬️ Air Testing",
        "🏗️ Re-Roofing",
        "🪣 Reboard & Plaster",
      ],
      heroImage: AREA_IMAGE,
      figureCaption:
        "HSE Licensed Asbestos Removal — Bradford on Avon, Somerset",
      content: [],
    },
    {
      slug: "keynsham",
      name: "Keynsham",
      blurb:
        "Keynsham grew significantly during the 20th century industrial boom. Many residential and commercial properties in Keynsham contain asbestos in roofing, flooring, and pipe insulation, making professional surveys and testing essential before any renovation.",
      tags: [
        "📋 Surveys",
        "🧪 Testing",
        "🔧 Licensed Removal",
        "🔩 Non-Licensed",
        "🌬️ Air Testing",
        "🏗️ Re-Roofing",
        "🪣 Reboard & Plaster",
      ],
      heroImage: AREA_IMAGE,
      figureCaption: "HSE Licensed Asbestos Removal — Keynsham, Somerset",
      content: [],
    },
    {
      slug: "midsomer-norton",
      name: "Midsomer Norton",
      blurb:
        "Midsomer Norton has a rich local history dating back centuries, with a property stock ranging from Georgian townhouses to 1970s council estates — all of which may harbour asbestos-containing materials. Our team covers Midsomer Norton as part of our Bath network.",
      tags: [
        "📋 Surveys",
        "🧪 Testing",
        "🔧 Licensed Removal",
        "🔩 Non-Licensed",
        "🌬️ Air Testing",
        "🏗️ Re-Roofing",
        "🪣 Reboard & Plaster",
      ],
      heroImage: AREA_IMAGE,
      figureCaption:
        "HSE Licensed Asbestos Removal — Midsomer Norton, Somerset",
      content: [],
    },
    {
      slug: "radstock",
      name: "Radstock",
      blurb:
        "Radstock developed rapidly post-WWII, resulting in a high proportion of properties built with asbestos cement, textured coatings, and pipe lagging. We provide the full range of asbestos services to homeowners, landlords, and businesses in Radstock.",
      tags: [
        "📋 Surveys",
        "🧪 Testing",
        "🔧 Licensed Removal",
        "🔩 Non-Licensed",
        "🌬️ Air Testing",
        "🏗️ Re-Roofing",
        "🪣 Reboard & Plaster",
      ],
      heroImage: AREA_IMAGE,
      figureCaption: "HSE Licensed Asbestos Removal — Radstock, Somerset",
      content: [],
    },
    {
      slug: "frome",
      name: "Frome",
      blurb:
        "Frome is home to a mix of residential and light industrial properties, many constructed or refurbished during the peak asbestos-use era of 1950–2000. Our Bath-based team provides same-day site visits to Frome.",
      tags: [
        "📋 Surveys",
        "🧪 Testing",
        "🔧 Licensed Removal",
        "🔩 Non-Licensed",
        "🌬️ Air Testing",
        "🏗️ Re-Roofing",
        "🪣 Reboard & Plaster",
      ],
      heroImage: AREA_IMAGE,
      figureCaption: "HSE Licensed Asbestos Removal — Frome, Somerset",
      content: [],
    },
    {
      slug: "trowbridge",
      name: "Trowbridge",
      blurb:
        "Trowbridge features a blend of older stone buildings and 20th-century developments. Pre-2000 properties in Trowbridge should be surveyed before any renovation work commences — we provide fast, accredited surveys across the area.",
      tags: [
        "📋 Surveys",
        "🧪 Testing",
        "🔧 Licensed Removal",
        "🔩 Non-Licensed",
        "🌬️ Air Testing",
        "🏗️ Re-Roofing",
        "🪣 Reboard & Plaster",
      ],
      heroImage: AREA_IMAGE,
      figureCaption: "HSE Licensed Asbestos Removal — Trowbridge, Somerset",
      content: [],
    },
    {
      slug: "melksham",
      name: "Melksham",
      blurb:
        "Melksham expanded substantially throughout the mid-20th century. Asbestos was routinely used in construction during this period, making professional surveys, testing, and removal highly advisable for older properties in Melksham.",
      tags: [
        "📋 Surveys",
        "🧪 Testing",
        "🔧 Licensed Removal",
        "🔩 Non-Licensed",
        "🌬️ Air Testing",
        "🏗️ Re-Roofing",
        "🪣 Reboard & Plaster",
      ],
      heroImage: AREA_IMAGE,
      figureCaption: "HSE Licensed Asbestos Removal — Melksham, Somerset",
      content: [],
    },
    {
      slug: "chippenham",
      name: "Chippenham",
      blurb:
        "Chippenham has a varied property landscape including commercial premises, schools, and residential homes — many built during the era when asbestos use was widespread in the UK. We serve all property types in Chippenham.",
      tags: [
        "📋 Surveys",
        "🧪 Testing",
        "🔧 Licensed Removal",
        "🔩 Non-Licensed",
        "🌬️ Air Testing",
        "🏗️ Re-Roofing",
        "🪣 Reboard & Plaster",
      ],
      heroImage: AREA_IMAGE,
      figureCaption: "HSE Licensed Asbestos Removal — Chippenham, Somerset",
      content: [],
    },
    {
      slug: "corsham",
      name: "Corsham",
      blurb:
        "Corsham contains a number of industrial and warehouse buildings from the post-war era, alongside residential streets that frequently contain asbestos cement roofing and floor tiles. Our licensed team covers Corsham 24/7.",
      tags: [
        "📋 Surveys",
        "🧪 Testing",
        "🔧 Licensed Removal",
        "🔩 Non-Licensed",
        "🌬️ Air Testing",
        "🏗️ Re-Roofing",
        "🪣 Reboard & Plaster",
      ],
      heroImage: AREA_IMAGE,
      figureCaption: "HSE Licensed Asbestos Removal — Corsham, Somerset",
      content: [],
    },
    {
      slug: "westbury",
      name: "Westbury",
      blurb:
        "Westbury is a community with older housing stock that often pre-dates the 1999 asbestos ban. Homeowners and landlords in Westbury are advised to arrange a management survey — our Bath team responds within hours.",
      tags: [
        "📋 Surveys",
        "🧪 Testing",
        "🔧 Licensed Removal",
        "🔩 Non-Licensed",
        "🌬️ Air Testing",
        "🏗️ Re-Roofing",
        "🪣 Reboard & Plaster",
      ],
      heroImage: AREA_IMAGE,
      figureCaption: "HSE Licensed Asbestos Removal — Westbury, Somerset",
      content: [],
    },
  ],

  areaIndex: {
    heroImage: NEARME_IMAGE,
    intro: [
      "Searching for professional asbestos removal near you in Bath? Our locally based teams provide comprehensive coverage across Bath and all surrounding areas of Somerset. With rapid response times and deep local knowledge of the property stock across the region, we are the trusted choice for asbestos removal near Bath.",
      "Somerset has a rich and varied architectural heritage — from Victorian and Edwardian terraces to post-war council estates and modern commercial developments. Many properties built before 2000 contain asbestos-containing materials (ACMs) including textured coatings, pipe lagging, insulation board, and asbestos cement roofing. Our surveyors understand the specific construction types and asbestos risks found throughout the region.",
    ],
  },
};

// Fill in each area's full page content using the shared generator now
// that the rest of the config (services, phone, region) is available.
config.areas = config.areas.map((area) => ({
  ...area,
  content: buildAreaContent(area.name, area.blurb, config),
}));

export default config;
export { config as siteConfig };
