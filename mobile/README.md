# anyminutes — native mobile

Expo (SDK 58) + **TypeScript** + **Expo Router** + **React Native Paper** + **NativeWind**.

This app is the **store-ready native shell**. The web pilot (`client/`) and PWA shell (`client-mobile/`) remain the production booking surface until native screens catch up.

## Stack

| Layer | Choice |
| --- | --- |
| Runtime | Expo SDK 58, React Native |
| Language | TypeScript (strict) |
| Navigation | Expo Router (file-based) |
| UI kit | React Native Paper (MD3) |
| Utility styles | NativeWind 4 + Tailwind 3 |
| Secrets | `expo-secure-store` (JWT) |
| API | Same REST backend as web (`/api`) |

## Layout

```text
mobile/
  app/                 # Expo Router screens
    (auth)/login.tsx
    (app)/             # Bottom tabs: home, studio, member
  src/
    api/               # fetch client + auth
    components/        # Screen, BrandMark
    config/env.ts      # EXPO_PUBLIC_*
    features/auth/     # AuthProvider
    lib/storage.ts
    theme/             # Paper + brand tokens
  global.css           # Tailwind entry for NativeWind
  app.json / eas.json
```

## Run

1. Start the API from the repo root (`npm run dev` or server only on `:4001`).
2. Copy env:

```bash
cp .env.example .env
# Physical device: set EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:4001/api
```

3. Start Expo:

```bash
npm run start:native
# or
cd mobile && npm start
```

Then open in **Expo Go**, Android emulator, or iOS simulator.

## Design rules (follow web SCSS)

React Native **cannot import `.scss`**. Instead we **mirror** the web design system in `mobile/` (not `client-mobile/`):

| Web (`client/`) | Native (`mobile/`) |
| --- | --- |
| `src/styles/tokens.scss` | `src/theme/tokens.ts` + `tailwind.config.js` |
| Figtree + Fraunces + Source Serif 4 | `@expo-google-fonts/{figtree,fraunces,source-serif-4}` → `src/theme/fonts.ts` |
| `LoginPage.scss` (transparent panel, underline inputs, spine) | `login.tsx` + `PageHeader variant="login"` + `Panel variant="login"` |
| `TerminiPage.scss` / `MembersPage.scss` head + board | `PageHeader variant="app"` + `Panel variant="board"` |
| Atmosphere / grain / orbs | `Atmosphere.tsx` |

**Login parity checklist** (from `LoginPage.scss`):

- Mist gradient + orbs + shaft (no white card)
- Source Serif brand + horizontal accent @ phone width
- Kicker 0.78rem / 700 / 0.16em; h1 Fraunces; lead 62% ink
- Form: `border-top` only, underline fields, brand CTA `0.2rem` radius

When you change web tokens or page patterns, update the native mirrors in the same PR.

- Platform chrome uses `--brand` / `--accent` from tokens.
- Studio-specific `--site-brand` comes later via tenant theme.
- One job per screen; bottom tabs for home / studio / member.

## Build / store

```bash
cd mobile
npx eas-cli login
# set extra.eas.projectId in app.json
npx eas build -p android --profile preview
npx eas build -p ios --profile preview
```

See [docs/18-native-mobile.md](../docs/18-native-mobile.md).

## Relation to other apps

| App | Role |
| --- | --- |
| `client/` | Web SPA — pilot with real users |
| `client-mobile/` | Mobile **PWA** shell (Vite) |
| `mobile/` | Native iOS/Android (this package) |
| `server/` | Shared API |

Do not duplicate booking business rules in the mobile UI — call the API; authorization stays on the server.
