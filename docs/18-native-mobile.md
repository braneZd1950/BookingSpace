# Native mobile (Expo)

**Status:** scaffold ready — not the pilot booking surface yet.  
**Path:** `mobile/`  
**Brand:** anyminutes

## Purpose

Ship a **true native** iOS/Android client that reuses the same Express API as the web SPA. The web pilot (`client/`) remains the browser product; `mobile/` is the Expo app for phones.

## Stack decision

| Choice | Why |
| --- | --- |
| TypeScript | Shared types with future packages; safer refactors |
| Expo + Expo Router | Fast iteration, EAS builds, file-based routes |
| React Native Paper | Production MD3 components (forms, buttons, cards) |
| NativeWind 4 | Tailwind-style layout without fighting Paper |

## Feature flags (parity with web)

Native must respect the same pilot gates as web (`client/src/lib/studioFeatures.js`):

- Gallery, Online, Blagajna, Plan — **off** until product says otherwise  
- Pilot tabs when implemented: Termini, Kalendar, Članovi, Postavke (+ member book)

## Environment

| Variable | Meaning |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | API base including `/api` (default `http://127.0.0.1:4001/api`) |
| `EXPO_PUBLIC_APP_NAME` | Display brand (default `anyminutes`) |

On a **physical device**, `localhost` is the phone — use the computer’s LAN IP and ensure the API CORS / `CLIENT_ORIGINS` allow Expo if needed.

Copy `mobile/.env.example` → `mobile/.env`.

## Local commands

From repo root:

```bash
npm run start:native
```

Or:

```bash
cd mobile
npm start
```

API must be running (`npm run dev` or server on port 4001).

## Directory map

```text
mobile/
  app/                   # routes
    _layout.tsx          # Paper + Auth + NativeWind CSS
    (auth)/login.tsx
    (app)/               # tabs: home, studio roadmap, member roadmap
  src/
    api/client.ts        # fetch + JWT
    api/auth.ts
    features/auth/       # session restore via SecureStore
    theme/               # MD3 Paper theme + brand tokens
    components/
  global.css
  babel.config.js
  metro.config.js
  tailwind.config.js
  eas.json               # EAS Build profiles
```

## Implementation order (recommended)

1. Auth (done in scaffold) + session restore  
2. Member: list memberships → open studio → book/cancel  
3. Owner: termini + members (thin first)  
4. Push notifications (Expo Notifications ↔ existing VAPID/web strategy — decide bridge later)  
5. Studio palette theming per tenant  
6. EAS production builds + store listing  

## Design system (SCSS parity)

Native UI **follows web SCSS**, but cannot load `.scss` files. Mapping:

| Web source | Native mirror |
| --- | --- |
| `client/src/styles/tokens.scss` | `mobile/src/theme/tokens.ts` |
| `global.scss` fonts (Figtree) + page Fraunces | `expo-font` + Google Fonts packages |
| Login / Termini / Members page patterns | `mobile/src/ui/styles.ts`, `PageHeader`, `Panel`, `Atmosphere` |

Rule: if you change a token or shared pattern on web, update the native mirror in the same change.

- **Auth / platform chrome:** tokens `--brand`, `--brand-strong`, `--accent`, `--bg`  
- **Inside a studio:** later override Paper `primary` from tenant theme (web `--site-brand`)  
- One primary CTA per screen; Croatian copy on user surfaces  

## EAS / stores

1. Create an Expo project and set `expo.extra.eas.projectId` in `app.json`  
2. `npx eas build -p android --profile preview`  
3. `npx eas build -p ios --profile preview` (Apple Developer account required)  
4. Production profiles in `eas.json` when pilot native is approved  

## Do not

- Reimplement capacity / membership authorization in the client  
- Turn on Online/gallery/payments native screens before web flags  
- Commit `mobile/.env` or EAS secrets  
- Point production builds at `127.0.0.1`  

## Related docs

- [16-current-status.md](16-current-status.md) — what is live  
- [07-api-spec.md](07-api-spec.md) — REST contract  
- [08-routes-frontend.md](08-routes-frontend.md) — web / PWA routes  
- [12-roadmap.md](12-roadmap.md) — product sequence  
