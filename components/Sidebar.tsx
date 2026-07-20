import Link from "next/link";
import { getSiteConfig } from "@/lib/sites/registry";
import ContactForm from "./ContactForm";

export default function Sidebar({ activeSlug }: { activeSlug?: string }) {
  const { services, areas, phoneHref, phoneDisplay, city } = getSiteConfig();

  return (
    <div>
      <div className="sb-card">
        <h4>All Services</h4>
        {services.map((s) => (
          <Link
            key={s.slug}
            href={`/services/${s.slug}`}
            className={`sb-link${activeSlug === s.slug ? " active" : ""}`}
          >
            {s.title}
          </Link>
        ))}
        <Link href="/areas" className={`sb-link${activeSlug === "areas" ? " active" : ""}`}>
          Coverage Areas Near {city}
        </Link>
        <Link
          href="/services/cost"
          className={`sb-link${activeSlug === "cost" ? " active" : ""}`}
        >
          How Much Does It Cost?
        </Link>
        {areas.slice(0, 5).map((a) => (
          <Link
            key={a.slug}
            href={`/areas/${a.slug}`}
            className="sb-link"
            style={{ paddingLeft: 8, fontSize: ".8rem" }}
          >
            {a.name}
          </Link>
        ))}
      </div>
      <div className="sb-cta">
        <h4>Free Quote</h4>
        <p>Our {city} team responds within 2 hours</p>
        <a href={phoneHref} className="sb-phone">
          {phoneDisplay}
        </a>
        <div className="sb-form">
          <ContactForm
            variant="compact"
            serviceOptions={[...services.map((s) => s.title), "Emergency Response", "General Enquiry"]}
          />
        </div>
      </div>
    </div>
  );
}
