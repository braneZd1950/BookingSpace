# Cursor development instructions

## Active rule

1. Read [16-current-status.md](16-current-status.md) and the relevant lean phase doc.  
2. Prefer the smallest change that advances the active goal (currently Phase 5 payments UI unless told otherwise).  
3. Backend may change when needed — document the gap in [lean/backend-status.md](lean/backend-status.md) and update [07-api-spec.md](07-api-spec.md) / [03-database.md](03-database.md).  
4. Keep Croatian UI copy for owner/customer surfaces. Product brand in UI: **anyminutes**.

## Before coding

1. Confirm which area owns the task (lean phase or status-doc gap).  
2. Inspect existing `client/` / `client-mobile/` / `server/` code.  
3. Propose the smallest implementation.  
4. Implement; add or extend a server test for booking/membership/staff/billing changes.  
5. Smoke-check in the browser.  
6. Report changed files.

## Code principles

- Clear naming; thin pages; shared helpers when already used.  
- RTK Query for HTTP (no Axios).  
- Do not put authorization rules only in React — backend is source of truth.  
- Avoid premature abstractions.  
- Mobile shares `client/src` via `@client` — change shared code carefully.

## Repo layout

```text
client/src/          # web SPA + shared pages/APIs
client-mobile/       # PWA shell (layouts + alias to client/src)
server/src/          # Express modules, models, utils
server/test/         # mvp-flow, studio-ops, platform-billing
docs/
  lean/              # phase learning docs
  01–16              # specs + current status
scripts/             # dev, smoke
.github/workflows/   # CI
```

## Do not

- reintroduce waitlist / Stripe / marketplace without an explicit product ask  
- turn on Online workouts without flipping `ONLINE_ENABLED` intentionally  
- trust frontend for capacity authorization  
- commit secrets (root `.env`)  

## Task format

```text
Goal:
[one clear goal]

Phase / area:
[lean phase or status-doc item]

Constraints:
[APIs to reuse, files to avoid]

Done when:
[checkable outcomes]
```
