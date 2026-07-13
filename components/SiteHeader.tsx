"use client";

import Link from "next/link";
import { useState } from "react";
import type { SiteConfig } from "@/lib/types";

export default function SiteHeader({ siteConfig }: { siteConfig: SiteConfig }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { businessName, logoLetter, city, region, phoneDisplay, phoneHref, nav, services, areas, designStyle = "classic" } =
    siteConfig;
  const showNavTop = designStyle === "classic";

  return (
    <>
      {showNavTop && (
      <div className="nav-top">
        <div className="container">
          <div className="nav-top-inner">
            <span>
              📍 {city}, {region}
            </span>
            <div style={{ display: "flex", gap: 20 }}>
              <span>🕐 {nav.hours}</span>
              <a href={phoneHref} style={{ color: "#fff", fontWeight: 700 }}>
                📞 {phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      </div>
      )}

      <nav className={`nav nav-${designStyle}`}>
        <div className="container">
          <div className="nav-inner">
            <Link
              href="/"
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ flexShrink: 0, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}
              >
                <defs>
                  <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={siteConfig.theme.primary} />
                    <stop offset="100%" stopColor={siteConfig.theme.secondary} />
                  </linearGradient>
                </defs>
                <polygon points="13,3 27,3 37,13 37,27 27,37 13,37 3,27 3,13" fill="url(#logo-grad)" />
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
                  fill="#ffffff"
                >
                  {logoLetter}
                </text>
              </svg>
              <div>
                <div className="logo-name">{businessName}</div>
                <div className="logo-sub">HSE Licensed · UKAS Accredited</div>
              </div>
            </Link>

            <div className="nav-links">
              <Link href="/" className="nl">
                Home
              </Link>
              <div className="nl nl-dd">
                Services ▾
                <div className="dd">
                  {services.map((s) => (
                    <Link key={s.slug} href={`/services/${s.slug}`}>
                      {s.title}
                    </Link>
                  ))}
                  <Link href="/areas">Coverage Areas</Link>
                </div>
              </div>
              <Link href="/contact" className="nl">
                Contact
              </Link>
              <Link href="/contact" className="nav-cta">
                Free Quote
              </Link>
            </div>

            <button
              className="ham"
              aria-label="Toggle menu"
              onClick={() => setMobileOpen((o) => !o)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      <div className={`mob-nav${mobileOpen ? " open" : ""}`}>
        <button className="mob-close" onClick={() => setMobileOpen(false)}>
          ✕
        </button>
        <Link href="/" className="mob-link" onClick={() => setMobileOpen(false)}>
          Home
        </Link>
        <div className="mob-link" style={{ color: "#aaa", fontSize: ".8rem", cursor: "default" }}>
          Services
        </div>
        <div className="mob-sub">
          {services.map((s) => (
            <Link key={s.slug} href={`/services/${s.slug}`} onClick={() => setMobileOpen(false)}>
              {s.title}
            </Link>
          ))}
        </div>
        <Link href="/contact" className="mob-link" onClick={() => setMobileOpen(false)}>
          Contact
        </Link>
        <div className="mob-link" style={{ color: "#aaa", fontSize: ".8rem", cursor: "default" }}>
          Coverage Areas
        </div>
        <div className="mob-sub">
          {areas.map((a) => (
            <Link key={a.slug} href={`/areas/${a.slug}`} onClick={() => setMobileOpen(false)}>
              {a.name}
            </Link>
          ))}
        </div>
        <div style={{ marginTop: 20 }}>
          <a href={phoneHref} className="btn btn-p" style={{ width: "100%", justifyContent: "center" }}>
            📞 {phoneDisplay}
          </a>
        </div>
      </div>
    </>
  );
}
