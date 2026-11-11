# Status proizvoda

**Ažurirano:** 2026-11-10 · Brand u UI-u: **anyminutes**  
Indeks dokumentacije: [README.md](README.md)

Ovo je **istina o tome što je u kodu**, ne plan. Lean dokumenti opisuju učenje; nisu blokada razvoja.

---

## Što je uživo

| Područje | Stanje | Napomena |
| --- | --- | --- |
| Auth (register, login, JWT, profil, lozinka) | Gotovo | Forgot / reset + e-pošta |
| Multi-tenant studiji (`tenantId`) | Gotovo | Javno po slug-u; hostname proizvod kasnije |
| Owner shell `/stranica` | Gotovo (pilot) | Početna, Termini, Kalendar, Članovi, Analitika, Postavke |
| Owner booking | Gotovo | Kreiranje / otkaz; kapacitet; opcionalni trener |
| Member self-book `/s/:slug` | Gotovo | Uz ACTIVE članarinu |
| Članovi + paketi (dodaj / obnovi / suspend) | Gotovo | Ledger API postoji; blagajna UI tanka (faza 5) |
| Site wizard `/postavljanje` | Gotovo | Predlošci, paleta, preview; pravi DNS kasnije |
| Staff / treneri | Gotovo | Invite, lista, suspend |
| Web Push + PWA | Gotovo | VAPID na `client/` |
| Privola (consent) | Gotovo | Banner + `POST /consent`; ostaje nakon odjave na uređaju |
| Platform admin `/analitika` | Gotovo | Studiji, korisnici, SaaS, izvještaji |
| Arhivski izvoz | Gotovo | PDF / Excel / CSV + HMAC pečat |
| SaaS billing polja + mail | Gotovo | Trial / paid / unpaid |
| Online treninzi | U kodu, **flag off** | `ONLINE_ENABLED = false` |
| Server testovi + GitHub CI | Gotovo | API, client build, Playwright |

---

## Nije u pilotu

| Stavka | Napomena |
| --- | --- |
| Waitlist | Samo spec — nema model/API |
| Hostname → tenant | Samo `/s/:slug`; `{slug}.booking.hr` je copy |
| Blagajna UI | Kasnije; API `POST …/payments` postoji |
| Online / galerija / plan UI | Flagovi off u `studioFeatures.js` / `onlineFeature.js` |
| Stripe | Nije u upotrebi |
| Socket.io | Dependency postoji; ne koristi se |
| Native mobilna app | Kod još nije; **docs** u [`mobile/docs`](../mobile/docs/README.md) (Expo / RN plan) |

---

## Aplikacije i portovi

| App | Put | Lokalno |
| --- | --- | --- |
| Web | `client/` | http://localhost:5173 |
| API | `server/` | http://localhost:4001 |

```bash
npm run dev          # web + API
npm test
npm run test:ci
npm run build:client
```

Tajne: root `.env` (iz `.env.example`). Vite izlaže samo `VITE_*`.

---

## Gdje dalje

| Trebaš… | Dokument |
| --- | --- |
| Indeks svega | [README.md](README.md) |
| Ići uživo | [20-production-launch.md](20-production-launch.md) |
| REST | [07-api-spec.md](07-api-spec.md) |
| Kolekcije | [03-database.md](03-database.md) |
| FE rute | [08-routes-frontend.md](08-routes-frontend.md) |
| Što slijedi | [12-roadmap.md](12-roadmap.md) |
| Lean faze | [lean/README.md](lean/README.md) |
