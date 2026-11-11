# Setup — Expo projekt

Indeks: [README.md](README.md)

Ovaj dokument je **korak po korak** za podizanje app-a u `mobile/`. Kod još nije obavezan dok ne krene faza M1 — ovo je recept.

---

## Preduvjeti

| Alat | Napomena |
| --- | --- |
| Node.js | Ista major verzija kao za web repo |
| npm | Root + `server/` već rade |
| Expo Go | Telefon (opcionalno) ili emulator |
| Git | Rad u ovom monorepu |

Lokalni API:

```bash
# iz root-a repoa
npm run dev
# API: http://localhost:4001/api
```

---

## Korak 1 — Kreiraj Expo app u `mobile/`

Iz root-a repoa (kad budeš spreman za kod):

```bash
cd mobile
npx create-expo-app@latest . --template blank-typescript
```

Ako `mobile/` već ima `docs/` i README, kreiraj u privremenom folderu pa premjesti `app/` / `src/` — **nemoj obrisati** `mobile/docs/`.

Predložena struktura:

```text
mobile/
  docs/           # ova dokumentacija
  README.md
  app/            # Expo Router (ili src/screens + navigation)
  src/
    api/          # RTK Query ili api client
    features/     # auth, bookings, members…
    components/
  app.json
  package.json
```

---

## Korak 2 — Env

Datoteka `.env` (ne commitaj tajne):

```text
EXPO_PUBLIC_API_URL=http://localhost:4001/api
```

Na fizičkom telefonu zamijeni `localhost` LAN IP-om računala (npr. `http://192.168.1.10:4001/api`).

Uskladi s web `VITE_API_URL` — isti host, isti `/api` prefix.

---

## Korak 3 — Pokreni

```bash
# terminal 1 — API (+ web ako treba)
npm run dev

# terminal 2 — Expo
cd mobile
npx expo start
```

Skeniraj QR u Expo Go ili otvori emulator.

---

## Korak 4 — Provjeri vezu na API

Najmanji test: `GET {EXPO_PUBLIC_API_URL}/health` → `{"ok":true}`.

Ako padne s telefona:

1. telefon i PC na istoj Wi‑Fi mreži  
2. firewall dozvoljava port 4001  
3. URL nije `localhost`  

---

## Korak 5 — Navigacija i auth (ulaz u M1)

1. Instaliraj React Navigation (stack + bottom tabs) **ili** Expo Router.  
2. Ekrani: Login, učitavanje (`/auth/me`), member tabs, owner tabs.  
3. JWT u `expo-secure-store`.  

Detalji faze: [lean/faza-m1-auth-shell.md](lean/faza-m1-auth-shell.md)

---

## Čega se držati

| Da | Ne |
| --- | --- |
| TypeScript | Drugi monorepo za mobile |
| Isti API ugovor | Lokalni mock „pravog” bookinga |
| Hrvatski copy | Engleski UI bez dogovora |
| SecureStore za token | JWT u plain AsyncStorage |

---

## Store kasnije

EAS Build / Submit — tek u [fazi M5](lean/faza-m5-store.md). Do tada dovoljno Expo Go + development build ako zatrebaju native moduli.
