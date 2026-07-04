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
- Forms are client-side only (mirrors the original's inline JS behaviour of
  showing a success message with no real backend). Wire `ContactForm.tsx`
  up to a real endpoint before going to production.
- 12 of the 13 seeded services have solid, genuinely useful template copy
  ported/adapted from the original's real pattern; only `survey` and `cost`
  are verbatim transcriptions of the original Bath copy. Review before
  reusing for a paying client site.

## Local dev

```bash
npm install
npm run dev
```
