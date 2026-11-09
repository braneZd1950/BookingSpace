# Produkcijski go-live — korak po korak

Redoslijed za **prvu produkciju** (pilot studija). Lokalni rad ostaje `.env` + `npm run dev`.

Detalji Rendera: [17-render-deploy.md](17-render-deploy.md) · **Env checklist:** [22-render-env-checklist.md](22-render-env-checklist.md) · Sigurnost: [19-security-maintenance.md](19-security-maintenance.md) · Status proizvoda: [16-current-status.md](16-current-status.md)

---

## Što je “gotovo” nakon ovih koraka

| Uključeno | Nije u ovom go-liveu |
| --- | --- |
| Auth, studio, članovi, termini, self-book | Stripe / online naplata |
| Staff, e-pošta (SMTP), Web Push | Waitlist, custom DNS/subdomena |
| Admin `/analitika`, arhivski izvoz | Online / galerija / blagajna UI (flagovi off) |

---

## Redoslijed (ne preskači)

```text
1. Atlas prod DB
2. Tajne + SMTP (+ VAPID, Cloudinary)
3. Lokalna provjera env + testovi
4. Render Opcija A (jedan URL)
5. Deploy + health
6. mail:check
7. Prvi admin
8. Ručni smoke (pravi vlasnik)
9. Opcionalno: npm run smoke
10. Ops (što pratiti)
```

---

## Korak 1 — MongoDB Atlas (produkcijska baza)

1. Napravi **odvojeni** Atlas cluster / database za produkciju (ne lokalni seed / test).
2. Korisnik s lozinkom, Network Access: dozvoli Render IP ili `0.0.0.0/0` (ako mora).
3. Kopiraj connection string → bit će `MONGO_URI`.
4. **Nikad** na ovoj bazi: `npm --prefix server run seed:demo`.

---

## Korak 2 — Generiraj tajne i SMTP

U rootu repoa (lokalno, vrijednosti **ne commitaj**):

```bash
npm --prefix server run generate:jwt-secret
npm --prefix server run generate:vapid
```

Za pečat arhive (`EXPORT_SEAL_SECRET`) generiraj **drugu** nasumičnu tajnu (≥ 32 znaka), različitu od `JWT_SECRET`.

### SMTP (obavezno prije pravih korisnika)

Primjer (Brevo / sličan relay) — vidi `.env.production.example`:

| Key | Primjer |
| --- | --- |
| `EMAIL_FROM` | `anyminutes <noreply@vasa-domena.hr>` |
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` / `SMTP_PASS` | iz panela providera |

Bez SMTP-a: invite članova, reset lozinke i booking mail **ne stižu**.

### Preporučeno uz SMTP

| Key | Zašto |
| --- | --- |
| `VAPID_*` + `VAPID_SUBJECT` | Web Push |
| `CLOUDINARY_*` | upload medija (inače disk / slabije za Render) |
| `SENTRY_DSN` / `VITE_SENTRY_DSN` | greške u produkciji (opcionalno) |
| `GOOGLE_CLIENT_ID` + `VITE_GOOGLE_CLIENT_ID` | Google prijava (opcionalno) |

---

## Korak 3 — Složi produkcijski env lokalno i provjeri

```bash
cp .env.production.example .env.production
# Uredi sve vrijednosti (još bez finalnog Render URL-a ako ga nemaš — stavi privremeni HTTPS).
node scripts/check-production-env.js --file .env.production --force
npm run test:all
```

Minimalni set koji mora biti ispravan:

| Key | Pravilo |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGO_URI` | Atlas prod |
| `JWT_SECRET` | jak, ≥ 32 |
| `EXPORT_SEAL_SECRET` | jak, **≠** `JWT_SECRET` |
| `CLIENT_ORIGIN` | javni HTTPS (isti host u Opciji A) |
| `VITE_API_URL` | `https://…/api` (ne localhost) |
| `VITE_APP_MODE` | `production` |
| `SERVE_CLIENT` | `true` (Opcija A) |
| `ADMIN_EMAIL_BOOTSTRAP` | `false` |
| SMTP_* + `EMAIL_FROM` | postavljeni |

---

## Korak 4 — Render Web Service (Opcija A — jedan URL)

Slijedi [17-render-deploy.md](17-render-deploy.md) **Opcija A**.

| Polje | Vrijednost |
| --- | --- |
| Root Directory | *prazno* (root repoja) |
| Build Command | `npm run build:render` |
| Start Command | `npm start --prefix server` |

