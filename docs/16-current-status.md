# Status proizvoda — demo / pilot

**Ažurirano:** 2026-11-21 · Brand u UI-u: **Blizari**  
*(Repo / npm / Expo slug mogu još zvati `bookingspace` / `anyminutes`; package id: `hr.anyminutes.app`.)*  
Indeks: [README.md](README.md)

Ovo je **istina o tome što je u kodu**, ne plan. Lean dokumenti opisuju učenje; nisu blokada razvoja.

---

## Opseg demo / pilot verzije

**U pilotu:** auth, multi-tenant studiji, vlasnik (termini / kalendar / članovi / usluge / analitika / postavke), član (self-book, occupancy kalendar, postavke računa), staff, web push + privola, platform admin, arhivski izvoz, SaaS billing polja, **native mobile** (Expo) za član + vlasnik, EAS preview APK.

**Namjerno nije u pilotu:** blagajna UI, Stripe / online naplata, waitlist, custom DNS, javni store listing, native Expo push.

---

## Što je uživo (web + API)

| Područje | Stanje | Napomena |
| --- | --- | --- |
| Auth (register, login, Google, JWT, profil, lozinka) | Gotovo | Forgot / reset + e-pošta; email change + confirm |
| Account (export, delete, logout-all, notification prefs) | Gotovo | `GET /auth/me/export`, `POST /auth/me/delete`, `POST /auth/logout-all` |
| Multi-tenant studiji (`tenantId`) | Gotovo | Javno po slug-u; hostname proizvod kasnije |
| Owner shell `/stranica` | Gotovo (pilot) | Početna, Termini, Kalendar, Članovi, Usluge, Analitika, Postavke |
| Owner booking | Gotovo | Kreiranje / otkaz; kapacitet; opcionalni trener |
| Member self-book `/s/:slug` | Gotovo | Uz ACTIVE članarinu |
| Member kalendar (occupancy) | Gotovo | Javni summary **bez PII** — `GET …/occupancy` |
| Member postavke računa | Gotovo | Profil, email, ops/promo, tema, sigurnost, privatnost/legal |
| Članovi + paketi (dodaj / obnovi / suspend) | Gotovo | Ledger API postoji; **blagajna UI nije u pilotu** |
| Site wizard `/postavljanje` | Gotovo | Predlošci, paleta, preview; pravi DNS kasnije |
| Discover `/otkrij` | Gotovo | Javni popis studija |
| Staff / treneri | Gotovo | Invite, lista, suspend |
| Web Push + PWA | Gotovo | VAPID na `client/` |
| Privola (consent) | Gotovo | Banner + `POST /consent` |
| Platform admin `/analitika` | Gotovo | Studiji, korisnici, SaaS, izvještaji |
| Arhivski izvoz | Gotovo | PDF / Excel / CSV + HMAC pečat |
| SaaS billing polja + mail | Gotovo | Trial / paid / unpaid |
| Online treninzi | U kodu, **flag off** | `ONLINE_ENABLED = false` |
| Server testovi + GitHub CI | Gotovo | API, client, Playwright, security |

---

## Native mobile (Expo / RN)

| Stavka | Stanje | Napomena |
| --- | --- | --- |
| M1 Auth + shell (član / vlasnik) | **Gotovo** | Login, me, tabs, odjava |
| M2 Član — termini | **Gotovo** | Book / cancel, slotovi, poruke |
| M2+ Kalendar occupancy | **Gotovo** | Isti javni model kao web |
| M2+ Member settings | **Gotovo** | Paritet s web postavkama (shared moduli) |
| M3 Vlasnik — operacije | **Gotovo (pilot)** | Termini, članovi, osnovne operacije |
| M4 Native push | **Nije u pilotu** | Consent u settings postoji; Expo Notifications nije |
| M5 Store / internal track | **Djelomično** | EAS preview APK radi; Play internal / Sentry RN / javni store — kasnije |
| Maestro e2e | **Pripremljeno** | CLI + flowovi; zeleni prolaz ovisi o emulatoru + mreži |

Detalji: [`mobile/docs/07-status.md`](../mobile/docs/07-status.md)

---

## Nije u pilotu / demo

| Stavka | Napomena |
| --- | --- |
| **Blagajna UI** | API `POST/GET …/payments` postoji; UI flag off — **ne ide u ovom demou** |
| **Stripe / online naplata** | Nije u upotrebi |
| Waitlist | Samo spec — nema model/API |
| Hostname → tenant | Samo `/s/:slug` |
| Online / plan UI | Flagovi off |
| Socket.io | Dependency postoji; ne koristi se |
| Native Expo push (M4) | Web VAPID ≠ Expo push |
| Javni store listing | EAS preview dovoljan za demo |

---

## Aplikacije i portovi

| App | Put | Lokalno |
| --- | --- | --- |
| Web | `client/` | http://localhost:5173 |
| API | `server/` | http://localhost:4001 |
| Mobile | `mobile/` | Expo (`npm run web` / uređaj) |

```bash
npm run dev              # web + API
npm test                 # server + client unit
npm run test:e2e:deep    # Playwright deep + security
npm run test:security
npm run test:limits
npm run test:mobile:all
npm run test:mobile:e2e  # Maestro (uređaj + APK)
npm run build:client
```

Tajne: root `.env` (iz `.env.example`). Vite izlaže samo `VITE_*`.

Kompletna matrica: [23-e2e-deep-security.md](23-e2e-deep-security.md)

---

## Gdje dalje

| Trebaš… | Dokument |
| --- | --- |
| Indeks svega | [README.md](README.md) |
| Ići uživo | [20-production-launch.md](20-production-launch.md) |
| REST | [07-api-spec.md](07-api-spec.md) |
| FE rute | [08-routes-frontend.md](08-routes-frontend.md) |
| Što slijedi | [12-roadmap.md](12-roadmap.md) |
| Lean faze | [lean/README.md](lean/README.md) |
| Mobile | [../mobile/docs/README.md](../mobile/docs/README.md) |
