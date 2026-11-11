# Vizija proizvoda

Indeks: [README.md](README.md) · Status: [16-current-status.md](16-current-status.md)

Brand u aplikaciji: **anyminutes**.

---

## Problem

Mali fitness studiji često vode rezervacije, članove, pakete treninga, otkaze i raspored preko WhatsAppa, telefona i Excela. To je sporo i lako se zabrlja.

## Rješenje

anyminutes na jednom mjestu nudi:

1. rezervacije i kapacitet termina  
2. članarine / pakete  
3. račune članova  
4. dashboard za studio  
5. jednostavnu javnu stranicu studija  

## Jedna rečenica

> Studio vodi članarine i termine na jednom mjestu — članovi rezerviraju sami.

Redoslijed rada (1–4 već uglavnom gotovo):  
**članovi i sati → rezervacije vlasnika → self-book člana → javna stranica → blagajna (UI).**

---

## Niša

**Prvo:** sportski objekti — Power Plate, fitness, pilates, yoga, grupni treninzi.

**Kasnije (samo priprema):** igraonice i wellness — [15-niches-playroom-wellness.md](15-niches-playroom-wellness.md).  
Ne širi MVP dok sportska petlja nije dokazana u stvarnom studiju.

---

## Principi

| Princip | Znači |
| --- | --- |
| Jednostavno | Vlasnik upravlja članovima i terminima u minutama |
| Multi-tenant | Svaki studio izoliran preko `tenantId` |
| Fleksibilno | Podržava individualne i grupne termine s kapacitetom |
| Ponovljivo | Isti backend/frontend za više niša |
| Sigurno | **Server** odlučuje smije li netko rezervirati — ne React |

---

## Korisnici

| Uloga | Što radi |
| --- | --- |
| Vlasnik | Otvara i vodi studio |
| Član | Jedan račun; može biti u više studija |
| Osoblje / trener | Termini i članovi u dodijeljenom studiju |
| Admin platforme | Pregled cijelog sustava |

## Odnos podataka (skica)

```text
User → TenantMembership → MembershipPlan → Booking → Service → Tenant
```
