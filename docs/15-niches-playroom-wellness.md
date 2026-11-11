# Niše: igraonice i wellness (samo priprema)

Indeks: [README.md](README.md) · Lean: [lean/README.md](lean/README.md)

> **Ne graditi sada.** Prioritet: sportski objekti.

---

## Zašto ovaj dokument

Sportski MVP = članarina → termini → rezervacija.  
Igraonice i wellness često **nemaju** mjesečnog „člana studija”. Ovdje bilježimo razlike prije širenja koda.

## Redoslijed

| # | Niša | Što dokazujemo |
| --- | --- | --- |
| 1 sada | Sport | Članarine, kapacitet, owner + self-book |
| 2 kasnije | Igraonica | Termin često bez članarine, kapacitet sobe |
| 3 kasnije | Wellness | Termin po usluzi, manje „membership” jezika |

Dok sportski pilot ne radi u stvarnosti, **ne širi** booking engine.

---

## Sport (referenca)

- Klijent = član s aktivnom članarinom  
- Rezervacija često traži membership + preostale termine  
- UI: članovi, članarine, treninzi  

## Igraonica — priprema

Tipično: roditelj rezervira termin; često bez mjesečne članarine; kapacitet = mjesta u sobi.

| Potreba | Danas |
| --- | --- |
| Booking bez članarine | Često `MEMBERSHIP_REQUIRED` |
| Gost / walk-in | Nema prvoklasnog toka |
| Direktorij partnera | Nema — samo `/s/:slug` |
| Copy „klijenti” umjesto „članovi” | Još sportski |

**Kasnije (ne sad):** `membershipRequired: false`, copy po niši, eventualno profili djece.

## Wellness — priprema

Tipično: tretman / termin po usluzi; paket seansi ili jednokratno; manje „12 treninga mjesečno”.

**Kasnije:** odabir usluge prije slota; labeli „klijenti / termini”.

---

## Pravilo

Najprije dokaži sportske rezervacije. Ovaj dokument je mapa — ne backlog za implementaciju ovog sprinta.