1. Kreiraj / ažuriraj Web Service povezan na GitHub `master`.
2. U **Environment** zalijepi ključeve iz `.env.production` (ne uploadaj datoteku u git).
3. Postavi `CLIENT_ORIGIN` i `VITE_API_URL` na **stvarni** Render URL:
   - `CLIENT_ORIGIN=https://VAS-SERVIS.onrender.com`
   - `VITE_API_URL=https://VAS-SERVIS.onrender.com/api`
4. `VITE_*` se peče u buildu → nakon izmjene: **Clear build cache & deploy**.

API u produkciji neće startati sa slabim tajnama / localhost originom (`productionGuard`).

---

## Korak 5 — Prvi deploy i health

Nakon zelenog deploya:

1. `GET https://VAS-SERVIS.onrender.com/api/health` → `{"ok":true}`
2. `GET https://VAS-SERVIS.onrender.com/` → React SPA (HTML), **ne** JSON `NOT_FOUND`
3. `GET https://VAS-SERVIS.onrender.com/fonts/DejaVuSans.ttf` → 200
4. U Render logovima nema fatalnih grešaka na startu

Ako root i dalje daje `NOT_FOUND`: build nije stavio `client/dist` — vidi Opcija A u doc 17.

---

## Korak 6 — Provjeri SMTP na produkciji

Lokalno (s istim SMTP vrijednostima kao na Renderu), ili preko shella ako imaš pristup:

```bash
npm --prefix server run mail:check
```

Očekivano: poruka da je SMTP spreman / uspješan test.  
Ako padne: ispravi `SMTP_*` / `EMAIL_FROM` na Renderu i redeploy **nije** potreban samo za env (Restart servisa).

---

## Korak 7 — Prvi platform admin

Jednom, protiv **produkcijskog** `MONGO_URI` (lokalno s env ili Atlas + skripta):

```bash
node server/scripts/promote-super-admin.js admin@vasa-domena.hr
```

Email mora već postojati kao registrirani korisnik (najprije se registriraj na produkciji, pa promote).

---

## Korak 8 — Ručni smoke (obavezno)

Na produkcijskom URL-u, **bez** seed podataka:

1. Registriraj pravog vlasnika studija.
2. Prođi wizard / postavljanje studija (slug, usluga, radno vrijeme).
3. Dodaj člana → **provjeri inbox** (invite / lozinka).
4. Član se prijavi → landa na `/s/:slug`, ne u owner shell.
5. Rezervacija + otkaz (vlasnik i član).
6. Ako je VAPID postavljen: uključi push u Postavke → Obavijesti.
7. Admin: `/analitika` — PDF/izvoz bez „TEST” trake (`VITE_APP_MODE=production`).
8. Reset lozinke: traži mail → klik link → nova lozinka radi.

---

## Korak 9 — Automatski smoke (opcionalno)

```powershell
$env:SMOKE_API="https://VAS-SERVIS.onrender.com/api"
$env:SMOKE_WEB="https://VAS-SERVIS.onrender.com"
npm run smoke
```

Stres / limitti (kad želiš mir): [21-limits-testing.md](21-limits-testing.md) → `npm run test:limits`.

---

## Korak 10 — Nakon lansiranja (ops)

- CI zelen na `master` prije svakog deploya
- Gledaj Render logove: `[mail]`, `[security]`, Sentry ako je uključen
- Rotiraj tajne ako procurе; logout bumpa `tokenVersion`
- Preferiraj Cloudinary za medije
- Custom domena: kad bude spremna, ažuriraj `CLIENT_ORIGIN` + `VITE_API_URL` + Clear cache & deploy

---

## Strogo zabranjeno u produkciji

- `seed:demo` na prod bazi
- `ADMIN_EMAIL_BOOTSTRAP=true`
- Isti ili placeholder `JWT_SECRET` / `EXPORT_SEAL_SECRET`
- `CLIENT_ORIGIN` ili `VITE_API_URL` na `localhost`
- Commit `.env` / `.env.production` / pravih tajni

---

## Brzi podsjetnik skripti

| Skripta | Kad |
| --- | --- |
| `node scripts/check-production-env.js --file .env.production --force` | Prije deploya |
| `npm run build:prod` / `build:render` | Isti build kao Render |
| `npm --prefix server run mail:check` | Nakon SMTP-a |
| `npm run smoke` | Nakon deploya |
| `npm run test:limits` | Prije većeg prometa |
