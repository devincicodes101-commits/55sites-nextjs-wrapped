import type { ProcessStep } from "@/lib/types";

export default function ProcessSteps({ steps, city }: { steps: ProcessStep[]; city: string }) {
  return (
    <div className="section" style={{ background: "var(--bg)" }}>
      <div className="container">
        <div style={{ textAlign: "center", maxWidth: 580, margin: "0 auto 40px" }}>
          <div className="tag">Our Process</div>
          <h2 style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--d)", letterSpacing: "-.02em" }}>
            How We Work in {city}
          </h2>
        </div>
        <div className="proc-grid">
          {steps.map((step, i) => (
            <div className="proc" key={step.title}>
              <div className="proc-n">{i + 1}</div>
              <h4>{step.title}</h4>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
