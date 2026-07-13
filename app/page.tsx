import { getSiteConfig } from "@/lib/sites/registry";
import HomeHero from "@/components/HomeHero";
import StatsRow from "@/components/StatsRow";
import TrustBar from "@/components/TrustBar";
import ServicesGrid from "@/components/ServicesGrid";
import LocalInfoSection from "@/components/LocalInfoSection";
import WhyChooseUs from "@/components/WhyChooseUs";
import ProcessSteps from "@/components/ProcessSteps";
import Testimonials from "@/components/Testimonials";
import CtaBanner from "@/components/CtaBanner";

export default function HomePage() {
  const { city, stats, trustBar, services, process, testimonials, seoKeywordBlock } = getSiteConfig();

  return (
    <div className="page active">
      <HomeHero />
      <StatsRow stats={stats} />
      <TrustBar items={trustBar} />
      <ServicesGrid services={services} city={city} />
      <LocalInfoSection />
      <WhyChooseUs />
      <ProcessSteps steps={process} city={city} />
      <Testimonials items={testimonials} city={city} />

      <div className="seo-keywords">
        <div className="container">
          <h2 className="seo-keywords-title">{seoKeywordBlock.title}</h2>
          <div className="seo-keywords-grid">
            {seoKeywordBlock.columns.map((col) => (
              <div key={col.heading}>
                <h3 className="seo-keywords-heading">{col.heading}</h3>
                <ul className="seo-keywords-list">
                  {col.items.map((item) => (
                    <li key={item}>→ {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CtaBanner
        title={`Ready to Make Your ${city} Property Safe?`}
        subtitle="Contact our team today for a free, no-obligation quote. Same-day site visits available."
      />
    </div>
  );
}
