import type { Metadata } from "next";
import ThemeStyle from "@/components/ThemeStyle";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getSiteConfig } from "@/lib/sites/registry";
import "./globals.css";
import "./design-variants.css";

export function generateMetadata(): Metadata {
  const siteConfig = getSiteConfig();
  return {
    title: `${siteConfig.city} Asbestos Removal | HSE Licensed Specialists | ${siteConfig.region}`,
    description: `HSE-licensed asbestos removal, survey & testing in ${siteConfig.city}, ${siteConfig.region}. Free quotes, same-day response. Call today.`,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const siteConfig = getSiteConfig();
  const style = siteConfig.designStyle ?? "classic";
  return (
    <html lang="en" data-style={style}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&family=Merriweather:wght@400;700;900&family=Montserrat:wght@400;600;700;800;900&family=Nunito:wght@300;400;600;700;800&family=Open+Sans:wght@300;400;600;700&family=Oswald:wght@400;500;600;700&family=PT+Sans:wght@400;700&family=Playfair+Display:wght@400;600;700;800;900&family=Poppins:wght@400;500;600;700;800;900&family=Raleway:wght@400;600;700;800;900&family=Roboto:wght@300;400;500;700&family=Source+Sans+3:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <ThemeStyle />
      </head>
      <body data-style={style}>
        <SiteHeader siteConfig={siteConfig} />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
