# Status — mobile (demo / pilot)

Indeks: [README.md](README.md) · Web status: [../../docs/16-current-status.md](../../docs/16-current-status.md)

**Ažurirano:** 2026-11-21 · Brand: **Blizari** · Package: `hr.anyminutes.app`

---

## Što postoji danas

| Stavka | Stanje |
| --- | --- |
| Dokumentacija (`mobile/docs`) | **Gotovo** (ovaj set) |
| API klijent (`mobile/src/api`) | **Gotovo** — isti REST kao web |
| Expo projekt | **Gotovo** |
| Landing + brand UI | **Gotovo** |
| M1 Login / shell (član / vlasnik) | **Gotovo** |
| M2 Član — termini (book/cancel) | **Gotovo** |
| M2+ Occupancy kalendar | **Gotovo** |
| M2+ Member account settings | **Gotovo** (shared s weba) |
| M3 Vlasnik — termini / članovi | **Gotovo (pilot)** |
| Discover / FAQ / O nama | **Gotovo** (javni ekrani) |
| API backend spreman | **Da** (isti `server/`) |
| CORS za lokalni Expo | **Da** (portovi 8081–8099 u non-prod) |
| `npm run test:mobile` / `test:mobile-load` | **Da** |
| EAS preview APK | **Da** |
| Maestro flowovi | **Pripremljeno** (zeleni prolaz = uređaj + mreža) |
| M4 Native push | **Ne** (consent prefs postoje; Expo Notifications ne) |
| Store internal / Sentry RN | **Ne** (nije u ovom demu) |

---

## Cilj dema / pilota

Stabilan book/cancel na telefonu (član + vlasnik) preko preview APK-a.  
**Nije u demu:** blagajna, Stripe, native push, javni store.

---

## Što namjerno čeka

- Native Expo push (M4)  
- Play internal / TestFlight + crash reporting (M5 dovršetak)  
- Platform admin na mobitelu  
- Site wizard / page builder  
- Stripe / blagajna  
- Offline-first sync cijele baze  
- Potpuni vizualni 1:1 s web SCSS  

---

## Kad nešto shippaš

1. Označi checkbox u aktivnoj lean fazi.  
2. Ažuriraj ovu tablicu.  
3. Po potrebi jednu rečenicu u [../../docs/16-current-status.md](../../docs/16-current-status.md).  
