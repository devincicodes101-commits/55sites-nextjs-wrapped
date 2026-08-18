import type { SiteConfig } from "../types";
import london from "./london";

// National brand site for asbestosteams.co.uk. It reuses the London site's page
// structure/content but rebrands to the central "Asbestos UK Teams" identity
// with the national sales contact details (the same email/phone used on quotes).
// Deeper body copy can be tailored to national wording later; the priority here
// is that the site runs the standard app (chatbot + lead form + CRM leads) with
// the correct brand + contact details.
const config: SiteConfig = {
  ...london,
  businessName: "Asbestos UK Teams",
  logoLetter: "A",
  city: "the UK",
  region: "Nationwide",
  country: "GB",
  phoneDisplay: "0800 041 8212",
  phoneHref: "tel:08000418212",
  email: "sales@asbestosteams.co.uk",
  domain: "asbestosteams.co.uk",

  hero: {
    ...london.hero,
    tag: "Nationwide asbestos specialists",
    titleBefore: "Professional",
    titleHighlight: "Asbestos Removal",
    titleAfter: "across the UK",
    subtitle:
      "Safe, certified, and competitively priced asbestos removal, survey, testing, and disposal services across the UK. HSE-licensed operatives, UKAS-accredited laboratory analysis, and a commitment to protecting your property and your health.",
  },
};

export default config;
