import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import FaqAccordion from "@/components/FaqAccordion";
import { getSiteConfig } from "@/lib/sites/registry";

export function generateMetadata(): Metadata {
  const siteConfig = getSiteConfig();
  return {
    title: `Contact ${siteConfig.businessName} | Free Quotes`,
  };
}

export default function ContactPage() {
  const { businessName, city, region, phoneHref, phoneDisplay, email, hero, services, faqs } = getSiteConfig();

  const serviceOptions = [...services.map((s) => s.title), "Emergency Response", "General Enquiry"];

  return (
    <div className="page active">
      <PageHero
        image={hero.image}
        title={`Contact ${businessName}`}
        subtitle={`Get in touch for free advice, quotes, and emergency asbestos services across ${city} and ${region}.`}
        breadcrumb={[{ label: "Home", href: "/" }, { label: `Contact ${businessName}` }]}
      />

      <div className="section">
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }}>
            <div>
              <div className="tag">Get in Touch</div>
              <h2 style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--d)", marginBottom: 12, letterSpacing: "-.01em" }}>
                We&apos;re Here to Help
              </h2>
              <p style={{ color: "#666", marginBottom: 28, lineHeight: 1.75 }}>
                Whether you need urgent advice, a survey quote, or emergency removal across {city} or {region},
                our friendly team is ready to assist.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 24 }}>
                <ContactRow icon="📞" label="Phone">
                  <a href={phoneHref} style={{ color: "var(--p)", fontWeight: 600 }}>
                    {phoneDisplay}
                  </a>
                </ContactRow>
                <ContactRow icon="🚨" label="24/7 Emergency">
                  <a href={phoneHref} style={{ color: "var(--p)" }}>
                    {phoneDisplay}
                  </a>
                </ContactRow>
                <ContactRow icon="✉️" label="Email">
                  <a href={`mailto:${email}`} style={{ color: "var(--p)" }}>
                    {email}
                  </a>
                </ContactRow>
                <ContactRow icon="📍" label="Service Area">
                  {city} and all of {region}
                </ContactRow>
                <ContactRow icon="🕐" label="Hours">
                  Mon–Fri: 7am–6pm · Sat: 8am–1pm · Emergency: 24/7
                </ContactRow>
              </div>
            </div>

            <div style={{ background: "#fff", border: "1.5px solid #eee", borderRadius: 16, padding: 36, boxShadow: "0 4px 24px rgba(0,0,0,.04)" }}>
              <h3 style={{ fontSize: "1.2rem", color: "var(--d)", marginBottom: 4 }}>Send Us a Message</h3>
              <p style={{ fontSize: ".82rem", color: "#888", marginBottom: 20 }}>Response within 2 business hours.</p>
              <ContactForm
                serviceOptions={serviceOptions}
                successTitle="Message Sent!"
                successBody="We'll respond within 2 business hours."
                submitLabel="Send Message →"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="section" style={{ background: "var(--bg)", borderTop: "1px solid #eee" }}>
        <div className="container-sm">
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div className="tag">FAQs</div>
            <h2 style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--d)" }}>Frequently Asked Questions</h2>
          </div>
          <FaqAccordion faqs={faqs} />
        </div>
      </div>
    </div>
  );
}

function ContactRow({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div
        style={{
          width: 42,
          height: 42,
          background: "var(--a)",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: "1.1rem",
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 700, color: "var(--d)", marginBottom: 2 }}>{label}</div>
        <p style={{ color: "#666", margin: 0, fontSize: ".9rem" }}>{children}</p>
      </div>
    </div>
  );
}
