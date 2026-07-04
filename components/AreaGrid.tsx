import Link from "next/link";
import type { Area } from "@/lib/types";

export default function AreaGrid({ areas }: { areas: Area[] }) {
  return (
    <div className="area-grid">
      {areas.map((area) => (
        <Link href={`/areas/${area.slug}`} className="area-card" key={area.slug}>
          <div className="area-card-header">
            <span className="area-pin">📍</span>
            <strong>{area.name}</strong>
            <span className="area-arrow">→</span>
          </div>
          <p className="area-hist">{area.blurb}</p>
          <div className="area-svcs">
            {area.tags.map((tag) => (
              <span className="area-svc-tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: ".8rem", fontWeight: 700, color: "var(--p)" }}>
            View asbestos services in {area.name} →
          </div>
        </Link>
      ))}
    </div>
  );
}
