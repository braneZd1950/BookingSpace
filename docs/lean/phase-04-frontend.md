# Phase 4 — Frontend: Public studio page

**Status:** mostly done (wizard + preview shipped; real DNS later)  
**Hypothesis:** A simple public page attracts new clients only after booking already works.  
**Backend:** uploads / site PATCH exist; expand SEO/social APIs only if product needs them.

## Goal

Provider gets `{slug}.booking.hr` address in the UI and a setup wizard (`/postavljanje`) for template, layout (header / bar / sidebar), colors, copy, sections, and images. DNS for real subdomains can follow later; slug + host display ship in the frontend now.

## In scope (as shipped)

| Area | Behavior |
| --- | --- |
| Setup wizard | `/postavljanje` — template, layout, palette, content |
| Preview | Owner home + member home via `SiteFrame` |
| CTA | Links into member book flow `/s/:slug/termini` |

## Explicitly deferred

- Subdomain / custom domain product (real DNS)
- Full gallery CMS as a dedicated owner nav item
- Marketplace discovery

See also [`../06-tenant-website.md`](../06-tenant-website.md).

## Measure

New enquiries or registrations that arrive via the page.

## Learn

Without proof from Phases 2–3, the page is decoration — not product.

## Done when

- [x] Public / preview page is readable on mobile
- [x] CTA reaches a working book flow
- [ ] Real `{slug}` hostname DNS product (optional / later)
- [ ] No subdomain settings in the owner UI
