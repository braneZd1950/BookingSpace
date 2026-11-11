# Faza M3 — Vlasnik: termini i članovi

**Stanje:** planirano (nakon M2)  
**Hipoteza:** Vlasnik obavi dnevne operacije s telefona (bez weba).  
**Web:** [../../../docs/lean/phase-02-frontend.md](../../../docs/lean/phase-02-frontend.md)

---

## Cilj

Minimalni owner kokpit: termini (book/cancel) + osnovni članovi.

## U opsegu

| Korak | Što napraviti |
| --- | --- |
| 1 | Odabir tenanta (`/tenants/mine`) |
| 2 | Termini dana — lista bookinga |
| 3 | Nova rezervacija (član + slot + staff ako treba) |
| 4 | Otkaz |
| 5 | Članovi: lista, dodaj/obnovi (minimalno) |

## Izvan opsega

Kalendar-mjesec fancy UI · analitika · postavljanje stranice · blagajna

## Mjeri

Vlasnik odradi jutarnje rezervacije samo na mobitelu jedan dan.

## Learn

Ako „dodaj člana” fali mail — SMTP je ops problem, ne RN bug.

## Done kad

- [ ] Owner vidi današnje termine  
- [ ] Može bookati člana  
- [ ] Može otkazati  
- [ ] Vidi listu članova (minimalno)  
