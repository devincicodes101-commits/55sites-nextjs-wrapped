// Shared content-block model used to render the rich text body of
// service pages and area pages from plain data (no HTML strings required).
export type ContentBlock =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "callout"; tone: "info" | "warning"; text: string }
  | { type: "priceGrid"; items: PriceItem[] }
  | { type: "infoCards"; items: InfoCard[] };

export interface InfoCard {
  icon: string;
  title: string;
  text: string;
}

export interface PriceItem {
  label: string;
  price: string;
  unit?: string;
  note: string;
  featured?: boolean;
}

export interface Service {
  slug: string;
  icon: string;
  title: string;
  shortDescription: string;
  heroImage: string;
  pageSubtitle: string;
  figureCaption: string;
  content: ContentBlock[];
}

export interface Area {
  slug: string;
  name: string;
  blurb: string;
  tags: string[];
  heroImage: string;
  figureCaption: string;
  content: ContentBlock[];
}

export interface Testimonial {
  initials: string;
  name: string;
  location: string;
  quote: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Stat {
  value: string;
  label: string;
}

export interface ProcessStep {
  title: string;
  text: string;
}

export interface WhyItem {
  icon: string;
  title: string;
  text: string;
}

export interface TrustBarItem {
  icon: string;
  label: string;
}

export interface LocalFact {
  label: string;
  text: string;
}

export interface SeoKeywordColumn {
  heading: string;
  items: string[];
}

/** Matches the six Base44 / static-HTML layout families. */
export type DesignStyle = "classic" | "bold" | "sidebar" | "card" | "banner" | "clean";

export interface SiteConfig {
  businessName: string;
  logoLetter: string;
  city: string;
  region: string;
  country: string;
  phoneDisplay: string;
  phoneHref: string;
  email: string;
  foundedYear: number;
  domain: string;

  /** Layout family from the original HTML. Always set by getSiteConfig(). */
  designStyle?: DesignStyle;

  theme: {
    primary: string;
    secondary: string;
    accent: string;
    dark: string;
    bg: string;
  };

  nav: {
    hours: string;
  };

  hero: {
    tag: string;
    titleBefore: string;
    titleHighlight: string;
    titleAfter: string;
    subtitle: string;
    image: string;
    trustPills: string[];
  };

  stats: Stat[];
  trustBar: TrustBarItem[];
  services: Service[];

  localInfo: {
    tag: string;
    title: string;
    paragraphs: string[];
    facts: LocalFact[];
    calloutText: string;
    keywords: string[];
  };

  whyChooseUs: {
    image: string;
    badgeNumber: string;
    badgeLabel: string;
    title: string;
    subtitle: string;
    items: WhyItem[];
  };

  process: ProcessStep[];
  testimonials: Testimonial[];
  areas: Area[];
  areaIndex: {
    heroImage: string;
    intro: string[];
  };
  pricing: PriceItem[];
  faqs: FAQ[];

  seoKeywordBlock: {
    title: string;
    columns: SeoKeywordColumn[];
  };
}
