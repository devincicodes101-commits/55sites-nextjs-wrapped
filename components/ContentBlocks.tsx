import type { ContentBlock } from "@/lib/types";
import PricingGrid from "./PricingGrid";

export default function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h2":
            return <h2 key={i}>{block.text}</h2>;
          case "h3":
            return <h3 key={i}>{block.text}</h3>;
          case "p":
            return <p key={i}>{block.text}</p>;
          case "ul":
            return (
              <ul key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          case "callout":
            return (
              <div className={block.tone === "warning" ? "wbox" : "hbox"} key={i}>
                <p>{block.text}</p>
              </div>
            );
          case "priceGrid":
            return <PricingGrid key={i} items={block.items} />;
          case "infoCards":
            return (
              <div key={i}>
                {block.items.map((card) => (
                  <div className="info-card" key={card.title}>
                    <h3>
                      {card.icon} {card.title}
                    </h3>
                    <p>{card.text}</p>
                  </div>
                ))}
              </div>
            );
          default:
            return null;
        }
      })}
    </>
  );
}
