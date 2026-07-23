import Link from "next/link";
import { getSiteConfig } from "@/lib/sites/registry";

export default function SiteFooter() {
  const siteConfig = getSiteConfig();
  const { businessName, logoLetter, city, region, phoneDisplay, phoneHref, email, foundedYear, services, areas } =
    siteConfig;

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ flexShrink: 0, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}
              >
                <defs>
                  <linearGradient id="logo-grad-footer" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.7)" />
                  </linearGradient>
                </defs>
                <polygon points="13,3 27,3 37,13 37,27 27,37 13,37 3,27 3,13" fill="url(#logo-grad-footer)" />
                <polygon
                  points="14.5,5.5 25.5,5.5 34.5,14.5 34.5,25.5 25.5,34.5 14.5,34.5 5.5,25.5 5.5,14.5"
                  fill="rgba(255,255,255,0.09)"
                />
                <text
                  x="20"
                  y="25.5"
                  textAnchor="middle"
                  fontSize="16"
                  fontWeight="900"
                  fontFamily="Arial,sans-serif"
                  fill={siteConfig.theme.primary}
                >
                  {logoLetter}
                </text>
              </svg>
              <span>{businessName}</span>
            </div>
            <p className="footer-desc">
              HSE-licensed asbestos removal, survey, testing, and disposal specialists serving {city} and{" "}
              {region}. Protecting properties and people since {foundedYear}.
            </p>
            <div style={{ fontSize: ".85rem", marginBottom: 6 }}>
              📞 <a href={phoneHref} style={{ color: "#fff" }}>{phoneDisplay}</a>
            </div>
            <div style={{ fontSize: ".85rem", marginBottom: 16 }}>
              ✉️{" "}
              <a href={`mailto:${email}`} style={{ color: "rgba(255,255,255,.6)" }}>
                {email}
              </a>
            </div>
            <div className="badges">
              <span className="badge">🛡️ HSE Licensed</span>
              <span className="badge">🏅 UKAS Accredited</span>
              <span className="badge">🔒 £10M Insured</span>
            </div>
          </div>

          <div>
            <h5>Services</h5>
            {services.map((s) => (
              <Link key={s.slug} href={`/services/${s.slug}`} className="footer-link">
                {s.title}
              </Link>
            ))}
          </div>

          <div>
            <h5>Company</h5>
            <Link href="/" className="footer-link">
              Home
            </Link>
            <Link href="/contact" className="footer-link">
              Contact Us
            </Link>
          </div>

          <div>
            <h5>Coverage Areas</h5>
            {areas.slice(0, 6).map((a) => (
              <Link key={a.slug} href={`/areas/${a.slug}`} className="footer-link">
                {a.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} {businessName}. All rights reserved.
          </p>
          <p>HSE Licensed · UKAS Accredited · BS 8520 Compliant</p>
        </div>
      </div>
    </footer>
  );
}
