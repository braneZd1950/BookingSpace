# Sentry — analiza za zatvoreni pilot (web + API + mobile)

Indeks: [README.md](README.md) · Pilot: [24-closed-pilot.md](24-closed-pilot.md)

U kodu su instrumentirani **web (React)** i **API (Node)**.  
**Native mobile (Expo) još nema Sentry RN** u preview APK-u — do tada mobile greške pratiš ručno + Android log.

---

## Što gdje gledaš

| Sloj | Env / SDK | Sentry project tip | Što vidiš |
| --- | --- | --- | --- |
| **Web** | `VITE_SENTRY_DSN` → `client/src/instrument.js` | Browser / React | Issues, Performance, **Session Replay** |
| **API** | `SENTRY_DSN` → server Node SDK | Node / Express | Issues, Performance, request greške |
| **Mobile** | (nema DSN u APK-u) | — | Nema telemetrije dok ne ugradiš `@sentry/react-native` |

Na Renderu moraju biti postavljeni **oba** DSN-a (vidi [22-render-env-checklist.md](22-render-env-checklist.md)).  
`VITE_SENTRY_DSN` se peče u build — nakon izmjene: **Clear build cache & deploy**.

---

## Kako pokrenuti analizu (Sentry UI)

### A) Web (React SPA)

1. Otvori [https://sentry.io](https://sentry.io) → tvoja organizacija  
2. Odaberi **browser / React** projekt (onaj čiji je DSN u `VITE_SENTRY_DSN`)  
3. **Issues** → filter `is:unresolved` + environment `production`  
4. Otvori issue → **Stack Trace**, **Breadcrumbs**, **Tags** (`url`, `browser`, …)  
5. Ako ima Replay: tab **Replay** / **User Feedback** — snimka sesije oko greške  
6. **Performance** → spore transakcije (page loads, navigacija)

**Brza provjera da web šalje evente:**

- Otvori produkciju, DevTools → konzola, namjerno baci grešku na nekoj stranici *ili*  
- U lokalnom non-prod postoji debug ruta na API-ju; za SPA dovoljan je stvarni bug / `Sentry.captureException` u konzoli ako izložiš helper  

Ako Issues ostanu prazni: DSN nije u **buildu** (provjeri Render `VITE_SENTRY_DSN` + redeploy s clear cache).

### B) API (Node)

1. U Sentryju odaberi **Node / API** projekt (`SENTRY_DSN`)  
2. **Issues** → `is:unresolved` environment `production`  
3. Traži 5xx, `HttpError`, Mongo / mail greške  
4. **Performance** → spore `/api/...` rute  

**Lokalna / agent provjera API DSN-a** (samo ako imaš lokalni `.env` s `SENTRY_DSN`):

```bash
node server/scripts/sentry-verify.mjs
```

Zatim u Sentryju Search: tekst poruke `Sentry agent verify …`.

Na produkciji (non-production only u kodu postoji debug crash ruta) — **ne** spamaj crash endpoint na produ.

### C) Mobile (trenutno)

| Što | Kako |
| --- | --- |
| Crash / crni ekran | Partner šalje screenshot + model telefona |
| Lokalni debug | `adb logcat \| findstr /i "ReactNativeJS Expo Updates Error"` |
| Sentry RN | **Sljedeći korak** (M5): `@sentry/react-native` + novi EAS preview — tek onda Issues za mobile |

Dok Sentry RN nije u APK-u, **ne očekuj** mobile evente u Sentryju.

---

## Preporučeni dnevni ritam tijekom pilota

```text
1. Sentry → API Issues (zadnjih 24h)
2. Sentry → Web Issues + Replay (zadnjih 24h)
3. Render logs (mail / security)
4. Partner WhatsApp inbox
```

**Prioritet triageja**

1. Ne može book / cancel  
2. Ne može login / reset lozinke  
3. Mail ne stiže  
4. UI glitch bez blokade  

---

## Što uključiti u alert (opcionalno, Sentry UI)

- Alert: novi **unresolved** issue na API projektu (email / Slack)  
- Alert: spike 5xx / error rate  
- Ne alarmiraj na svaki Replay — samo Issues prvih dana  

---

## Dva projekta (najčešća zabuna)

Imaš **dva** Sentry projecta — Issues jednog **ne** pokazuju evente drugog:

| Env na Renderu | Project u Sentryju | Što šalje |
| --- | --- | --- |
| `VITE_SENTRY_DSN` | **Web / React** (npr. `bookingspace`) | Browser greške s produkcijskog weba |
| `SENTRY_DSN` | **API / Node** (drugi project) | Server greške |

Ako gledaš samo `bookingspace` + filter **24h / Recommended**, a nema novih browser crashova, lista je prazna — iako API radi.

**Provjera da je Render OK:** `GET /api/health` → `"sentry": true`.

**API test event (lokalno):** `node server/scripts/sentry-verify.mjs` → traži u **Node** projektu.

**Prod API ping (nakon deploya):** postavi `SENTRY_VERIFY_TOKEN` na Renderu, zatim  
`GET /api/sentry-ping?token=…` → traži poruku `sentry-ping …` u **Node** projektu.

---

## Checklist prije partnera

- [ ] Render ima `SENTRY_DSN`  
- [ ] Render ima `VITE_SENTRY_DSN` + **clear cache deploy** nakon dodavanja  
- [ ] `/api/health` vraća `"sentry": true`  
- [ ] U Sentryju znaš koji project = Web, koji = API  
- [ ] U Web projektu makni Recommended / proširi raspon datuma  
- [ ] Partnerima je jasan bug kanal (WhatsApp/mail)  
- [ ] Mobile: bez Sentry RN — dogovoreno da javljaju ručno  

---

## Kasnije (nakon feedbacka)

1. `@sentry/react-native` u `mobile/` + EAS rebuild  
2. Release health / source maps za Web  
3. Suspect commits kad vežeš GitHub repo u Sentry  
