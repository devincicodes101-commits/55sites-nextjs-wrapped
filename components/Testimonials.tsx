import type { Testimonial } from "@/lib/types";

export default function Testimonials({ items, city }: { items: Testimonial[]; city: string }) {
  return (
    <div className="section">
      <div className="container">
        <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 40px" }}>
          <div className="tag">Reviews</div>
          <h2 style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--d)", letterSpacing: "-.02em" }}>
            What {city} Clients Say
          </h2>
        </div>
        <div className="test-grid">
          {items.map((t) => (
            <div className="test" key={t.name}>
              <div className="stars">★★★★★</div>
              <blockquote>&quot;{t.quote}&quot;</blockquote>
              <div className="test-a">
                <div className="test-av">{t.initials}</div>
                <div>
                  <div className="test-n">{t.name}</div>
                  <div className="test-l">{t.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
