import Image from "next/image";
import { getSiteConfig } from "@/lib/sites/registry";
import ContactForm from "./ContactForm";

export default function HomeHero() {
  const { hero, phoneHref, phoneDisplay } = getSiteConfig();

  return (
    <section className="hero">
      <div className="hero-bg">
        <Image src={hero.image} alt="" fill priority sizes="100vw" />
      </div>
      <div className="container">
        <div className="hero-inner">
          <div>
            <div className="tag">{hero.tag}</div>
            <h1>
              {hero.titleBefore}
              <br />
              <span>{hero.titleHighlight}</span>
              <br />
              {hero.titleAfter}
            </h1>
            <p className="hero-sub">{hero.subtitle}</p>
            <div className="hero-btns">
              <a href={phoneHref} className="btn btn-p" style={{ background: "#fff", color: "var(--p)" }}>
                📞 {phoneDisplay}
              </a>
              <a href="/contact" className="btn btn-w">
                Get Free Quote
              </a>
            </div>
            <div className="trust-pills">
              {hero.trustPills.map((pill) => (
                <span className="tp" key={pill}>
                  {pill}
                </span>
              ))}
            </div>
          </div>
          <div className="lead-card">
            <h3>Request a Free Quote</h3>
            <p>We&apos;ll respond within 2 hours</p>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
