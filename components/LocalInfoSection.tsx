import { getSiteConfig } from "@/lib/sites/registry";

export default function LocalInfoSection() {
  const { localInfo, phoneHref, phoneDisplay } = getSiteConfig();

  return (
    <div className="section local-info" style={{ background: "var(--bg)", borderTop: "1px solid #eee", borderBottom: "1px solid #eee" }}>
      <div className="container">
        <div className="local-info-grid">
          <div>
            <div className="tag">{localInfo.tag}</div>
            <h2 className="local-info-title">{localInfo.title}</h2>
            {localInfo.paragraphs.map((p, i) => (
              <p
                key={i}
                className="local-info-p"
                style={{ marginBottom: i === localInfo.paragraphs.length - 1 ? 22 : 16 }}
              >
                {p}
              </p>
            ))}
            <div className="local-info-facts">
              {localInfo.facts.map((fact, i) => (
                <div
                  key={fact.label}
                  className="local-info-fact"
                  style={{ borderLeftColor: i === 0 ? "var(--p)" : "var(--s)" }}
                >
                  <div className="local-info-fact-label">{fact.label}</div>
                  <p className="local-info-fact-text">{fact.text}</p>
                </div>
              ))}
            </div>
            <div className="hbox">
              <p>{localInfo.calloutText}</p>
            </div>
          </div>
          <div className="local-info-side">
            <div className="local-info-cta">
              <div className="local-info-cta-label">Free Site Survey</div>
              <div className="local-info-cta-title">Same-Day Response</div>
              <p className="local-info-cta-text">
                Our team responds to all enquiries within 2 hours. Emergency callout available 24/7.
              </p>
              <a
                href={phoneHref}
                className="btn"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  background: "#fff",
                  color: "var(--p)",
                  marginBottom: 10,
                  display: "flex",
                }}
              >
                📞 {phoneDisplay}
              </a>
              <a
                href="/contact"
                className="btn btn-w"
                style={{ width: "100%", justifyContent: "center", display: "flex" }}
              >
                Request Free Quote →
              </a>
            </div>
            <div className="local-info-keywords">
              <div className="local-info-keywords-title">Top Keywords We Rank For:</div>
              {localInfo.keywords.map((kw) => (
                <div key={kw} className="local-info-kw">
                  {kw}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
