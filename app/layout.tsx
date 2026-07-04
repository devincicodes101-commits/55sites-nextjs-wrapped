import type { Metadata } from "next";
import ThemeStyle from "@/components/ThemeStyle";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getSiteConfig } from "@/lib/sites/registry";
import "./globals.css";

export function generateMetadata(): Metadata {
  const siteConfig = getSiteConfig();
  return {
    title: `${siteConfig.city} Asbestos Removal | HSE Licensed Specialists | ${siteConfig.region}`,
    description: `HSE-licensed asbestos removal, survey & testing in ${siteConfig.city}, ${siteConfig.region}. Free quotes, same-day response. Call today.`,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const siteConfig = getSiteConfig();
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800;900&family=Source+Sans+3:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <ThemeStyle />
      </head>
      <body>
        <SiteHeader siteConfig={siteConfig} />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
