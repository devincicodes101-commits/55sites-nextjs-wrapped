import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getSiteConfig } from "@/lib/sites/registry";
import PageHero from "@/components/PageHero";
import ContentBlocks from "@/components/ContentBlocks";
import Sidebar from "@/components/Sidebar";
import CtaBanner from "@/components/CtaBanner";

// No generateStaticParams here: each domain has its own set of valid area
// slugs (from its own site config), so these pages render per-request
// rather than being statically generated at build time.

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const siteConfig = getSiteConfig();
  const area = siteConfig.areas.find((a) => a.slug === params.slug);
  if (!area) return {};
  return {
    title: `Asbestos Removal in ${area.name} | ${siteConfig.businessName}`,
  };
}

export default function AreaPage({ params }: { params: { slug: string } }) {
  const siteConfig = getSiteConfig();
  const area = siteConfig.areas.find((a) => a.slug === params.slug);
  if (!area) notFound();

  const { city } = siteConfig;

  return (
    <div className="page active">
      <PageHero
        image={area.heroImage}
        title={`Asbestos Removal in ${area.name}`}
        subtitle={`Professional HSE-licensed asbestos removal, surveys, testing, and disposal serving ${area.name} from our ${city} base. Same-day response available.`}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Coverage Areas", href: "/areas" },
          { label: area.name },
        ]}
      />

      <div className="section">
        <div className="container">
          <div className="content-grid">
            <div className="content-body">
              <figure style={{ margin: "0 0 28px", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}>
                <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 10" }}>
                  <Image src={area.heroImage} alt={area.figureCaption} fill style={{ objectFit: "cover" }} />
                </div>
                <figcaption style={{ fontSize: ".75rem", color: "#999", padding: "8px 12px", background: "#f9f9f9" }}>
                  {area.figureCaption}
                </figcaption>
              </figure>
              <h2>Asbestos Services in {area.name}, {siteConfig.region}</h2>
              <ContentBlocks blocks={area.content} />
            </div>
            <Sidebar />
          </div>
        </div>
      </div>

      <CtaBanner
        title={`Ready to Book Asbestos Services in ${area.name}?`}
        subtitle={`Call our ${city} team or fill in our quick form — we'll respond within 2 hours.`}
        variant="strip"
      />
    </div>
  );
}
