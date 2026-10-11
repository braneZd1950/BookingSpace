# Personalized tenant websites

> **Lean status:** Phase 4 — [lean/phase-04-frontend.md](lean/phase-04-frontend.md)  
> **Not in active build.** Subdomain product, SEO editor, social links, and section toggles are deferred. Backend frozen: [lean/backend-status.md](lean/backend-status.md).

## Concept (future)

A business may get a simple public page with booking CTA. Long-term vision includes a subdomain (`powerfit.bookingspace.hr`). **That hostname product is not part of the current lean MVP.**

## Lean Phase 4 (when unlocked)

Ship the smallest useful page:

- Hero with studio name  
- Short about text  
- One optional photo  
- Hours / contact from settings  
- CTA into the booking flow (Phase 3)  

Serve under an app route first. Subdomains come after the booking loop is proven.

## Explicitly deferred

| Feature | Why deferred |
| --- | --- |
| Subdomain / custom domain UI | Does not validate booking value |
| SEO title/description editor | Vanity before learning |
| Social links | Same |
| Configurable section checkboxes | Complexity without metric |
| Multi-template / color wizard before first booking | Friction before value |
| Full drag-and-drop builder | Never MVP |

## Historical vision (do not build now)

The following remains a **later** design sketch only.

### Possible sections later

Hero, About, Services, Schedule/Booking, Gallery, Contact, Location, Opening hours.

### Templates (later)

Fitness, Pilates, Power Plate, children's playroom, generic — predefined blocks only, never a page builder.

### Theme (later)

Small set: primary/secondary color, font, radius, button style.

### Images

Prefer uploaded URLs (or existing upload API). Do not store binaries in MongoDB.

### SEO / custom domains

Advanced SEO and custom domains stay post-pilot ([roadmap](12-roadmap.md)).
