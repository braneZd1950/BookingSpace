# Cursor development instructions

## Active rule (lean)

1. Read [lean/README.md](lean/README.md) and the **current phase** frontend doc.  
2. **Do not change `server/`** unless [lean/backend-status.md](lean/backend-status.md) explicitly unlocks a gap.  
3. Prefer the smallest frontend change that advances the active phase metric.  
4. Keep owner Settings lean: name, contact, hours — no website/SEO/social/subdomain UI.

## Before coding

1. Confirm which lean phase owns the task.  
2. Inspect existing `client/` code and APIs.  
3. Propose the smallest implementation.  
4. Implement frontend only (default).  
5. Smoke-check in the browser.  
6. Report changed files.

## Code principles

- Clear naming; thin pages; shared helpers when already used.  
- RTK Query for HTTP (no Axios).  
- Croatian UI copy for owner/customer surfaces.  
- Do not put authorization rules only in React — backend remains source of truth when APIs exist.  
- Avoid premature abstractions and website chrome.

## Repo layout (actual)

```text
client/src/
  app/           # store, App routes
  api/           # RTK Query APIs
  components/    # public chrome
  pages/
    owner/       # /stranica/* studio UI + lean Plan
    public/      # marketing, auth
  styles/
server/          # FROZEN for current lean work — read only
docs/
  lean/          # phase-scoped delivery docs (prefer these)
  01–14          # background / historical specs
```

## Do not

- edit backend during Phase 1 frontend work  
- re-add subdomain, SEO, social, or section-toggle settings  
- force `/postavljanje` after login/register  
- add Stripe, mobile apps, microservices, AI  
- trust frontend for capacity authorization  

## Task format

```text
Goal:
[one clear goal]

Phase:
[lean phase number + link]

Layer:
frontend only | backend gap (document only)

Requirements:
- ...

Acceptance criteria:
- ...

Do not:
- touch server/
- …
```

## Example (Phase 1)

```text
Goal:
Keep Postavke limited to name, contact, and working hours.

Phase:
1 — docs/lean/phase-01-frontend.md

Layer:
frontend only

Requirements:
- Save via existing tenant update API.
- No SEO / social / sections UI.

Acceptance criteria:
- Owner can update hours and see them on Termini/Kalendar.

Do not:
- modify server/
- add subdomain fields
```
