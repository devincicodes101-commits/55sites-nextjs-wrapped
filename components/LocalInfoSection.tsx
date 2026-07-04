import { getSiteConfig } from "@/lib/sites/registry";

export default function LocalInfoSection() {
  const { localInfo, phoneHref, phoneDisplay } = getSiteConfig();

  return (
    <div className="section" style={{ background: "var(--bg)", borderTop: "1px solid #eee", borderBottom: "1px solid #eee" }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 56, alignItems: "start" }}>
          <div>
            <div className="tag">{localInfo.tag}</div>
            <h2 style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--d)", marginBottom: 14, letterSpacing: "-.02em" }}>
              {localInfo.title}
            </h2>
            {localInfo.paragraphs.map((p, i) => (
              <p key={i} style={{ color: "#555", lineHeight: 1.8, marginBottom: i === localInfo.paragraphs.length - 1 ? 22 : 16, fontSize: ".97rem" }}>
                {p}
              </p>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              {localInfo.facts.map((fact, i) => (
                <div
                  key={fact.label}
                  style={{
                    background: "#fff",
                    border: "1.5px solid #eee",
                    borderLeft: `3px solid ${i === 0 ? "var(--p)" : "var(--s)"}`,
                    borderRadius: 8,
                    padding: 18,
                  }}
                >
                  <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--p)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>
                    {fact.label}
                  </div>
                  <p style={{ fontSize: ".88rem", color: "var(--d)", lineHeight: 1.65, margin: 0, fontWeight: 500 }}>
                    {fact.text}
                  </p>
                </div>
              ))}
            </div>
            <div className="hbox">
              <p>{localInfo.calloutText}</p>
            </div>
          </div>
          <div>
            <div style={{ background: "var(--d)", borderRadius: 14, padding: 28, color: "#fff", marginBottom: 20 }}>
              <div style={{ fontSize: ".8rem", fontWeight: 700, color: "rgba(255,255,255,.6)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>
                Free Site Survey
              </div>
              <div style={{ fontSize: "1.7rem", fontWeight: 900, color: "#fff", marginBottom: 8, letterSpacing: "-.02em" }}>
                Same-Day Response
              </div>
              <p style={{ color: "rgba(255,255,255,.7)", fontSize: ".88rem", lineHeight: 1.65, marginBottom: 18 }}>
                Our team responds to all enquiries within 2 hours. Emergency callout available 24/7.
              </p>
              <a href={phoneHref} className="btn" style={{ width: "100%", justifyContent: "center", background: "#fff", color: "var(--p)", marginBottom: 10, display: "flex" }}>
                📞 {phoneDisplay}
              </a>
              <a href="/contact" className="btn btn-w" style={{ width: "100%", justifyContent: "center", display: "flex" }}>
                Request Free Quote →
              </a>
            </div>
            <div style={{ background: "#fff", border: "1.5px solid #eee", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: ".8rem", fontWeight: 700, color: "var(--d)", marginBottom: 12 }}>
                Top Keywords We Rank For:
              </div>
              {localInfo.keywords.map((kw) => (
                <div
                  key={kw}
                  style={{
                    display: "inline-block",
                    background: "var(--a)",
                    border: "1px solid var(--p)",
                    color: "var(--p)",
                    borderRadius: 6,
                    padding: "4px 10px",
                    fontSize: ".75rem",
                    fontWeight: 700,
                    margin: 3,
                  }}
                >
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
