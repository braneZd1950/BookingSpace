# Odluke (ADR) — kratko

Indeks: [README.md](README.md) · Status: [16-current-status.md](16-current-status.md)

---

| # | Odluka | Zašto |
| --- | --- | --- |
| 1 | Jedna MongoDB + `tenantId` | Jednostavnije, jeftinije; izolacija preko autorizacije |
| 2 | Jedan trajni User ID | Povijest članarina, više studija |
| 3 | Payment ≠ Membership | Uplata = novac; članarina = pravo na trening |
| 4 | Javna stranica preko slug-a; DNS kasnije | Prvo dokazati booking |
| 5 | Booking s trajanjem, intervalom, kapacitetom | Grupni / Power Plate |
| 6 | Modularni monolit | Brža iteracija |
| 7 | Bez online naplate u MVP-u | Blagajna UI = faza 5 |
| 8 | Cross-tenant discovery kasnije | Autorizacija ostaje po studiju |
| 9 | Lean FE prvo; backend više nije „frozen” | Diraj najmanju površinu; dokumentiraj |
| 10 | Sport prvi; igraonica/wellness samo priprema | [15](15-niches-playroom-wellness.md) |
| 11 | `membershipRequired` kasnije konfigurabilan po niši | |
| 12 | Brand **anyminutes** u UI-u | Repo može još zvati BookingSpace |
| 13 | Mobile = Expo/RN u `mobile/`, web ostaje primarni | Isti API; docs prve, kod od faze M1 — [mobile/docs](../mobile/docs/README.md) |
| 14 | Online iza flaga | `ONLINE_ENABLED = false` dok ne kažemo |

Detalji konteksta za svaku odluku žive u povijesti gita; ova tablica je dovoljna za svakodnevni rad.
