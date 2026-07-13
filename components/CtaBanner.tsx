import { getSiteConfig } from "@/lib/sites/registry";

export default function CtaBanner({
  title,
  subtitle,
  variant = "banner",
}: {
  title: string;
  subtitle: string;
  variant?: "banner" | "strip";
}) {
  const { phoneHref, phoneDisplay, designStyle = "classic" } = getSiteConfig();

  if (variant === "strip") {
    return (
      <div className="section-sm" style={{ background: "var(--p)", color: "#fff", textAlign: "center" }}>
        <div className="container">
          <h2 style={{ color: "#fff", fontSize: "1.8rem", marginBottom: 10 }}>{title}</h2>
          <p style={{ color: "rgba(255,255,255,.8)", marginBottom: 24 }}>{subtitle}</p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={phoneHref} className="btn" style={{ background: "#fff", color: "var(--p)" }}>
              📞 {phoneDisplay}
            </a>
            <a href="/contact" className="btn btn-w">
              Contact Us →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-sm">
      <div className={designStyle === "card" || designStyle === "clean" ? undefined : "container"}>
        <div className={`cta-banner cta-${designStyle}`}>
          <h2>{title}</h2>
          <p>{subtitle}</p>
          <div className="cta-btns">
            <a href={phoneHref} className="btn btn-p" style={{ background: "#fff", color: "var(--p)" }}>
              📞 {phoneDisplay}
            </a>
            <a href="/contact" className="btn btn-w">
              Contact Us →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
