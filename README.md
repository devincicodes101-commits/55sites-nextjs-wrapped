# Asbestos Site Template

A shared Next.js (App Router + TypeScript) template extracted from the 55
static `asbestosabatement<city>.co.uk.html` files. All 55 sites use the same
layout, components and copy structure with only the city, phone number,
colours, images and a handful of local facts changed - so instead of hand
editing HTML per city, every future site is just a new **config file**.

This is a **multi-tenant** app: one Next.js deployment serves all 55+
domains. Every request is rendered dynamically (no static generation), reads
the `Host` header, and looks up the matching config from `lib/sites/registry.ts`.
Deploy once, attach every domain to the same project, and you're done - no
per-site builds or deployments.

## How it's organised

- `lib/types.ts` - the `SiteConfig` shape every page reads from.
- `lib/sites/bath.ts` - the working example/seed config, a faithful port of
  asbestosabatementbath.co.uk (real copy, real phone number, real theme
  colours) so you can `npm run dev` and see a complete example.
- `lib/design-styles.ts` - maps each city to one of six HTML layout families
  (classic, bold, sidebar, card, banner, clean). `getSiteConfig()` attaches
  `designStyle`; the UI switches via `data-style` on `<body>`.
- `lib/sites/registry.ts` - maps each live **domain** to its config object,
  and exports `getSiteConfig()`, which reads the incoming request's `Host`
  header (via `next/headers`) and returns the right config. Every page and
  component calls this instead of importing a static config. Unregistered
  hosts (e.g. localhost during dev) fall back to the Bath config.
- `lib/content-helpers.ts` - generates the repetitive parts of each coverage
  area page (the original site duplicated near-identical copy per town;
  this generates it from the area name + one blurb instead).
- `components/` - every visual block from the original page (hero, stats
  row, trust bar, services grid, local SEO section, why-choose-us, process
  steps, testimonials, pricing grid, FAQ accordion, sidebar, footer, etc.),
  each taking data as props instead of hardcoding "Bath".
- `app/` - routes. Unlike the original (one giant HTML file that toggled
  `.page` divs with JS), this uses real Next.js routes:
  - `/` - home
  - `/services/[slug]` - one generic template rendering any entry in
    `site-config.ts#services` (13 seeded: survey, testing, licensed/
    non-licensed removal, garage roofs, re-roofing, reboard & plastering,
    air testing, soil remediation, demolition, muck away, disposal, and
    pricing)
  - `/areas` - coverage-area index (area cards grid)
  - `/areas/[slug]` - one generic template rendering any entry in
    `site-config.ts#areas` (10 seeded Somerset towns)
  - `/contact` - contact form + FAQ

## Spinning up a new city site

1. Copy `lib/sites/bath.ts` to e.g. `lib/sites/exeter.ts`.
2. Update `businessName`, `city`, `region`, `phoneDisplay`/`phoneHref`,
   `email`, `domain`, `theme` colours, `hero.image`, and the `localInfo` facts.
3. Update or trim the `areas` array to that city's real nearby towns - the
   `buildAreaContent()` helper will generate full area pages from just a
   name + one blurb + tag list.
4. In `lib/sites/registry.ts`, import the new file and add one entry to the
   `registry` map: `"exeterasbestosremoval.co.uk": exeter`.
5. Swap image URLs for that city's real photography once available - all
   images currently point at the original site's stock `media.base44.com`
   placeholders (whitelisted in `next.config.mjs`; add any new image host
   there too).
6. Point the new domain's DNS at this deployment (same deployment serves
   every domain - no separate build or hosting needed per site).

## Intentional simplifications vs. the original

- The original generated a near-duplicate "How Much Does It Cost?" page
  alongside the main pricing page purely for SEO keyword variants. The
  template keeps one canonical `/services/cost` page instead.
- Quote forms POST to `/api/contact`, which creates a record in Base44 CRM
  (when `BASE44_APP_ID` is set) and optionally backs up to Supabase.
- 12 of the 13 seeded services have solid, genuinely useful template copy
  ported/adapted from the original's real pattern; only `survey` and `cost`
  are verbatim transcriptions of the original Bath copy. Review before
  reusing for a paying client site.

## Survey → automatic quote

End-to-end flow on the Contact page when `SURVEY_QUOTE_PILOT_ENABLED=true` (all domains by default):

1. Visitor uploads an asbestos survey (PDF/image) + contact details
2. Gemini (`GEMINI_MODEL`, default `gemini-3.5-flash`) OCR/reads the report and extracts scope only (catalog item + quantity). Unit prices and totals are applied in code from the shared Service Catalog (`lib/catalog-pricing.ts`, live from `BASE44_CATALOG_APP_ID` Service entity when available) so the same survey yields the same rates on every domain.
3. Quote is emailed via Resend (if `RESEND_API_KEY` + `QUOTE_FROM_EMAIL` are set)
4. Lead is created in Base44 CRM (`BASE44_ENTITY`, default `Lead`) with quote JSON, total, survey summary, and status `quoted`

`SURVEY_QUOTE_PILOT_CITIES=*` (or leave empty) enables every domain. Restrict with a list if needed: `SURVEY_QUOTE_PILOT_CITIES=Bath,Birmingham`

Pricing for AI quotes and Transparent Pricing pages comes from the Asbestos UK Teams Service Catalog (12 detailed line items: artex, floor tiles, garage roofs, loft insulation, water tanks, etc.), not the old generic “from £250 / £300” anchors.

Suggested Lead fields in Base44: `first_name`, `last_name`, `phone`, `email`, `service`, `details`, `city`, `domain`, `source`, `status`, `quote_ref`, `quote_total_gbp`, `quote_json`, `survey_summary`, `survey_file_name`, `quote_emailed`.

## Local dev

```bash
npm install
npm run dev
```
