import type { Metadata, Viewport } from "next";
import ThemeStyle from "@/components/ThemeStyle";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ChatAgent from "@/components/ChatAgent";
import { getSiteConfig } from "@/lib/sites/registry";
import "./globals.css";
import "./design-variants.css";

export function generateMetadata(): Metadata {
  const s = getSiteConfig();
  const url = `https://${s.domain}`;
  const title = `${s.city} Asbestos Removal | HSE Licensed Specialists | ${s.region}`;
  const description = `HSE-licensed asbestos removal, survey & testing in ${s.city}, ${s.region}. Free fixed-price quotes, same-day response. Call ${s.phoneDisplay}.`;
  const image = s.hero?.image;
  return {
    metadataBase: new URL(url),
    title,
    description,
    applicationName: s.businessName,
    authors: [{ name: s.businessName }],
    keywords: [
      `asbestos removal ${s.city}`,
      `asbestos survey ${s.city}`,
      `asbestos testing ${s.city}`,
      `licensed asbestos removal ${s.city}`,
      `asbestos disposal ${s.city}`,
      `asbestos contractors ${s.city}`,
      "asbestos removal near me",
    ],
    alternates: { canonical: url },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    openGraph: {
      type: "website",
      siteName: s.businessName,
      locale: "en_GB",
      url,
      title,
      description,
      images: image ? [{ url: image, width: 1200, height: 630, alt: `${s.businessName} — asbestos removal in ${s.city}` }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export function generateViewport(): Viewport {
  const s = getSiteConfig();
  return { themeColor: s.theme?.dark ?? "#111111" };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const siteConfig = getSiteConfig();
  const style = siteConfig.designStyle ?? "classic";
  const url = `https://${siteConfig.domain}`;

  // Structured data (rich results): LocalBusiness + the core services + breadcrumb.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": `${url}#business`,
        name: siteConfig.businessName,
        description: `HSE-licensed asbestos removal, survey and testing across ${siteConfig.city}, ${siteConfig.region}.`,
        url,
        telephone: siteConfig.phoneDisplay,
        areaServed: { "@type": "Place", name: `${siteConfig.city}, ${siteConfig.region}` },
        address: {
          "@type": "PostalAddress",
          addressLocality: siteConfig.city,
          addressRegion: siteConfig.region,
          addressCountry: "GB",
        },
        priceRange: "££",
        image: siteConfig.hero?.image,
      },
      {
        "@type": "Service",
        name: `Asbestos Removal in ${siteConfig.city}`,
        serviceType: "Asbestos removal, survey and testing",
        provider: { "@id": `${url}#business` },
        areaServed: `${siteConfig.city}, ${siteConfig.region}`,
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "GBP",
          lowPrice: "250",
          highPrice: "2500",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: url },
          { "@type": "ListItem", position: 2, name: `${siteConfig.city} Asbestos Removal` },
        ],
      },
    ],
  };

  return (
    <html lang="en" data-style={style}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&family=Merriweather:wght@400;700;900&family=Montserrat:wght@400;600;700;800;900&family=Nunito:wght@300;400;600;700;800&family=Open+Sans:wght@300;400;600;700&family=Oswald:wght@400;500;600;700&family=PT+Sans:wght@400;700&family=Playfair+Display:wght@400;600;700;800;900&family=Poppins:wght@400;500;600;700;800;900&family=Raleway:wght@400;600;700;800;900&family=Roboto:wght@300;400;500;700&family=Source+Sans+3:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <ThemeStyle />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body data-style={style}>
        <noscript>
          <div style={{ padding: "12px 16px", background: "#111", color: "#fff", textAlign: "center", fontSize: 14 }}>
            {siteConfig.businessName} — HSE-licensed asbestos removal in {siteConfig.city}. Call{" "}
            <a href={siteConfig.phoneHref} style={{ color: "#fff", fontWeight: 700 }}>{siteConfig.phoneDisplay}</a> for a free quote.
          </div>
        </noscript>
        <SiteHeader siteConfig={siteConfig} />
        <main>{children}</main>
        <SiteFooter />
        <ChatAgent
          businessName={siteConfig.businessName}
          primary={siteConfig.theme?.primary ?? "#c2410c"}
          dark={siteConfig.theme?.dark ?? "#1f2937"}
        />
      </body>
    </html>
  );
}
