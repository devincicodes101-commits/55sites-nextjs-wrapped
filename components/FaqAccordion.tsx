"use client";

import { useState } from "react";
import type { FAQ } from "@/lib/types";

export default function FaqAccordion({ faqs }: { faqs: FAQ[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="faq-list">
      {faqs.map((faq, i) => {
        const open = openIndex === i;
        return (
          <div className="faq-item" key={faq.question}>
            <button
              className="faq-q"
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
            >
              {faq.question}
              <em>{open ? "−" : "+"}</em>
            </button>
            <div className={`faq-a${open ? " open" : ""}`}>
              <p>{faq.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
