# Phase 4 — Frontend: Public studio page

**Status:** later (after Phases 2–3 prove the booking loop)  
**Hypothesis:** A simple public page attracts new clients only after booking already works.  
**Backend:** frozen. Uploads / site PATCH may already exist — use them; do not expand SEO/social APIs.

## Goal

Provider gets `{slug}.booking.hr` address in the UI and a setup wizard (`/postavljanje`) for template, layout (header / bar / sidebar), colors, copy, sections, and images. DNS for real subdomains can follow later; slug + host display ship in the frontend now.

## In scope (frontend)

| Area | Behavior |
| --- | --- |
| Fixed template | Hero + about + hours/contact + CTA |
| One image | Optional hero upload if API already exists |
| CTA | Links into Phase 3 booking flow |

## Explicitly deferred (again)

- Subdomain / custom domain product
- SEO title/description editor
- Social link fields
- Section checkboxes / multi-template wizard
- Gallery CMS

See also historical notes in [`../06-tenant-website.md`](../06-tenant-website.md) — treat that file as **future vision**, not current build order.

## Measure

New enquiries or registrations that arrive via the page.

## Learn

Without proof from Phases 2–3, the page is decoration — not product.

## Done when

- [ ] Public page is readable on mobile
- [ ] CTA reaches a working book flow
- [ ] No subdomain settings in the owner UI
