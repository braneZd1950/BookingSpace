# Zatvoreni pilot — 1–2 partnera

**Ažurirano:** 2026-11-22 · Brand: **Blizari**  
Indeks: [README.md](README.md) · Go-live: [20-production-launch.md](20-production-launch.md) · Env: [22-render-env-checklist.md](22-render-env-checklist.md)

Ovaj dokument je **checklist + upute** za pravo testiranje **prije javnog launcha**.  
**Nije u opsegu:** blagajna UI, Stripe, native Expo push, Play Store.

---

## 1) Stabilan URL + API (provjereno)

| Servis | URL |
| --- | --- |
| Web | https://bookingspaceapp.onrender.com |
| API health | https://bookingspaceapp.onrender.com/api/health → `{"ok":true}` |

Automatski smoke (2026-11-22): **ALL CHECKS PASSED**.

```powershell
$env:SMOKE_API="https://bookingspaceapp.onrender.com/api"
$env:SMOKE_WEB="https://bookingspaceapp.onrender.com"
npm run smoke
```

Ako Render “spava” (free), prvi request može trajati 30–60 s — normalno.

**Ne raditi:** `seed:demo` na produkcijskoj bazi.

---

## 2) Jedan studio po partneru + 2–3 test člana

### Vlasnik (partner)

1. Otvori https://bookingspaceapp.onrender.com/register  
2. Registriraj se kao **studio / partner**  
3. Prođi `/postavljanje` (naziv, slug, sati, usluga)  
4. U `/stranica/usluge` potvrdi barem 1 aktivnu uslugu  
5. U `/stranica/clanovi` dodaj **2–3 člana** (mail + privremena lozinka ide na inbox)

### Članovi (test računi)

| # | Uloga | Što testira |
| --- | --- | --- |
| 1 | Vlasnik | Termini, dodaj člana, otkaz |
| 2 | Član A | Self-book + otkaz na webu `/s/:slug` |
| 3 | Član B | Isto na **mobilnom APK-u** |

Zapiši u privatni sheet (ne u git): email, privremena lozinka, slug studija.

---

## 3) Preview APK + instalacija

**EAS preview (Android):**  
https://expo.dev/artifacts/eas/qeBgOOjbfezHC9_P-ZRTMhktaTZ07_e3khq-oCoZjno.apk  

*(build `1.0.3` / profile `preview` — istječe ~2026-12-05; po potrebi novi `eas build -p android --profile preview`)*

Expo install stranica (pregled buildova):  
https://expo.dev/accounts/branezd1950/projects/anyminutes/builds

**Instalacija (Android):**
1. Preuzmi APK  
2. Dopusti instalaciju iz nepoznatih izvora za taj browser/file manager  
3. Otvori Blizari → **Prijavite se** istim računom kao na webu  

Opcionalno na Renderu (nakon clear cache deploya):

`VITE_MOBILE_APK_URL=<gornji APK ili Expo build URL>`

---

## 4) Upute za partnera (kopiraj u WhatsApp / mail)

```text
Blizari — zatvoreni test (nije javno)

WEB: https://bookingspaceapp.onrender.com
APP (Android APK): <zalijepi APK link>

Što testiramo:
- prijava vlasnika i članova
- dodavanje člana
- rezervacija i otkaz termina (web i/ili mobitel)
- kalendar zauzeća (bez imena klijenata)

Što NIJE u testu:
- blagajna / naplata karticom u appu
- Stripe
- push na mobitelu (web push može biti uključen)

Uplate: i dalje papir / vaša blagajna. U appu samo status članarine (ACTIVE / …).

Bugovi: javite na <WHATSAPP ili MAIL>
Napišite: uređaj, web ili app, što ste kliknuli, što ste očekivali.
```

---

## 5) Kanal za bugove + Sentry

| Kanal | Koristi za |
| --- | --- |
| WhatsApp / mail (tvoj) | Partner feedback, screenshoti |
| **Sentry — web (React)** | Browser greške, replay |
| **Sentry — API (Node)** | Server 500, stack |
| Mobile Sentry RN | **Još nije u APK-u** — crashove bilježi partner + `adb logcat` / EAS |

Detaljne upute: [25-sentry-pilot-analysis.md](25-sentry-pilot-analysis.md)

---

## 6) Redoslijed poziva

1. Dovrši checklist 1–5  
2. Pozovi **jednog** partnera na 3–5 dana  
3. Popravi kritične bugove  
4. Tek onda drugi partner  

---

## Brzi dnevni check tijekom pilota

```text
□ GET /api/health = ok
□ Sentry Issues (API + Web) — ima li novih?
□ Mail stiže (invite / booking)?
□ Partner feedback inbox prazan?
```
