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
| 7 | Bez online naplate u MVP-u | Blagajna UI = faza 5, **van dema** |
| 8 | Cross-tenant discovery kasnije | Autorizacija ostaje po studiju |
| 9 | Lean FE prvo; backend više nije „frozen” | Diraj najmanju površinu; dokumentiraj |
| 10 | Sport prvi; igraonica/wellness samo priprema | [15](15-niches-playroom-wellness.md) |
| 11 | `membershipRequired` kasnije konfigurabilan po niši | |
| 12 | Brand **Blizari** u UI-u | Repo / Expo slug mogu još zvati anyminutes / bookingspace |
| 13 | Mobile = Expo/RN u `mobile/`, web ostaje primarni | Isti API; docs prve, kod od faze M1 — [mobile/docs](../mobile/docs/README.md) |
| 14 | Online iza flaga | `ONLINE_ENABLED = false` dok ne kažemo |
| 15 | Otkrij = opt-in sloj | SaaS (privatno) i javno otkrivanje odvojeno; vlasnik bira |
| 16 | Tri razine vidljivosti | `private` · `public` · `public_contact` na tenantu |

### Otkrij — vidljivost (ADR 15–16)

- **private** (zadano): nije u `/otkrij`; pristup poveznicom ili članstvom (fitness / članarine).
- **public**: prikaz u Otkrij + online rezervacije na stranici poslovanja.
- **public_contact**: prikaz u Otkrij radi pregleda; rezervaciju dogovara vlasnik.
- Demo / seed slugovi (`demo-fitness`, …) nikad u javnom katalogu.
- Mock primjeri samo lokalno; produkcijski Otkrij = živi opt-in zapisi.
- Budući filtri (grad, udaljenost, termini, foto, recenzije) grade se na ovom modelu.

Detalji konteksta za svaku odluku žive u povijesti gita; ova tablica je dovoljna za svakodnevni rad.
