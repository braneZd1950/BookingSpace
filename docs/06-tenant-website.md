# Personalized tenant websites

> **Lean status:** Phase 4 mostly done — [lean/phase-04-frontend.md](lean/phase-04-frontend.md)  
> **Shipped:** `/postavljanje` wizard, templates/layouts/palettes, SiteFrame preview, member `/s/:slug`.  
> **Still deferred:** real DNS / custom domains. Snapshot: [16-current-status.md](16-current-status.md).

## Concept

A business gets a simple public page with booking CTA. Long-term vision includes a subdomain (`powerfit.bookingspace.hr`). **Hostname product is not live** — slug routes are.

## Phase 4 (as shipped)

- Setup wizard: template, layout, colors, copy, images  
- Preview on owner home + member home  
- CTA into `/s/:slug/termini`  

## Explicitly deferred

| Feature | Why deferred |
| --- | --- |
| Subdomain / custom domain product | DNS ops after booking value is proven |
| Full gallery CMS as owner nav | Not required for pilot |
| Marketplace discovery | Post-pilot |
| Full drag-and-drop builder | Never MVP |

## Design notes (partially live)

### Sections

Hero, About, Services, Schedule/Booking, Gallery, Contact, Location, Opening hours — controlled via `siteSettings.visibleSections` where wired.

### Templates

Fitness, Pilates, Power Plate, children's playroom, generic — predefined blocks only, never a page builder. Wizard uses these today.

### Theme

Small set: primary/secondary color, font, radius, button style (+ layout / paletteId).

### Images

Prefer uploaded URLs (Cloudinary or local upload API). Do not store binaries in MongoDB.

### SEO / custom domains

Advanced SEO polish and custom domains stay post-pilot ([roadmap](12-roadmap.md)).
