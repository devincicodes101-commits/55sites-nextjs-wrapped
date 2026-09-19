import { priceSurvey, applyDiscount, renderSurveyPriceTable } from "../lib/survey-pricing";
import { isSurveyService } from "../lib/survey-lead";

let fails = 0;
function eq(label: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fails++; console.log(`FAIL ${label}\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`); }
  else console.log(`ok   ${label}  -> ${JSON.stringify(got)}`);
}
function price(p: PropertyKindArg, t: any, beds?: number, sqm?: number) {
  const r = priceSurvey({ property: p as any, type: t, bedrooms: beds ?? null, sqm: sqm ?? null });
  return r.kind === "price" ? r.gbp : r.kind;
}
type PropertyKindArg = "domestic" | "commercial";

console.log("--- DOMESTIC MANAGEMENT (sheet: 1-2=300, 3-5=350, 6-8=395) ---");
eq("1 bed mgmt", price("domestic","management",1), 300);
eq("2 bed mgmt", price("domestic","management",2), 300);
eq("3 bed mgmt", price("domestic","management",3), 350);
eq("5 bed mgmt", price("domestic","management",5), 350);
eq("6 bed mgmt", price("domestic","management",6), 395);
eq("8 bed mgmt", price("domestic","management",8), 395);

console.log("--- DOMESTIC R&D (sheet: 1-2=350, 3-5=395, 6=450, 7=470, 8=495) ---");
eq("2 bed rd", price("domestic","rd",2), 350);
eq("4 bed rd", price("domestic","rd",4), 395);
eq("6 bed rd", price("domestic","rd",6), 450);
eq("7 bed rd", price("domestic","rd",7), 470);
eq("8 bed rd", price("domestic","rd",8), 495);

console.log("--- CLIENT RULES ---");
eq("domestic demolition falls back to R&D", price("domestic","demolition",3), 395);
eq("9 bed = no price, surveyor quotes", price("domestic","management",9), "poa");
eq("bedrooms unknown", price("domestic","rd"), "needs_size");

console.log("--- COMMERCIAL (boundaries) ---");
eq("500 m2 mgmt", price("commercial","management",undefined,500), 395);
eq("501 m2 mgmt", price("commercial","management",undefined,501), 495);
eq("2000 m2 rd", price("commercial","rd",undefined,2000), 850);
eq("2001 m2 demolition", price("commercial","demolition",undefined,2001), 1250);
eq("20000 m2 rd", price("commercial","rd",undefined,20000), 2500);
eq("20001 m2 = POA", price("commercial","rd",undefined,20001), "poa");
eq("size unknown", price("commercial","management"), "needs_size");

console.log("--- 10% DISCOUNT (base survey only) ---");
eq("300 -> 270", applyDiscount(300), 270);
eq("395 -> 355.50", applyDiscount(395), 355.5);
eq("495 -> 445.50", applyDiscount(495), 445.5);
eq("3000 -> 2700", applyDiscount(3000), 2700);

console.log("--- SERVICE LANE CLASSIFIER ---");
for (const t of ["Asbestos Surveys","Asbestos Testing","Air Testing & Monitoring"]) eq(`survey: ${t}`, isSurveyService(t), true);
// "Free survey" CTAs are the pre-removal site visit, NOT paid GoGreen work.
for (const t of ["Free Survey","Free Site Survey","Get Survey Quote","Book a free survey","Request a survey"]) eq(`free-survey CTA stays removal: ${t}`, isSurveyService(t), false);
for (const t of ["Background & static air monitoring"]) eq(`survey: ${t}`, isSurveyService(t), true);
for (const t of ["Domestic Garage Demolition","Cement garage demolition & disposal","Corrugated cement sheet removal","Excavation & removal of ACM soil","Floor tiles & adhesive removal","Flat asbestos garage roof removal","Cement roof removal & full re-roof","EMERGENCY RESPONSE"]) eq(`removal: ${t}`, isSurveyService(t), false);
for (const t of ["Licensed Removal","Non-Licensed Removal","Garage Roof Removal & Dismantle","Asbestos Disposal","Muck Away","Re-Roofing Services","Reboard & Plastering","Soil Remediation & Testing","Demolition Services","Transparent Pricing","Emergency Response","General Enquiry"]) eq(`removal: ${t}`, isSurveyService(t), false);

console.log("\n--- PRICE TABLE AS THE MODEL SEES IT ---\n" + renderSurveyPriceTable());
console.log(fails === 0 ? "\n=== ALL CHECKS PASSED ===" : `\n=== ${fails} FAILED ===`);
process.exit(fails === 0 ? 0 : 1);
