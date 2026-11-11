# Produkcijski go-live — korak po korak

Indeks: [README.md](README.md)

| Veza | Dokument |
| --- | --- |
| Env ključevi | [22-render-env-checklist.md](22-render-env-checklist.md) |
| Render FE+API | [17-render-deploy.md](17-render-deploy.md) |
| Ops sigurnost | [19-security-maintenance.md](19-security-maintenance.md) |
| Status | [16-current-status.md](16-current-status.md) |

Lokalni rad ostaje `.env` + `npm run dev`.

---

## Što je uključeno u ovom go-liveu

| Da | Ne |
| --- | --- |
| Auth, studio, članovi, termini, self-book | Stripe |
| Staff, SMTP, Web Push | Waitlist, custom DNS |
| Admin `/analitika`, arhivski izvoz | Online / galerija / blagajna UI (flagovi off) |

---

## Redoslijed (ne preskači)

```text
1. Atlas prod baza
2. Tajne + SMTP (+ VAPID, Cloudinary)
3. Lokalna provjera env + testovi
4. Render Opcija A
5. Deploy + health
6. mail:check
7. Prvi admin
8. Ručni smoke
9. Opcionalno: npm run smoke
10. Ops
```

---

## 1 — MongoDB Atlas (produkcija)

1. Odvojeni cluster / baza (ne lokalni seed).  
2. Korisnik + Network Access (Render IP ili `0.0.0.0/0` ako mora).  
3. Connection string → `MONGO_URI`.  
4. **Nikad** `seed:demo` na ovoj bazi.

## 2 — Tajne i SMTP

```bash
npm --prefix server run generate:jwt-secret
npm --prefix server run generate:vapid
```

`EXPORT_SEAL_SECRET` = druga jaka tajna ≠ `JWT_SECRET`.

| Key | Primjer |
| --- | --- |
| `EMAIL_FROM` | `anyminutes <noreply@vasa-domena.hr>` |
| `SMTP_HOST` / `PORT` / `USER` / `PASS` | Brevo ili sličan relay |
| `SMTP_SECURE` | `false` (587) |

Bez SMTP-a: invite, reset lozinke i booking mail ne stižu.

Preporučeno: `VAPID_*`, Cloudinary, Sentry DSN-ovi, Google Client ID.

## 3 — Lokalna provjera

```bash
cp .env.production.example .env.production
# uredi vrijednosti
node scripts/check-production-env.js --file .env.production --force
npm run test:all
```

## 4 — Render (Opcija A)

Vidi [17-render-deploy.md](17-render-deploy.md).

| Polje | Vrijednost |
| --- | --- |
| Root | *prazno* |
| Build | `npm run build:render` |
| Start | `npm start --prefix server` |

Zalijepi env iz `.env.production`.  
`CLIENT_ORIGIN` i `VITE_API_URL` = stvarni Render HTTPS.  
Nakon `VITE_*`: **Clear build cache & deploy**.

## 5 — Health

1. `GET …/api/health` → `{"ok":true}`  
2. `GET …/` → SPA HTML (ne NOT_FOUND)  
3. `GET …/fonts/DejaVuSans.ttf` → 200  

## 6 — SMTP

```bash
npm --prefix server run mail:check
```

## 7 — Prvi admin

Registriraj se na produkciji, pa:

```bash
node server/scripts/promote-super-admin.js admin@vasa-domena.hr
```

(protiv produkcijskog `MONGO_URI`)

## 8 — Ručni smoke (obavezno)

1. Registriraj pravog vlasnika  
2. Wizard / postavljanje  
3. Dodaj člana → provjeri inbox  
4. Član → `/s/:slug` (ne owner shell)  
5. Rezervacija + otkaz  
6. Push (ako VAPID)  
7. Admin izvoz bez „TEST” trake  
8. Reset lozinke  

## 9 — Automatski smoke (opcionalno)

```powershell
$env:SMOKE_API="https://VAS.onrender.com/api"
$env:SMOKE_WEB="https://VAS.onrender.com"
npm run smoke
```

Limits: [21-limits-testing.md](21-limits-testing.md).

## 10 — Ops nakon lansiranja

CI zelen · logovi · Sentry · rotacija tajni · Cloudinary · custom domena kasnije (ažuriraj origin + clear cache).

---

## Strogo zabranjeno

- `seed:demo` na produ  
- `ADMIN_EMAIL_BOOTSTRAP=true`  
- Slabi / isti JWT i seal secret  
- `localhost` u `CLIENT_ORIGIN` / `VITE_API_URL`  
- Commit tajni  

| Skripta | Kad |
| --- | --- |
| `check-production-env.js` | Prije deploya |
| `build:prod` / `build:render` | Isti build kao Render |
| `mail:check` | Nakon SMTP-a |
| `npm run smoke` | Nakon deploya |
