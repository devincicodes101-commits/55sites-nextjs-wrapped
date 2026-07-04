import type { TrustBarItem } from "@/lib/types";

export default function TrustBar({ items }: { items: TrustBarItem[] }) {
  return (
    <div className="trust-bar">
      <div className="container">
        <div className="trust-items">
          {items.map((item) => (
            <div className="trust-item" key={item.label}>
              <div className="trust-icon">{item.icon}</div>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
