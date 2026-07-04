import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <div className="bc">
      {items.map((item, i) => (
        <span key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {item.href ? (
            <Link href={item.href} data-link>
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}
          {i < items.length - 1 && <span style={{ opacity: 0.4 }}>›</span>}
        </span>
      ))}
    </div>
  );
}
