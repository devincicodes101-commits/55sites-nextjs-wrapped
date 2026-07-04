import type { PriceItem } from "@/lib/types";

export default function PricingGrid({ items }: { items: PriceItem[] }) {
  return (
    <div className="price-grid">
      {items.map((item) => (
        <div className={`pc${item.featured ? " feat" : ""}`} key={item.label}>
          <div className="ps">{item.label}</div>
          <div className="pf">{item.unit ?? "from"}</div>
          <div className="pv">{item.price}</div>
          <div className="pn">{item.note}</div>
        </div>
      ))}
    </div>
  );
}
