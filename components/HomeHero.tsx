import Image from "next/image";
import { getSiteConfig } from "@/lib/sites/registry";
import type { DesignStyle } from "@/lib/types";
import ContactForm from "./ContactForm";

const FEATURE_ICONS = ["🛡️", "🏅", "⚡", "💷"];

export default function HomeHero() {
  const { hero, phoneHref, phoneDisplay, designStyle = "classic", services, region } =
    getSiteConfig();
  const style: DesignStyle = designStyle;
  const serviceOptions = services.map((s) => s.title);
  const trustFeatures = hero.trustPills.map((pill, i) => ({
    icon: FEATURE_ICONS[i % FEATURE_ICONS.length],
    text: pill.replace(/^[✓✅]\s*/, ""),
  }));

  if (style === "banner") {
    return (
      <section className="hero hero-banner-style">
        <div className="hero-bg">
          <Image src={hero.image} alt="" fill priority sizes="100vw" />
        </div>
        <div className="container">
          <div className="hero-banner">
            <div className="hero-left">
              <div className="tag" style={{ marginBottom: 16 }}>
                {hero.tag}
              </div>
              <h1>
                <em>HSE Licensed Specialists</em>
                {hero.titleBefore}
                <br />
                {hero.titleHighlight}
              </h1>
              <p className="hero-sub">{hero.subtitle}</p>
              <div className="hero-btns">
                <a href={phoneHref} className="btn" style={{ background: "#fff", color: "var(--p)" }}>
                  📞 {phoneDisplay}
                </a>
                <a href="/contact" className="btn btn-w">
                  Get Free Quote
                </a>
              </div>
              <div className="hero-checks">
                {trustFeatures.map((f) => (
                  <div className="hc" key={f.text}>
                    {f.text}
                  </div>
                ))}
              </div>
            </div>
            <div className="hero-right">
              <h3>Free Quote — No Obligation</h3>
              <p>Our team responds within 2 hours</p>
              <ContactForm serviceOptions={serviceOptions} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (style === "bold") {
    return (
      <section className="hero hero-bold">
        <div className="hero-bg">
          <Image src={hero.image} alt="" fill priority sizes="100vw" />
        </div>
        <div className="container">
          <div className="hero-inner hero-inner-centered">
            <div className="tag">{hero.tag}</div>
            <h1>
              {hero.titleBefore}
              <br />
              <em>{hero.titleHighlight}</em>
              <br />
              {hero.titleAfter}
            </h1>
            <p className="hero-sub">{hero.subtitle}</p>
            <div className="hero-btns">
              <a href={phoneHref} className="btn btn-p">
                📞 {phoneDisplay}
              </a>
              <a href="/contact" className="btn btn-a">
                Get Free Quote
              </a>
            </div>
            <ContactForm variant="inline" serviceOptions={serviceOptions} />
            <div className="trust-strip">
              {trustFeatures.map((f) => (
                <span className="ts" key={f.text}>
                  ✅ {f.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const formWrapClass = style === "clean" ? "lead-box" : "lead-card";

  return (
    <section className={`hero hero-${style}`}>
      <div className="hero-bg">
        <Image src={hero.image} alt="" fill priority sizes="100vw" />
      </div>
      <div className="container">
        <div className="hero-inner">
          <div>
            {style === "card" ? (
              <div className="hero-label">⭐ Trusted in {region}</div>
            ) : style === "clean" ? (
              <div className="hero-eyebrow">{hero.tag}</div>
            ) : (
              <div className="tag">{hero.tag}</div>
            )}

            {style === "sidebar" ? (
              <h1>
                {hero.titleBefore}
                <br />
                <b>{hero.titleHighlight}</b>
                <br />
                {hero.titleAfter}
              </h1>
            ) : style === "clean" ? (
              <h1>
                {hero.titleBefore}
                <span>{hero.titleHighlight}</span>
                {hero.titleAfter}
              </h1>
            ) : (
              <h1>
                {hero.titleBefore}
                <br />
                <span>{hero.titleHighlight}</span>
                <br />
                {hero.titleAfter}
              </h1>
            )}

            <p className="hero-sub">{hero.subtitle}</p>

            {style === "sidebar" && (
              <div className="hero-features">
                {trustFeatures.map((f) => (
                  <div className="hf-item" key={f.text}>
                    <div className="hf-ico">{f.icon}</div>
                    {f.text}
                  </div>
                ))}
              </div>
            )}

            <div className="hero-btns">
              <a
                href={phoneHref}
                className="btn btn-p"
                style={
                  style === "classic" || style === "sidebar"
                    ? { background: "#fff", color: "var(--p)" }
                    : undefined
                }
              >
                📞 {phoneDisplay}
              </a>
              <a
                href="/contact"
                className={`btn ${style === "card" || style === "clean" ? "btn-a" : "btn-w"}`}
              >
                {style === "card" || style === "clean" ? "Free Quote →" : "Get Free Quote"}
              </a>
            </div>

            {style === "card" && (
              <div className="hero-trust">
                {trustFeatures.map((f) => (
                  <div className="ht" key={f.text}>
                    {f.icon} {f.text}
                  </div>
                ))}
              </div>
            )}
            {style === "clean" && (
              <div className="hero-trust">
                {trustFeatures.map((f) => (
                  <div className="ht" key={f.text}>
                    {f.text}
                  </div>
                ))}
              </div>
            )}
            {style === "classic" && (
              <div className="trust-pills">
                {hero.trustPills.map((pill) => (
                  <span className="tp" key={pill}>
                    {pill}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={formWrapClass}>
            <h3>
              {style === "sidebar"
                ? "Free Quote — 2hr Response"
                : style === "clean"
                  ? "Free Quote — Fast Response"
                  : style === "card"
                    ? "Get Your Free Quote"
                    : "Request a Free Quote"}
            </h3>
            <p>
              {style === "sidebar"
                ? "No obligation. Fast callback guaranteed."
                : style === "card"
                  ? "2-hour response guaranteed"
                  : "We'll respond within 2 hours"}
            </p>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
