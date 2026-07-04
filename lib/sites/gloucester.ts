import type { SiteConfig } from "../types";
import { buildAreaContent } from "../content-helpers";

// Ported from html/asbestosabatementgloucester.co.uk.html. All copy below
// — hero, services, local info, areas — is transcribed from that source
// file, not reused from birmingham.ts or any other city.

const HERO_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/322b807e5_asbestoc-removal-headerjpg.webp";
const WHY_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/cf26ffb75_download6.jpg";
const NEARME_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/f254ead1c_download1.jpg";

const SURVEY_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/56f4c7328_asbestos-surveying.jpeg";
const TESTING_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/093602ba5_asbestos-testing-auckland.webp";
const CONTRACTORS_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/ec3e3494a_asbestos-removal-thumb.webp";
const NON_LICENSED_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/a6d4c48b5_non-licenced.png";
const GARAGE_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/8bf55d3f5_asbestos-garage.webp";
const REROOFING_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/89e3eeb69_corrugated-roofing.jpg";
const REBOARD_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/a9d419f55_plaster-board.jpg";
const AIR_TESTING_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/77c5997a6_airmon.jpg";
const SOIL_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/bc33b714c_soil-remediation-scaled.jpg";
const DEMOLITION_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/993581e09_demo.jpg";
const MUCK_AWAY_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/716ee3e81_muck-away.webp";
const DISPOSAL_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/1a6e243ed_asbestosdisposal.jpg";
const COST_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/494a31cf2_download3.jpg";

const AREA_CHELTENHAM_IMAGE = HERO_IMAGE;
const AREA_STROUD_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/33ded0c74_asbestos_construction_workerjpg.webp";
const AREA_CIRENCESTER_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/89d6a2fe0_asbestos-abatement-angi-v2.jpg";
const AREA_TEWKESBURY_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/f93fcadf6_asbestos-removal-3E9A3792-Full-Res.jpg";
const AREA_CINDERFORD_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/c3d1f122e_Asbestos-Safety-Hero-2.jpg";
const AREA_LYDNEY_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/2ccdd2d37_asbestos-sampling-testing-bury-st-edmunds.webp";
const AREA_COLEFORD_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/9cbabb080_asbestos-testing-auckland.webp";
const AREA_NEWENT_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/a2173c278_contractors-1-800-b4c9816a6.jpg";
const AREA_DURSLEY_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/ff9c40246_download1.jpg";
const AREA_THORNBURY_IMAGE =
  "https://media.base44.com/images/public/6a3bc7b45c35bfaca5b859b3/acdd42b91_G1336267367-Hazardous-waste-management-ULcom-HEADER-2400x1600-1-1024x768.jpeg";

const AREA_TAGS = [
  "📋 Surveys",
  "🧪 Testing",
  "🔧 Licensed Removal",
  "🔩 Non-Licensed",
  "🌬️ Air Testing",
  "🏗️ Re-Roofing",
  "🪣 Reboard & Plaster",
];

