import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/sites/registry";
import PageHero from "@/components/PageHero";
import AreaGrid from "@/components/AreaGrid";
import Sidebar from "@/components/Sidebar";
import CtaBanner from "@/components/CtaBanner";

export function generateMetadata(): Metadata {
  const siteConfig = getSiteConfig();
  return {
    title: `Asbestos Removal Near Me — ${siteConfig.city} & ${siteConfig.region}`,
  };
}

export default function AreasIndexPage() {
  const { city, region, areas, areaIndex } = getSiteConfig();

  return (
    <div className="page active">
      <PageHero
        image={areaIndex.heroImage}
        title={`Asbestos Removal Near Me — ${city} & ${region}`}
        subtitle={`Looking for asbestos removal near you in ${city}? Our local teams cover all areas of ${region}. Same-day response, emergency service available 24/7.`}
        breadcrumb={[{ label: "Home", href: "/" }, { label: `Asbestos Removal Near Me — ${city} & ${region}` }]}
      />

      <div className="section">
        <div className="container">
          <div className="content-grid">
            <div className="content-body">
              <h2>Asbestos Removal Near Me in {city}, {region}</h2>
              {areaIndex.intro.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <h2>Coverage Areas Near {city}</h2>
              <p>
                We provide a full range of asbestos services — surveys, testing, licensed removal, and disposal —
                throughout {city} and every surrounding area listed below.
              </p>
              <AreaGrid areas={areas} />
              <h2>Why Choose a Local {city} Asbestos Specialist?</h2>
              <p>
                Choosing a locally based asbestos removal company in {city} means faster response times, better
                knowledge of local property types, and lower mobilisation costs.
              </p>
            </div>
            <Sidebar activeSlug="areas" />
          </div>
        </div>
      </div>

      <CtaBanner
        title={`Get a Free Quote for Your ${city} Property`}
        subtitle={`Our ${region} team is ready to help.`}
        variant="strip"
      />
    </div>
  );
}
