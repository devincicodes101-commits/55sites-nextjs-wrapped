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

      <div style={{ background: "#f9fafb", borderTop: "1px solid #eee", padding: "40px 0" }}>
        <div className="container">
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#444", marginBottom: 16 }}>
            {seoKeywordBlock.title}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {seoKeywordBlock.columns.map((col) => (
              <div key={col.heading}>
                <h3
                  style={{
                    fontSize: ".82rem",
                    fontWeight: 700,
                    color: "#333",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: ".04em",
                  }}
                >
                  {col.heading}
                </h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {col.items.map((item) => (
                    <li key={item} style={{ fontSize: ".8rem", color: "#666", padding: "3px 0", borderBottom: "1px solid #eee" }}>
                      → {item}
                    </li>
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
