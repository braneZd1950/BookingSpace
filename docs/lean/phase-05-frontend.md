# Faza 5 — Naplata i planovi (blagajna)

**Stanje:** van demo / pilot opsega (planovi/obnova postoje; blagajna UI fali)  
**Hipoteza:** Zapis gotovine/kartice u studiju drži broj termina točnim.  
**Pravila:** [../05-memberships-physical-payments.md](../05-memberships-physical-payments.md) · API: [backend-status.md](backend-status.md)

---

## Cilj

UI za planove, zapis fizičke uplate i pregled potrošnje termina.

## Već gotovo

| Područje | Ponašanje |
| --- | --- |
| Planovi preko članova | Auto create / renew pri dodavanju |
| Potrošnja | Preostali termini; book/cancel |
| Payments API | `POST/GET …/payments` |

## Još u opsegu ove faze (nakon pilota)

| Područje | Ponašanje |
| --- | --- |
| Blagajna UI | Gotovina / kartica / transfer → aktivira ili produžuje članarinu |
| Povijest uplata | Lista tipa „blagajna” za studio |

## Izvan opsega

Stripe · automatske obnove · promo kodovi · puno knjigovodstvo

## Demo / pilot

**Ne radi se u ovom demu.** Članarine se vode preko „dodaj / obnovi / suspend” na članovima; fizička naplata ostaje papir / vanjske blagajne dok studio ne potvrdi booking petlju.

## Mjeri / uči

Aktivne članarine u app-u = papir / blagajna studija.  
Ako se ne poklapaju — popravi petlju booking↔članarina prije gatewaysa.

## Done kad

- [ ] Vlasnik zapiše fizičku uplatu u UI  
- [x] Preostali termini se ažuriraju nakon rezervacija  
- [ ] Bez Stripe rada  
