import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getSiteConfig } from "@/lib/sites/registry";
import PageHero from "@/components/PageHero";
import ContentBlocks from "@/components/ContentBlocks";
import Sidebar from "@/components/Sidebar";
import CtaBanner from "@/components/CtaBanner";

// No generateStaticParams here: each domain has its own set of valid
// service slugs (from its own site config), so these pages render
// per-request rather than being statically generated at build time.

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const siteConfig = getSiteConfig();
  const service = siteConfig.services.find((s) => s.slug === params.slug);
  if (!service) return {};
  return {
    title: `${service.title} in ${siteConfig.city} | ${siteConfig.businessName}`,
    description: service.pageSubtitle,
  };
}

export default function ServicePage({ params }: { params: { slug: string } }) {
  const siteConfig = getSiteConfig();
  const service = siteConfig.services.find((s) => s.slug === params.slug);
  if (!service) notFound();

  const { city } = siteConfig;

  return (
    <div className="page active">
      <PageHero
        image={service.heroImage}
        title={`${service.title} in ${city}`}
        subtitle={service.pageSubtitle}
        breadcrumb={[{ label: "Home", href: "/" }, { label: `${service.title} in ${city}` }]}
      />

      <div className="section">
        <div className="container">
          <div className="content-grid">
            <div className="content-body">
              <figure style={{ margin: "0 0 28px", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}>
                <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 10" }}>
                  <Image src={service.heroImage} alt={service.figureCaption} fill style={{ objectFit: "cover" }} />
                </div>
                <figcaption style={{ fontSize: ".75rem", color: "#999", padding: "8px 12px", background: "#f9f9f9" }}>
                  {service.figureCaption}
                </figcaption>
              </figure>
              <ContentBlocks blocks={service.content} />
            </div>
            <Sidebar activeSlug={service.slug} />
          </div>
        </div>
      </div>

      <CtaBanner
        title={`Get a Free Quote for Your ${city} Property`}
        subtitle={`Our ${siteConfig.region} team is ready to help.`}
        variant="strip"
      />
    </div>
  );
}
