import Link from "next/link";
import type { Service } from "@/lib/types";

export default function ServicesGrid({
  services,
  city,
}: {
  services: Service[];
  city: string;
}) {
  return (
    <div className="section" style={{ background: "var(--bg)" }}>
      <div className="container">
        <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 44px" }}>
          <div className="tag">Our Services</div>
          <h2 style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--d)", marginBottom: 12, letterSpacing: "-.02em" }}>
            Complete Asbestos Management in {city}
          </h2>
          <p style={{ color: "#777", lineHeight: 1.7 }}>
            From initial survey to safe removal and certified disposal, we provide end-to-end asbestos
            management for all property types.
          </p>
        </div>
        <div className="svc-grid">
          {services.map((s) => (
            <Link href={`/services/${s.slug}`} className="svc" key={s.slug}>
              <div className="svc-ico">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.shortDescription}</p>
              <span className="svc-more">Learn More →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
