import Image from "next/image";
import { getSiteConfig } from "@/lib/sites/registry";

export default function WhyChooseUs() {
  const { whyChooseUs } = getSiteConfig();

  return (
    <div className="section">
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }} className="why-grid">
          <div className="why-image-wrap">
            <Image src={whyChooseUs.image} alt="" fill sizes="(max-width: 1024px) 100vw, 50vw" />
            <div className="why-badge">
              <div className="why-badge-n">{whyChooseUs.badgeNumber}</div>
              <div className="why-badge-l">{whyChooseUs.badgeLabel}</div>
            </div>
          </div>
          <div>
            <div className="tag">Why Choose Us</div>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--d)", marginBottom: 12 }}>
              {whyChooseUs.title}
            </h2>
            <p style={{ color: "#666", marginBottom: 16 }}>{whyChooseUs.subtitle}</p>
            <div className="why-list">
              {whyChooseUs.items.map((item) => (
                <div className="wi" key={item.title}>
                  <div className="wi-ico">{item.icon}</div>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