const config: SiteConfig = {
  businessName: "Gloucester Asbestos Removal",
  logoLetter: "G",
  city: "Gloucester",
  region: "Gloucestershire",
  country: "GB",
  phoneDisplay: "01452 920738",
  phoneHref: "tel:01452920738",
  email: "info@asbestosabatementgloucester.co.uk",
  foundedYear: 1984,
  domain: "asbestosabatementgloucester.co.uk",

  theme: {
    primary: "#1A4731",
    secondary: "#2D7A4F",
    accent: "#E8F5EE",
    dark: "#0A2018",
    bg: "#F5FFF9",
  },

  nav: {
    hours: "Mon–Fri 7am–6pm | Emergency 24/7",
  },

  hero: {
    tag: "HSE Licensed — Gloucestershire",
    titleBefore: "Gloucester's Trusted",
    titleHighlight: "Asbestos Removal",
    titleAfter: "Specialists",
    subtitle:
      "Safe, certified, and competitively priced asbestos removal, survey, testing, and disposal services across Gloucester and Gloucestershire. HSE-licensed operatives, UKAS-accredited laboratory analysis, and a commitment to protecting your property and your health.",
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
        "UKAS-accredited management and R&D surveys across Gloucester and Gloucestershire.",
      heroImage: SURVEY_IMAGE,
      pageSubtitle:
        "UKAS-accredited management and R&D surveys across Gloucester and Gloucestershire. Detailed reports, expert recommendations, fast booking.",
      figureCaption: "Asbestos Surveys — Gloucester, Gloucestershire",
      content: [
        {
          type: "h2",
          text: "Professional Asbestos Surveys in Gloucester, Gloucestershire",
        },
        {
          type: "p",
          text: "An asbestos survey is the critical first step in managing asbestos safely. Under the Control of Asbestos Regulations 2012, all non-domestic properties in Gloucester must have an up-to-date asbestos register. Our UKAS-accredited surveyors provide thorough, compliant surveys for all property types across Gloucestershire.",
        },
        { type: "h2", text: "Types of Asbestos Survey Available in Gloucester" },
        { type: "h3", text: "Management Survey" },
        {
          type: "p",
          text: "The standard survey for occupied premises. Our surveyor systematically inspects and samples suspect materials throughout your Gloucester property, providing a detailed report with risk ratings, photographs, and floor plans. Surveys conducted to HSG264.",
        },
        { type: "h3", text: "Refurbishment & Demolition Survey" },
        {
          type: "p",
          text: "Legally required before any refurbishment or demolition work in Gloucester. A fully intrusive survey identifying all ACMs, including those in inaccessible areas. Required before submitting notifications to the HSE.",
        },
        { type: "h3", text: "Re-Inspection Survey" },
        {
          type: "p",
          text: "Periodic re-inspections of your existing asbestos register ensure it remains accurate and up-to-date for your Gloucester property. Recommended annually or following any disturbance event.",
        },
        { type: "h2", text: "What Your Gloucester Survey Report Includes" },
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
          text: "📋 Management surveys from £250. R&D surveys priced on application for your Gloucester property.",
        },
        { type: "h2", text: "Duty to Manage Asbestos in Gloucester" },
        {
          type: "p",
          text: "Regulation 4 of the Control of Asbestos Regulations 2012 places a legal duty on anyone responsible for a non-domestic property in Gloucester to manage asbestos. Failure to comply can result in prosecution by the HSE. Our survey service helps you fulfil this duty comprehensively.",
        },
      ],
    },
    {
      slug: "testing",
      icon: "🧪",
      title: "Asbestos Testing",
      shortDescription:
        "Bulk sample analysis and air monitoring. UKAS-accredited results from £60.",
      heroImage: TESTING_IMAGE,
      pageSubtitle:
        "UKAS-accredited asbestos testing, bulk sampling, and air monitoring across Gloucester and Gloucestershire. Fast results, expert analysis from £60.",
      figureCaption: "Asbestos Testing — Gloucester, Gloucestershire",
      content: [
        { type: "h2", text: "Professional Asbestos Testing in Gloucester, Gloucestershire" },
        {
          type: "p",
          text: "If you suspect asbestos in your Gloucester property, the only reliable way to confirm its presence and identify fibre types is through laboratory analysis. Our UKAS-accredited asbestos testing service provides fast, accurate results for residential and commercial clients across Gloucestershire.",
        },
        { type: "h2", text: "Asbestos Testing Services in Gloucester" },
        { type: "h3", text: "Bulk Sampling & Analysis" },
        {
          type: "p",
          text: "Our operatives take physical samples of suspect materials from your Gloucester property. Samples are analysed using Polarised Light Microscopy (PLM) in our UKAS-accredited laboratory, identifying the presence and type of asbestos fibres with complete accuracy.",
        },
        { type: "h3", text: "Air Monitoring" },
        {
          type: "p",
          text: "During asbestos removal works in Gloucester, continuous air monitoring ensures fibre concentrations remain below the legal Control Limit of 0.1 f/cm³. Monitoring is conducted by qualified BOHS P402 analysts.",
        },
        { type: "h3", text: "Four-Stage Clearance Testing" },
        {
          type: "p",
          text: "Following licensed asbestos removal, four-stage clearance testing (visual inspection, PCM air testing, reoccupation certificate) confirms your Gloucester property is safe before reoccupation.",
        },
        { type: "h2", text: "When Should You Arrange Asbestos Testing in Gloucester?" },
        {
          type: "ul",
          items: [
            "Your property was built or refurbished before 2000",
            "You are planning renovation or demolition work",
            "A suspect material has been damaged or disturbed",
            "You are purchasing a property in Gloucester or Gloucestershire",
            "Your asbestos management plan requires periodic sampling",
          ],
        },
        {
          type: "callout",
          tone: "info",
          text: "🧪 Bulk sample testing from £60 per sample. Results in 3–5 working days. Urgent turnaround available.",
        },
      ],
    },
    {
      slug: "contractors",
      icon: "🔧",
      title: "Licensed Removal",
      shortDescription:
        "HSE-licensed asbestos removal contractors serving Gloucester and Gloucestershire. Fully insured, UKAS accredited.",
      heroImage: CONTRACTORS_IMAGE,
      pageSubtitle:
        "HSE-licensed asbestos removal contractors serving Gloucester and Gloucestershire. Fully insured, UKAS accredited, and British Standards compliant. Free site visits.",
      figureCaption: "Licensed Asbestos Removal — Gloucester, Gloucestershire",
      content: [
        { type: "h2", text: "HSE-Licensed Asbestos Contractors in Gloucester, Gloucestershire" },
        {
          type: "p",
          text: "Selecting the right asbestos removal contractor in Gloucester is one of the most important decisions you can make when dealing with asbestos in your property. Using an unlicensed contractor is illegal for many types of asbestos work, and exposes you and your family or workforce to serious health risks.",
        },
        {
          type: "p",
          text: "Gloucester Asbestos Removal holds a full HSE licence for licensed asbestos removal work. We specialise in asbestos removal, abatement, encapsulation, testing, and clean-up for residential, commercial, and industrial clients across Gloucestershire.",
        },
        { type: "h2", text: "What to Look for in a Gloucester Asbestos Contractor" },
        {
          type: "ul",
          items: [
            "HSE Licence: verify any contractor's licence at hse.gov.uk before booking",
            "Insurance: minimum £5m public liability and employers' liability insurance",
            "UKAS Accreditation: for laboratory analysis, ensure ISO 17025 accreditation",
            "Trained operatives: RSPH/BOHS P402/P403/P404 qualified staff",
            "Site-specific documentation: risk assessments and method statements before commencing work",
          ],
        },
        {
          type: "callout",
          tone: "info",
          text: "🛡️ Our guarantees: Free site visit · No hidden costs · British Standards compliant · Fully insured · Clean and efficient · Professional workmanship",
        },
        { type: "h2", text: "Our Experience Across Gloucestershire" },
        {
          type: "p",
          text: "Our team has completed hundreds of asbestos removal projects across Gloucester and Gloucestershire — from Victorian-era residential properties to modern commercial and industrial facilities. We have worked for private homeowners, local authorities, NHS trusts, schools, housing associations, and major developers.",
        },
        { type: "h2", text: "Emergency Contractor Services in Gloucester" },
        {
          type: "p",
          text: "For asbestos emergencies across Gloucester and Gloucestershire, our 24/7 response team can mobilise within hours. We assess the situation, make the area safe, and begin remediation works — all fully documented and compliant.",
        },
      ],
    },
    {
      slug: "non-licensed",
      icon: "🔩",
      title: "Non-Licensed Removal",
      shortDescription:
        "Asbestos cement, floor tiles, textured coatings & more removed safely by trained operatives.",
      heroImage: NON_LICENSED_IMAGE,
      pageSubtitle:
        "Professional non-licensed asbestos removal across Gloucester and Gloucestershire. Asbestos cement, floor tiles, textured coatings, and more — safely removed by trained operatives.",
      figureCaption: "Non-Licensed Asbestos Removal — Gloucester, Gloucestershire",
      content: [
        { type: "h2", text: "Non-Licensed Asbestos Removal in Gloucester, Gloucestershire" },
        {
          type: "p",
          text: "Not all asbestos removal work in Gloucester requires an HSE licence. Many of the most commonly found asbestos-containing materials (ACMs) — including asbestos cement sheeting, vinyl floor tiles, and certain textured coatings — fall under the category of non-licensed work. However, \"non-licensed\" does not mean unregulated: all such work must still be carried out by competent, trained operatives following the requirements of the Control of Asbestos Regulations 2012.",
        },
        { type: "h2", text: "What is Non-Licensed Asbestos Removal?" },
        {
          type: "p",
          text: "Non-licensed asbestos removal covers work with lower-risk bonded asbestos materials where the risk of fibre release is minimal when correct procedures are followed. All non-licensed work in Gloucester must comply with CAR 2012 regulations including a written risk assessment, suitable PPE, and correct disposal procedures.",
        },
        { type: "h2", text: "Materials We Remove Under Non-Licensed Works in Gloucester" },
        {
          type: "ul",
          items: [
            "Asbestos cement sheets — corrugated roofing, flat sheets, guttering, downpipes, and soffits",
            "Vinyl (thermoplastic) floor tiles — including tiles with asbestos-containing adhesive",
            "Textured coatings (Artex) — on ceilings and walls, where undisturbed and in good condition",
            "Asbestos cement flues and rainwater goods — boiler flues, drainage pipes, and associated fittings",
            "Bitumen products — damp proof courses and some roof felts containing asbestos",
            "Certain floor coverings — cushion vinyl and other resilient flooring with asbestos-containing backing",
          ],
        },
        {
          type: "callout",
          tone: "info",
          text: "💡 Some materials — including heavily damaged asbestos cement, friable textured coatings, and any insulation board or lagging — require licensed removal. We assess every project and advise on the correct approach before any work commences.",
        },
        { type: "h2", text: "Our Non-Licensed Removal Process in Gloucester" },
        {
          type: "ul",
          items: [
            "Free site survey: we inspect the materials and confirm whether non-licensed procedures apply",
            "Risk assessment: a written risk assessment and method statement are prepared before works begin",
            "Controlled removal: materials are removed carefully using appropriate PPE and tools to minimise fibre release, with wet methods used where applicable",
            "Thorough clean-down: H-class vacuum equipment used throughout, with the work area fully cleaned before we leave",
            "Licensed disposal: all asbestos waste is double-bagged, labelled, and transported to a licensed disposal facility with full consignment note documentation",
          ],
        },
        { type: "h2", text: "Non-Licensed Removal Costs in Gloucester" },
        {
          type: "p",
          text: "Non-licensed asbestos removal is significantly more affordable than licensed work. Typical costs in Gloucester range from £300 for small domestic jobs to £2,500+ for larger commercial or industrial projects. All quotations are fixed-price. Contact us for a free site visit and itemised quote.",
        },
        {
          type: "callout",
          tone: "warning",
          text: "⚠️ Even non-licensed asbestos removal carries health risks if carried out without proper precautions. Never attempt DIY removal of any asbestos-containing material — always use a trained and competent contractor.",
        },
      ],
    },
    {
      slug: "garage-roof",
      icon: "🏠",
      title: "Garage Roof Removal & Dismantle",
      shortDescription:
        "Specialist removal of asbestos cement garage roofs and full garage dismantle & demolition across Gloucestershire.",
      heroImage: GARAGE_IMAGE,
      pageSubtitle:
        "Safe, professional removal and full dismantle of asbestos cement garage roofs across Gloucester and Gloucestershire. Fast, affordable, fully licensed. Free quotes available.",
      figureCaption: "Garage Roof Removal — Gloucester, Gloucestershire",
      content: [
        { type: "h2", text: "Asbestos Garage Roof Removal & Dismantle in Gloucester, Gloucestershire" },
        {
          type: "p",
          text: "Asbestos cement corrugated roofing is one of the most common asbestos-containing materials found in Gloucester properties. Many garages, sheds, and outbuildings across Gloucestershire were constructed using asbestos cement sheets before the year 2000. Whether you need the roof sheets removed and replaced, or the entire garage structure dismantled and cleared, our licensed team handles it all as a single, fully managed project.",
        },
        { type: "h2", text: "Signs Your Gloucester Garage Roof Contains Asbestos" },
        {
          type: "ul",
          items: [
            "Built or last reroofed before 2000",
            "Grey or silver-grey corrugated sheet roofing",
            "Visible cracking, chalking, or flaking of the surface",
            "White dust visible in gutters or on surrounding surfaces",
            "Property documents reference asbestos materials",
          ],
        },
        {
          type: "callout",
          tone: "warning",
          text: "⚠️ Never attempt to drill, cut, or remove an asbestos cement garage roof yourself. Disturbing the material releases fibres that cause serious long-term conditions including mesothelioma.",
        },
        { type: "h2", text: "Asbestos Garage Roof Removal in Gloucester" },
        {
          type: "p",
          text: "Where the garage structure itself is to be retained, we remove the asbestos cement roofing sheets only — carefully hand-lowering each sheet to prevent breakage, double-bagging or wrapping all material in polythene on removal, and thoroughly cleaning the area using H-class vacuum equipment before leaving. All waste is transported to a licensed hazardous waste disposal facility with full consignment note documentation.",
        },
        {
          type: "ul",
          items: [
            "Free site visit: we inspect and, if required, sample the roof material to confirm asbestos content before quoting",
            "Safe sheet removal: sheets are hand-lowered — never broken, dropped, or pressure-washed, with immediate double-bagging or polythene wrapping on removal",
            "Site clean-down: full H-class vacuum clean of all surfaces following removal",
            "Licensed disposal: waste transported to a permitted hazardous waste landfill with full consignment note paperwork",
            "Re-roofing option: we offer complete re-roofing in fibre cement, steel, EPDM, or GRP immediately following removal — one contractor, one price",
          ],
        },
        { type: "h2", text: "Full Garage Dismantle & Demolition in Gloucester" },
        {
          type: "p",
          text: "Where a complete garage dismantle is required — whether to free up space, access land, or replace the structure entirely — our team provides an end-to-end service: asbestos survey, licensed asbestos roof removal, full structural demolition of the garage walls and base, and site clearance. We also provide the muck-away of all demolition arisings, leaving a clean, level site ready for your next project.",
        },
        {
          type: "ul",
          items: [
            "Pre-dismantle asbestos survey: a survey confirms all ACMs present before any works begin — legally required for demolition projects",
            "Licensed asbestos removal: all asbestos cement roofing, soffits, guttering, and any other ACMs are removed before structural demolition commences",
            "Structural garage demolition: block, brick, timber, and steel garage frames safely demolished by our experienced operatives",
            "Concrete base breaking: existing concrete floor slabs broken out and removed where required",
            "Site clearance & muck away: all demolition arisings — brickwork, concrete, timber, and asbestos waste — removed from site with full duty of care documentation",
            "Level & reinstate: the area is left level and ready for new construction, landscaping, or driveway works",
          ],
        },
        {
          type: "callout",
          tone: "info",
          text: "🏗️ Our combined asbestos removal and garage dismantle package offers significant savings versus using separate contractors. One survey, one team, one fixed price — ask us about our combined packages for Gloucester and Gloucestershire properties.",
        },
        { type: "h2", text: "What Types of Garage We Dismantle in Gloucester" },
        {
          type: "ul",
          items: [
            "Single and double brick or block garages — with asbestos cement corrugated or flat sheet roofing",
            "Timber-framed garages and carports — with asbestos cement sheet cladding and/or roofing",
            "Steel-framed industrial units and outbuildings — with asbestos cement profiled sheet roofing and cladding",
            "Agricultural buildings and barns — with large spans of asbestos corrugated roofing",
            "Pre-fabricated concrete garages — including those with asbestos cement roofing panels",
          ],
        },
        { type: "h2", text: "Garage Roof Removal & Dismantle Costs in Gloucester" },
        {
          type: "p",
          text: "Asbestos garage roof removal only (single garage, approx. 15–20m²) typically costs £400–£800 in the Gloucester area. Full garage dismantle including asbestos removal, demolition, and site clearance is priced from £800–£2,500 for a standard single garage depending on construction type, size, and access. All costs are fixed-price with full itemisation and no hidden extras. Contact us today for a free site visit and quotation.",
        },
      ],
    },
    {
      slug: "reroofing",
      icon: "🏗️",
      title: "Re-Roofing Services",
      shortDescription:
        "Complete re-roofing for garages, factories, commercial and agricultural buildings after asbestos removal.",
      heroImage: REROOFING_IMAGE,
      pageSubtitle:
        "Complete re-roofing services for garages, factories, commercial premises, and agricultural buildings following asbestos cement roof removal across Gloucester and Gloucestershire.",
      figureCaption: "Re-Roofing Services — Gloucester, Gloucestershire",
      content: [
        { type: "h2", text: "Re-Roofing After Asbestos Removal in Gloucester, Gloucestershire" },
        {
          type: "p",
          text: "Once asbestos cement roofing has been safely removed from your garage, factory, commercial unit, agricultural building, or residential outbuilding in Gloucester, the structure requires a new, weatherproof roof. Rather than leaving you to find a separate roofing contractor, our team provides a complete re-roofing service following all types of asbestos roof removal — available for garages, industrial units, commercial premises, farm buildings, and residential extensions across Gloucestershire.",
        },
        { type: "h2", text: "Re-Roofing Options After Asbestos Removal in Gloucester" },
        { type: "h3", text: "Garage & Domestic Outbuilding Re-Roofing" },
        {
          type: "p",
          text: "After asbestos cement corrugated roofing is removed from garages, car ports, garden rooms, and domestic outbuildings in Gloucester, we offer a range of replacement roofing systems:",
        },
        {
          type: "ul",
          items: [
            "Fibre cement corrugated sheets — the modern, asbestos-free equivalent. Lightweight, durable, and available in grey or coated finishes matching the original profile",
            "Box profile steel sheeting — a robust, long-lasting option for garage and outbuilding roofs",
            "EPDM rubber flat roofing — for flat or low-pitch garage roofs, with a 20+ year lifespan and full warranty",
            "GRP (fibreglass) flat roofing — seamless, fully waterproof, and ideal for domestic garage and extension roofs",
          ],
        },
        { type: "h3", text: "Commercial & Industrial Re-Roofing in Gloucester" },
        {
          type: "p",
          text: "Industrial units, factory buildings, warehouses, and commercial premises in Gloucester and Gloucestershire often have large areas of asbestos cement roofing requiring replacement. We provide:",
        },
        {
          type: "ul",
          items: [
            "Box profile steel roof sheeting — with full insulation, breather membrane, and flashings for energy-efficient commercial roofing",
            "Over-roofing systems — in some cases, new steel sheeting can be installed over the existing purlins without full dismantling, reducing cost and programme time",
            "Roof-light (skylight) reinstatement — matching polycarbonate or GRP roof lights reinstated to maintain natural lighting",
            "Gutter and downpipe replacement — asbestos cement gutters and downpipes are replaced with UPVC or cast iron equivalents as part of the re-roofing works",
          ],
        },
        { type: "h3", text: "Agricultural Building Re-Roofing in Gloucester & Gloucestershire" },
        {
          type: "p",
          text: "Farm buildings, storage barns, machinery sheds, and livestock buildings across Gloucestershire frequently have large spans of asbestos cement roofing that require replacement. We work with farmers and rural estate owners to provide:",
        },
        {
          type: "ul",
          items: [
            "Fibre cement or steel corrugated sheeting — robust, cost-effective, and appropriate for agricultural use",
            "Box profile steel cladding — for side walls and gable ends as well as roofs",
            "Planning advice — for listed farm buildings or those within conservation areas requiring sensitive replacement materials",
          ],
        },
        { type: "h2", text: "Combined Removal & Re-Roofing Package in Gloucester" },
        {
          type: "p",
          text: "Our most popular service for Gloucester and Gloucestershire clients is our combined asbestos removal and re-roofing package. We survey, remove the asbestos roofing, carry out all waste disposal with full documentation, and then install the new roofing system — all in one project, with a single fixed price and a single point of responsibility. This eliminates the risk of programme delays between removal and re-roofing and typically provides significant cost savings versus using two separate contractors.",
        },
        {
          type: "callout",
          tone: "info",
          text: "🏗️ Ask about our combined asbestos roof removal & re-roofing package for your Gloucester property. We'll survey, remove, dispose, and re-roof — all in one visit where possible, with a single fixed-price quotation.",
        },
        { type: "h2", text: "Re-Roofing Costs in Gloucester" },
        {
          type: "p",
          text: "Re-roofing costs after asbestos removal depend on the area, roof pitch, material chosen, and access requirements. Typical costs in Gloucester for a single garage re-roof start from £600. Industrial and agricultural re-roofing is priced per m². Contact us for a free site visit and fixed-price combined quotation.",
        },
      ],
    },
    {
      slug: "reboard-plaster",
      icon: "🪣",
      title: "Reboard & Plastering",
      shortDescription:
        "Full reboard and skim plaster finish after asbestos artex, AIB ceiling and board removal.",
      heroImage: REBOARD_IMAGE,
      pageSubtitle:
        "Complete reboard and plastering services following asbestos artex, ceiling board, and wall board removal across Gloucester and Gloucestershire. Seamless finish guaranteed.",
      figureCaption: "Reboard & Plastering — Gloucester, Gloucestershire",
      content: [
        { type: "h2", text: "Reboard & Plastering After Asbestos Removal in Gloucester, Gloucestershire" },
        {
          type: "p",
          text: "Removing asbestos artex, asbestos insulation board (AIB) ceilings, or asbestos-containing wall boards leaves the underlying structure exposed. Rather than leaving clients to source a separate contractor, our Gloucester team provides a complete reboard and plastering service following all types of asbestos board and ceiling removal — delivering a seamless, ready-to-decorate finish in one visit.",
        },
        { type: "h2", text: "When Is Reboarding Required?" },
        { type: "p", text: "Reboarding is necessary after the removal of:" },
        {
          type: "ul",
          items: [
            "Asbestos textured coatings (Artex) — once removed from plasterboard or solid ceilings, the surface requires re-skimming or full reboarding",
            "Asbestos insulation board (AIB) ceiling tiles — suspended AIB ceilings are common in 1960s–80s offices, schools, and commercial buildings; once removed, the ceiling void requires new boarding",
            "AIB partition walls and fire doors — removal of asbestos partition boards leaves structural voids requiring new fire-rated reboarding",
            "Asbestos floor tiles and adhesive — in some cases, sub-floor reboarding is required before new flooring is laid",
            "Asbestos cement soffits and internal linings — replacement boarding restores the aesthetic and weatherproofing of the structure",
          ],
        },
        { type: "h2", text: "Our Reboard & Plastering Service in Gloucester" },
        {
          type: "ul",
          items: [
            "Same team, one visit: our operatives carry out asbestos removal and reboard/plaster works in sequence — eliminating coordination delays and reducing overall project duration",
            "Fire-rated boarding: where required by building regulations, we install appropriate fire-rated plasterboard to restore the fire compartmentation of the space",
            "Skim coat plastering: a two-coat skim plaster finish is applied to all reboarded surfaces, achieving a smooth, ready-to-decorate standard",
            "Coving and cornice reinstatement: where original coving or cornicing has been disturbed, we can reinstate a matching profile",
            "Ceiling rose and lighting reinstatement: we work with your electrician or carry out minor making-good works around light fittings and ceiling roses",
          ],
        },
        { type: "h2", text: "Reboard & Plastering Costs in Gloucester" },
        {
          type: "p",
          text: "Reboard and plastering costs depend on the area to be treated and the specification of boarding required. Typical costs in Gloucester start from £20/m² for re-skimming over existing sound plasterboard, rising to £45/m² for full fire-rated reboard and skim. All costs are included in our combined removal and reinstatement quotation. Call us today for a free assessment.",
        },
        {
          type: "callout",
          tone: "info",
          text: "🏠 Ask about our combined asbestos removal and reboard package — we'll give you a single fixed price for removal, disposal, reboarding, and plastering, saving you the cost and hassle of co-ordinating separate contractors.",
        },
      ],
    },
    {
      slug: "air-testing",
      icon: "🌬️",
      title: "Air Testing & Monitoring",
      shortDescription:
        "BOHS-qualified air sampling, personal monitoring, and four-stage clearance testing.",
      heroImage: AIR_TESTING_IMAGE,
      pageSubtitle:
        "BOHS-qualified air testing, fibre monitoring, and four-stage clearance testing across Gloucester and Gloucestershire. Independent, UKAS-accredited results for full HSE compliance.",
      figureCaption: "Air Testing & Monitoring — Gloucester, Gloucestershire",
      content: [
        { type: "h2", text: "Asbestos Air Testing & Monitoring in Gloucester, Gloucestershire" },
        {
          type: "p",
          text: "Air testing and monitoring is a critical component of asbestos management in Gloucester. Whether you require background air sampling before works commence, personal exposure monitoring during removal, or the mandatory four-stage clearance process following licensed asbestos removal, our BOHS P402-qualified analysts provide independent, UKAS-accredited air monitoring services across Gloucestershire.",
        },
        { type: "h2", text: "Types of Air Testing We Provide in Gloucester" },
        { type: "h3", text: "Background Air Sampling" },
        {
          type: "p",
          text: "Background (baseline) air sampling is carried out before asbestos removal works commence in Gloucester. This establishes the ambient fibre concentration at the site before any disturbance, providing a benchmark against which clearance air test results are compared. Background sampling is strongly recommended for all licensed removal projects and any work in occupied or partially occupied buildings.",
        },
        { type: "h3", text: "Personal Air Monitoring (PAM)" },
        {
          type: "p",
          text: "Personal air monitoring involves attaching a sampling pump to operatives' lapels during asbestos removal works. The pumps sample the air at the operative's breathing zone throughout the working shift. Samples are analysed by phase contrast microscopy (PCM) or scanning electron microscopy (SEM) in our UKAS-accredited laboratory, confirming that fibre concentrations remain below the legal Control Limit of 0.1 fibres/cm³.",
        },
        { type: "h3", text: "Enclosure Leak Testing" },
        {
          type: "p",
          text: "For licensed asbestos removal in Gloucester carried out within a full containment enclosure, we carry out systematic leak testing of the enclosure perimeter before removal commences, ensuring no fibres escape to the surrounding environment.",
        },
        { type: "h3", text: "Four-Stage Clearance Testing" },
        {
          type: "p",
          text: "Four-stage clearance is a mandatory process following all licensed asbestos removal in Gloucester. The four stages are:",
        },
        {
          type: "ul",
          items: [
            "Stage 1: preliminary visual inspection of the work area",
            "Stage 2: detailed visual inspection under good lighting",
            "Stage 3: air sampling — a minimum of five samples taken within the enclosure",
            "Stage 4: analysis and issue of a reoccupation certificate",
          ],
        },
        {
          type: "p",
          text: "Only when all four stages are passed can the work area be handed back for reoccupation. Our analysts are independent of the removal contractor — a legal requirement for licensed work.",
        },
        { type: "h3", text: "Reassurance Air Sampling" },
        {
          type: "p",
          text: "Reassurance air sampling is available for Gloucester properties where asbestos has been disturbed accidentally — for example during renovation works — and where the client needs independent confirmation that the area is safe. Results are typically available within 24–48 hours.",
        },
        {
          type: "callout",
          tone: "info",
          text: "🔬 All air testing in Gloucester is carried out by BOHS P402-qualified analysts. Laboratory analysis is UKAS-accredited to ISO 17025. Results include a full written report and reoccupation certificate where applicable.",
        },
        { type: "h2", text: "Air Testing Costs in Gloucester" },
        {
          type: "p",
          text: "Air testing costs depend on the type of sampling required and the number of samples taken. Four-stage clearance testing for a standard single-room licensed removal in Gloucester typically costs £350–£600. Background sampling and personal air monitoring are priced on application. Contact us for a fixed-price quotation.",
        },
      ],
    },
    {
      slug: "soil-remediation",
      icon: "🌱",
      title: "Soil Remediation & Testing",
      shortDescription:
        "Asbestos-contaminated land testing and remediation for brownfield, domestic, and commercial sites.",
      heroImage: SOIL_IMAGE,
      pageSubtitle:
        "Professional soil remediation and contaminated land testing across Gloucester and Gloucestershire. Asbestos in soil, contaminated ground, and brownfield site clearance specialists.",
      figureCaption: "Soil Remediation & Testing — Gloucester, Gloucestershire",
      content: [
        { type: "h2", text: "Soil Remediation & Testing in Gloucester, Gloucestershire" },
        {
          type: "p",
          text: "Asbestos does not only exist inside buildings — it is commonly found in the ground on brownfield sites, former industrial land, and residential gardens across Gloucester and Gloucestershire. Asbestos-containing materials dumped as hardcore, fly-tipped on land, or left behind from demolished buildings can contaminate soil to significant depths. Our team provides comprehensive soil testing and remediation services for developers, landowners, local authorities, and homeowners across Gloucestershire.",
        },
        { type: "h2", text: "How Does Asbestos Get Into Soil in Gloucester?" },
        {
          type: "ul",
          items: [
            "Demolition hardcore: crushed asbestos cement used as sub-base or hardcore fill under drives, paths, and floors — extremely common in Gloucester properties built or extended before 2000",
            "Fly-tipping: illegally dumped asbestos waste on agricultural and brownfield land across Gloucestershire",
            "Building demolition: fragments of asbestos cement and AIB distributed through soil during demolition of pre-2000 structures",
            "Leaking or broken asbestos pipes: deteriorating asbestos cement drainage and water pipes releasing fibres and fragments into surrounding soil",
            "Industrial sites: former factories, yards, and industrial premises in Gloucester where asbestos was routinely stored, processed, or discarded",
          ],
        },
        { type: "h2", text: "Soil Testing for Asbestos in Gloucester" },
        {
          type: "p",
          text: "Our soil testing service involves a systematic programme of ground investigation and sampling, carried out in accordance with Environment Agency guidance and the relevant British Standards. The process includes:",
        },
        {
          type: "ul",
          items: [
            "Desk study and site walkover — review of historical maps, planning records, and site inspection to identify potential contamination sources",
            "Trial pit and borehole investigation — physical ground investigation to characterise the depth and extent of contamination across the Gloucester site",
            "Soil sampling — representative samples taken for UKAS-accredited laboratory analysis for asbestos fibre content, asbestos-containing debris, and associated contaminants",
            "Contamination report — a formal site investigation report presenting findings, risk assessment, and remediation recommendations, suitable for submission to Gloucestershire Council planning teams",
          ],
        },
        { type: "h2", text: "Soil Remediation Services in Gloucester" },
        { type: "p", text: "Where soil contamination is confirmed, we provide full remediation services including:" },
        {
          type: "ul",
          items: [
            "Asbestos-contaminated soil excavation and removal — excavation to the confirmed depth of contamination, with all asbestos-containing material segregated and disposed of as hazardous waste",
            "Clean fill import — certified, tested clean fill material imported and compacted to reinstate ground levels",
            "Validation sampling — post-remediation soil sampling to confirm that contamination levels meet the agreed remediation targets",
            "Validation report — formal written confirmation of remediation completion for submission to planning authorities and for property records",
          ],
        },
        {
          type: "callout",
          tone: "info",
          text: "🏗️ Asbestos-contaminated soil must be disposed of as hazardous waste under the Hazardous Waste Regulations 2005. It cannot be disposed of at a standard skip site or municipal facility. We handle all consignment documentation and licensed disposal as part of every remediation project.",
        },
        { type: "h2", text: "Get a Soil Testing & Remediation Quote for Your Gloucester Site" },
        {
          type: "p",
          text: "Contact our Gloucester team today for a free initial consultation and fixed-price quotation for soil investigation and remediation across Gloucestershire.",
        },
      ],
    },
    {
      slug: "demolition",
      icon: "🏚️",
      title: "Demolition Services",
      shortDescription:
        "Pre-demolition surveys, soft strip, structural demolition, and site clearance across Gloucestershire.",
      heroImage: DEMOLITION_IMAGE,
      pageSubtitle:
        "Safe, licensed demolition services across Gloucester and Gloucestershire. Pre-demolition asbestos surveys, structural demolition, soft strip, and site clearance. HSE notified, fully insured.",
      figureCaption: "Demolition Services — Gloucester, Gloucestershire",
      content: [
        { type: "h2", text: "Demolition Services in Gloucester, Gloucestershire" },
        {
          type: "p",
          text: "Our Gloucester team provides professional demolition services for residential, commercial, and industrial structures across Gloucestershire — from single garage demolition and internal soft strip to full structural demolition of large commercial and industrial buildings. Crucially, all demolition work is preceded by a thorough refurbishment and demolition (R&D) asbestos survey and the removal of all identified ACMs before any structural works commence, ensuring full HSE compliance and the safety of all workers and neighbouring occupiers.",
        },
        { type: "h2", text: "Our Demolition Services in Gloucester" },
        { type: "h3", text: "Pre-Demolition Asbestos Survey" },
        {
          type: "p",
          text: "The Control of Asbestos Regulations 2012 requires a refurbishment and demolition (R&D) survey to be completed before any demolition work in Gloucester. This is a fully intrusive survey that identifies all asbestos-containing materials — including those in inaccessible locations — and provides a schedule for their removal before demolition proceeds. Our UKAS-accredited surveyors carry out R&D surveys across all Gloucestershire property types.",
        },
        { type: "h3", text: "Soft Strip Demolition" },
        {
          type: "p",
          text: "Soft strip demolition involves the careful removal of all internal fittings, finishes, and non-structural elements before structural demolition proceeds. This includes the removal of ceilings, partitions, joinery, mechanical and electrical services, and floor coverings — with all asbestos-containing materials identified and removed by our licensed operatives during the strip-out phase.",
        },
        { type: "h3", text: "Structural Demolition" },
        {
          type: "p",
          text: "Our Gloucester structural demolition team provides safe, controlled demolition of residential and commercial structures including:",
        },
        {
          type: "ul",
          items: [
            "Residential houses and bungalows",
            "Garages, outbuildings, and garden structures",
            "Commercial and retail units",
            "Industrial buildings, factories, and warehouses",
            "Agricultural buildings and barns",
            "Extensions and annexes",
          ],
        },
        { type: "h3", text: "Site Clearance" },
        {
          type: "p",
          text: "Following demolition, our team provides comprehensive site clearance — breaking out foundations, removing all demolition arisings, grading the site to formation level, and leaving the ground ready for your next development phase. Combined demolition and muck-away packages are available across Gloucestershire.",
        },
        {
          type: "callout",
          tone: "info",
          text: "🛡️ All demolition work carried out by our Gloucester team is HSE notified where required, fully insured, and conducted in accordance with BS 6187:2011 Code of Practice for Full and Partial Demolition. Method statements and risk assessments are provided for every project.",
        },
        { type: "h2", text: "Get a Demolition Quote in Gloucester" },
        {
          type: "p",
          text: "Contact our Gloucester team for a free site survey and fixed-price demolition quotation across Gloucestershire. We handle everything from pre-demolition survey to site clearance — one contractor, one price.",
        },
      ],
    },
    {
      slug: "muck-away",
      icon: "🚛",
      title: "Muck Away",
      shortDescription:
        "Licensed removal and disposal of soil, demolition arisings, and asbestos-contaminated material.",
      heroImage: MUCK_AWAY_IMAGE,
      pageSubtitle:
        "Licensed muck away and waste haulage across Gloucester and Gloucestershire. Soil, demolition arisings, asbestos-contaminated material, and construction waste removed and disposed of compliantly.",
      figureCaption: "Muck Away — Gloucester, Gloucestershire",
      content: [
        { type: "h2", text: "Muck Away Services in Gloucester, Gloucestershire" },
        {
          type: "p",
          text: "Our Gloucester muck away service provides fast, cost-effective removal and disposal of soil, demolition arisings, construction waste, and excavated material from sites across Gloucestershire. As a licensed waste carrier with our own haulage fleet, we provide competitive muck away services for developers, building contractors, groundworkers, homeowners, and local authorities across Gloucester and the surrounding area.",
        },
        { type: "h2", text: "What We Remove" },
        {
          type: "ul",
          items: [
            "Clean excavated soil and subsoil — from construction excavations, garden re-levels, and drainage works across Gloucestershire",
            "Demolition arisings — brick, concrete, timber, and mixed demolition waste from structural demolition projects in Gloucester",
            "Asbestos-contaminated soil and hardcore — classified as hazardous waste and requiring specialist disposal; we are licensed to handle and transport all categories of asbestos waste",
            "Concrete and hardcore — broken concrete, kerbs, paving, and road arisings from renovation and groundworks projects",
            "Construction and site waste — mixed construction waste from building sites, renovation projects, and development schemes",
            "Topsoil and turf — from landscaping, garden clearance, and site preparation works",
          ],
        },
        { type: "h2", text: "Our Muck Away Process in Gloucester" },
        {
          type: "ul",
          items: [
            "Waste classification: before any material is removed from your Gloucester site, we classify the waste in accordance with the Waste Framework Directive and confirm the appropriate disposal route — essential for both compliance and cost management",
            "Loading and haulage: our fleet of tipper lorries and grab vehicles provides efficient, rapid loading and haulage from sites across Gloucestershire",
            "Licensed disposal: all material is disposed of at appropriately licensed facilities — clean inert material at permitted inert landfills or recycling centres, hazardous material (including asbestos-contaminated soil) at permitted hazardous waste landfills",
            "Duty of care documentation: waste transfer notes are provided for all non-hazardous material; consignment notes for all hazardous waste, with full documentation for your site records",
          ],
        },
        { type: "h2", text: "Asbestos-Contaminated Muck Away in Gloucester" },
        {
          type: "p",
          text: "Asbestos-contaminated soil and demolition waste requires specialist handling and disposal. As a licensed hazardous waste carrier with full asbestos removal credentials, we are uniquely placed to handle mixed asbestos and soil remediation projects — removing asbestos-contaminated material from your Gloucester site, completing all hazardous waste consignment documentation, and disposing of the material at a permitted site. This single-contractor approach significantly reduces project complexity and cost.",
        },
        {
          type: "callout",
          tone: "warning",
          text: "⚠️ It is a criminal offence to fly-tip soil or construction waste — including asbestos-contaminated material. Ensure any contractor removing waste from your Gloucester site provides a valid waste carrier licence number and written duty of care documentation. We provide these as standard on every project.",
        },
        { type: "h2", text: "Muck Away Costs in Gloucester" },
        {
          type: "p",
          text: "Muck away costs in Gloucester depend on the type and volume of material, access to the site, and the applicable disposal route. Clean inert soil removal starts from £150 per load. Asbestos-contaminated material is priced on application following site assessment. Contact us for a competitive, fixed-price quotation across Gloucestershire.",
        },
        { type: "h2", text: "Get a Muck Away Quote for Your Gloucester Site" },
        {
          type: "p",
          text: "Call our Gloucester team today for rapid, cost-effective muck away services across Gloucestershire. Same-day and next-day loading available on most projects.",
        },
      ],
    },
    {
      slug: "disposal",
      icon: "♻️",
      title: "Asbestos Disposal",
      shortDescription:
        "Licensed hazardous waste carrier. Full consignment note documentation.",
      heroImage: DISPOSAL_IMAGE,
      pageSubtitle:
        "Licensed asbestos waste disposal in Gloucester, Gloucestershire. Full consignment note documentation. Certified, safe, and fully compliant with UK waste regulations.",
      figureCaption: "Asbestos Disposal — Gloucester, Gloucestershire",
      content: [
        { type: "h2", text: "Licensed Asbestos Disposal in Gloucester, Gloucestershire" },
        {
          type: "p",
          text: "Asbestos waste is classified as hazardous waste under the Hazardous Waste Regulations 2005. In Gloucester and across Gloucestershire, all asbestos waste must be handled, transported, and disposed of in strict accordance with the law. Gloucester Asbestos Removal holds a valid waste carrier's licence and ensures full legal compliance on every project.",
        },
        { type: "h2", text: "Legal Requirements for Asbestos Disposal in Gloucester" },
        {
          type: "ul",
          items: [
            "Double-bagged in UN-approved hazardous waste sacks before removal from site",
            "Labelled with appropriate hazardous waste identification",
            "Transported only by a licensed hazardous waste carrier",
            "Accompanied by a hazardous waste consignment note",
            "Disposed of only at a permitted, licensed landfill site",
          ],
        },
        {
          type: "callout",
          tone: "warning",
          text: "⚠️ It is illegal to place asbestos waste in a skip, in domestic refuse, or at any municipal recycling centre. Fly-tipping asbestos is a criminal offence. Always use a licensed disposal service.",
        },
        { type: "h2", text: "Our Gloucester Asbestos Disposal Process" },
        {
          type: "p",
          text: "Whether we've carried out the removal or you require a standalone disposal service, we provide complete collection, packaging, and disposal. Full documentation is provided including waste consignment notes — essential for property records and future transactions.",
        },
        { type: "h2", text: "Disposal Costs in Gloucester" },
        {
          type: "p",
          text: "Disposal costs depend on the type and volume of asbestos waste. All disposal costs are included in our removal quotations — there are no surprise charges. Contact us for a specific disposal quote for your Gloucester project.",
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
        "Transparent pricing for asbestos removal, surveys, testing, and encapsulation across Gloucester and Gloucestershire. No hidden fees.",
      figureCaption: "Asbestos Removal Costs — Gloucester, Gloucestershire",
      content: [
        { type: "h2", text: "Asbestos Removal Costs in Gloucester, Gloucestershire" },
        {
          type: "p",
          text: "Understanding asbestos removal costs in Gloucester is essential to planning your project. At Gloucester Asbestos Removal, we provide fixed-price, fully itemised quotations — no surprises, no hidden charges.",
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
        { type: "h2", text: "What Affects Asbestos Removal Costs in Gloucester?" },
        {
          type: "ul",
          items: [
            "Type of asbestos: friable asbestos (lagging, insulation board) requires licensed removal and costs more than bonded asbestos cement.",
            "Volume of material: more material means more labour, more PPE, and higher disposal costs.",
            "Accessibility: confined spaces, heights, or occupied buildings add to the overall cost.",
            "Location: properties in central Gloucester versus outlying Gloucestershire areas may have different logistics costs.",
            "Emergency vs. planned: out-of-hours emergency callouts carry a premium.",
          ],
        },
        {
          type: "callout",
          tone: "info",
          text: "💡 Always get quotes from at least three HSE-licensed contractors. Be cautious of unusually low quotes — they may indicate unlicensed or underinsured operators.",
        },
        { type: "h2", text: "Asbestos Encapsulation Costs in Gloucester" },
        {
          type: "p",
          text: "Where removal is not immediately necessary, asbestos encapsulation provides a cost-effective alternative. This involves applying a penetrating or bridging sealant that prevents fibre release. Costs typically range from £25–£40 per m², dependent on material area and accessibility.",
        },
        { type: "h2", text: "Get an Accurate Quote for Your Gloucester Property" },
        {
          type: "p",
          text: "Contact our team today for a free site visit and fixed-price quotation for your Gloucester or Gloucestershire property.",
        },
      ],
    },
  ],

  localInfo: {
    tag: "Local Expertise — Gloucester",
    title: "Asbestos in Gloucester's Docklands and Victorian Properties",
    paragraphs: [
      "Gloucester's Roman and medieval heritage, Victorian docklands, and extensive post-war residential areas create a varied and complex asbestos landscape across GL postcodes. As Gloucestershire's county city, professional asbestos surveys and removal are essential for homeowners, commercial operators, and developers across this active West Country property market.",
      "Gloucester's docklands conversion, Victorian terraces, and post-war estates all present distinct asbestos profiles. Our Gloucester team provides expert surveys, UKAS-accredited testing, and licensed removal for residential, commercial, and industrial clients across all Gloucestershire postcodes.",
    ],
    facts: [
      {
        label: "Local Property Fact",
        text: "Gloucester's Victorian docklands — now undergoing major regeneration — contain some of the most complex commercial and industrial asbestos challenges in the South West, including pipe lagging, insulation board, and asbestos cement cladding in converted warehouse and industrial units.",
      },
      {
        label: "Why Act Now",
        text: "Gloucester's Quays development, Kings Quarter regeneration, and expanding suburban housing programmes are generating continuous asbestos disturbance risk across GL postcodes.",
      },
    ],
    calloutText:
      "📊 Gloucestershire consistently records high volumes of asbestos removal notifications, driven by the county's extensive rural, agricultural, and residential property stock.",
    keywords: [
      "asbestos removal Gloucester",
      "asbestos survey Gloucester",
      "HSE licensed asbestos Gloucester",
      "asbestos testing Gloucestershire",
      "asbestos disposal Gloucester",
      "garage roof removal Gloucester",
    ],
  },

  whyChooseUs: {
    image: WHY_IMAGE,
    badgeNumber: "40+",
    badgeLabel: "Years Experience",
    title: "Trusted Asbestos Specialists in Gloucester",
    subtitle:
      "Protecting Gloucestershire properties and people for over four decades.",
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
        text: "Same-day site visits across Gloucester. We work to your schedule with minimal disruption.",
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
      text: "Our surveyor visits your Gloucester property and produces a detailed risk assessment.",
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
      location: "Gloucester",
      quote:
        "Outstanding from first contact to project completion. The team were professional, efficient, and kept us fully informed. The clearance documentation was comprehensive. Highly recommended.",
    },
    {
      initials: "SM",
      name: "Sarah M.",
      location: "Gloucestershire",
      quote:
        "Used for a commercial property survey and removal. Excellent communication, the report was detailed and easy to understand. Competitive pricing with no hidden extras.",
    },
    {
      initials: "DP",
      name: "David P.",
      location: "Gloucester",
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
      question: "How quickly can you respond in Gloucester?",
      answer:
        "Our emergency team covers Gloucester and all of Gloucestershire 24/7. For emergency asbestos incidents we typically have an operative on-site within 2–4 hours. For planned work, we offer same-day or next-day site visits in most cases.",
    },
    {
      question: "Do I need a survey before selling my Gloucester property?",
      answer:
        "While not legally required for residential sales, many Gloucester buyers and solicitors now request an asbestos survey as part of the conveyancing process, particularly for pre-2000 properties. A management survey provides complete peace of mind for all parties.",
    },
    {
      question: "Can I remove asbestos myself in Gloucester?",
      answer:
        "DIY removal of licensed asbestos materials (insulation board, lagging, sprayed coatings) is illegal. Non-licensed materials may technically be removed by the property owner, but this is not recommended. Always use a qualified contractor in Gloucester.",
    },
    {
      question: "How long does asbestos removal take in Gloucester?",
      answer:
        "This depends on the type and volume of material. A single garage roof removal in Gloucester typically takes 2–4 hours. Larger commercial or industrial projects may take several days. We'll provide an accurate programme as part of your quotation.",
    },
    {
      question: "What documentation will I receive?",
      answer:
        "We provide complete documentation including: waste consignment notes, air clearance certificates, four-stage clearance reports, photographic records, and copies of our HSE licence and insurance certificates on request.",
    },
  ],

  seoKeywordBlock: {
    title: "Asbestos Services in Gloucester — Common Questions & Topics",
    columns: [
      {
        heading: "Local Services",
        items: [
          "Asbestos removal Gloucester",
          "Asbestos testing near me",
          "Local asbestos abatement",
          "Certified asbestos contractors in Gloucester",
          "Asbestos inspection near me",
          "Asbestos survey Gloucester",
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
          "How much does asbestos removal cost in Gloucester?",
          "What is an asbestos management survey?",
          "Do I need an asbestos survey before selling?",
        ],
      },
    ],
  },

  areas: [
    {
      slug: "cheltenham",
      name: "Cheltenham",
      blurb:
        "Gloucester area — Cheltenham is a well-established community in Gloucestershire with a mix of Victorian terraces, interwar semis, and post-war developments — all property types known to contain asbestos materials including textured coatings, pipe lagging, and asbestos cement roofing.",
      tags: AREA_TAGS,
      heroImage: AREA_CHELTENHAM_IMAGE,
      figureCaption: "HSE Licensed Asbestos Removal — Cheltenham, Gloucestershire",
      content: [],
    },
    {
      slug: "stroud",
      name: "Stroud",
      blurb:
        "Stroud grew significantly during the 20th century industrial boom. Many residential and commercial properties in Stroud contain asbestos in roofing, flooring, and pipe insulation, making professional surveys and testing essential before any renovation.",
      tags: AREA_TAGS,
      heroImage: AREA_STROUD_IMAGE,
      figureCaption: "HSE Licensed Asbestos Removal — Stroud, Gloucestershire",
      content: [],
    },
    {
      slug: "cirencester",
      name: "Cirencester",
      blurb:
        "Cirencester has a rich local history dating back centuries, with a property stock ranging from Georgian townhouses to 1970s council estates — all of which may harbour asbestos-containing materials. Our team covers Cirencester as part of our Gloucester network.",
      tags: AREA_TAGS,
      heroImage: AREA_CIRENCESTER_IMAGE,
      figureCaption: "HSE Licensed Asbestos Removal — Cirencester, Gloucestershire",
      content: [],
    },
    {
      slug: "tewkesbury",
      name: "Tewkesbury",
      blurb:
        "Tewkesbury developed rapidly post-WWII, resulting in a high proportion of properties built with asbestos cement, textured coatings, and pipe lagging. We provide the full range of asbestos services to homeowners, landlords, and businesses in Tewkesbury.",
      tags: AREA_TAGS,
      heroImage: AREA_TEWKESBURY_IMAGE,
      figureCaption: "HSE Licensed Asbestos Removal — Tewkesbury, Gloucestershire",
      content: [],
    },
    {
      slug: "cinderford",
      name: "Cinderford",
      blurb:
        "Cinderford is home to a mix of residential and light industrial properties, many constructed or refurbished during the peak asbestos-use era of 1950–2000. Our Gloucester-based team provides same-day site visits to Cinderford.",
      tags: AREA_TAGS,
      heroImage: AREA_CINDERFORD_IMAGE,
      figureCaption: "HSE Licensed Asbestos Removal — Cinderford, Gloucestershire",
      content: [],
    },
    {
      slug: "lydney",
      name: "Lydney",
      blurb:
        "Lydney features a blend of older stone buildings and 20th-century developments. Pre-2000 properties in Lydney should be surveyed before any renovation work commences — we provide fast, accredited surveys across the area.",
      tags: AREA_TAGS,
      heroImage: AREA_LYDNEY_IMAGE,
      figureCaption: "HSE Licensed Asbestos Removal — Lydney, Gloucestershire",
      content: [],
    },
    {
      slug: "coleford",
      name: "Coleford",
      blurb:
        "Coleford expanded substantially throughout the mid-20th century. Asbestos was routinely used in construction during this period, making professional surveys, testing, and removal highly advisable for older properties in Coleford.",
      tags: AREA_TAGS,
      heroImage: AREA_COLEFORD_IMAGE,
      figureCaption: "HSE Licensed Asbestos Removal — Coleford, Gloucestershire",
      content: [],
    },
    {
      slug: "newent",
      name: "Newent",
      blurb:
        "Newent has a varied property landscape including commercial premises, schools, and residential homes — many built during the era when asbestos use was widespread in the UK. We serve all property types in Newent.",
      tags: AREA_TAGS,
      heroImage: AREA_NEWENT_IMAGE,
      figureCaption: "HSE Licensed Asbestos Removal — Newent, Gloucestershire",
      content: [],
    },
    {
      slug: "dursley",
      name: "Dursley",
      blurb:
        "Dursley contains a number of industrial and warehouse buildings from the post-war era, alongside residential streets that frequently contain asbestos cement roofing and floor tiles. Our licensed team covers Dursley 24/7.",
      tags: AREA_TAGS,
      heroImage: AREA_DURSLEY_IMAGE,
      figureCaption: "HSE Licensed Asbestos Removal — Dursley, Gloucestershire",
      content: [],
    },
    {
      slug: "thornbury",
      name: "Thornbury",
      blurb:
        "Thornbury is a community with older housing stock that often pre-dates the 1999 asbestos ban. Homeowners and landlords in Thornbury are advised to arrange a management survey — our Gloucester team responds within hours.",
      tags: AREA_TAGS,
      heroImage: AREA_THORNBURY_IMAGE,
      figureCaption: "HSE Licensed Asbestos Removal — Thornbury, Gloucestershire",
      content: [],
    },
  ],

  areaIndex: {
    heroImage: NEARME_IMAGE,
    intro: [
      "Searching for professional asbestos removal near you in Gloucester? Our locally based teams provide comprehensive coverage across Gloucester and all surrounding areas of Gloucestershire. With rapid response times and deep local knowledge of the property stock across the region, we are the trusted choice for asbestos removal near Gloucester.",
      "Gloucestershire has a rich and varied architectural heritage — from Victorian and Edwardian terraces to post-war council estates and modern commercial developments. Many properties built before 2000 contain asbestos-containing materials (ACMs) including textured coatings, pipe lagging, insulation board, and asbestos cement roofing. Our surveyors understand the specific construction types and asbestos risks found throughout the region.",
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
