# Niches: igraonice i wellness (priprema)

> **Status:** dokumentacija / priprema — **ne graditi sada.**  
> **Prioritet pilota:** sportski objekti (fitness, Power Plate, pilates, yoga, grupni treninzi).  
> Lean faze: [lean/README.md](lean/README.md).

## Zašto ovaj dokument

Početna stranica i dugoročna vizija pokrivaju više vrsta poslovanja. U proizvodu prvo dokazujemo petlju **članarina → termini → rezervacija** na sportskim objektima.

Igraonice i wellness **ne mapiraju 1:1** na „mjesečnog člana studija”. Ovaj dokument bilježi razlike, zahtjeve i odluke prije nego što se te niše otključaju u kodu.

## Prioritet isporuke

| Redoslijed | Niša | Što dokazujemo |
| --- | --- | --- |
| **1 — sada** | Sportski objekti | Članarine / paketi treninga, kapacitet termina, owner + član self-book |
| **2 — kasnije** | Igraonice | Rezervacija termina (često bez članarine), roditelj/gost, kapacitet sobe |
| **3 — kasnije** | Wellness / saloni | Jednokratni ili serijski termini, tretmani po usluzi, manje „membership” jezika |

Dok sportski pilot ne prođe mjerenje (rezervacije, otkazi, svakodnevna upotreba), **ne širiti booking engine** na modele bez članarine.

---

## Sportski objekti (referenca — što već ciljamo)

- Klijent = **član** s aktivnom članarinom ili paketom treninga  
- Rezervacija često **zahtijeva** membership + preostale termine  
- Kapacitet po slotu (grupa / Power Plate)  
- UI jezik: članovi, članarine, preostali treninzi  
- Javna stranica: `/s/{slug}`  

Ovo ostaje izvor istine za Phases 1–5.

---

## Igraonice — priprema

### Tipičan način rada

- Roditelj rezervira **termin** (rođendan, otvoreno igralište, sat u sobi)  
- Često **nema** mjesečne članarine; ponekad paket ulaznica / bodova  
- Kapacitet = broj djece / mjesta u terminu  
- Kontakt = roditelj; „korisnik usluge” = dijete (kasnije, opcionalno)  
- Otkaz i pravila (npr. 24h) važniji od „sessions remaining”  

### Što trenutni MVP **ne** pokriva dobro

| Potreba igraonice | Stanje danas |
| --- | --- |
| Rezervacija bez aktivne članarine | Booking često vraća `MEMBERSHIP_REQUIRED` ako je `membershipRequired: true` |
| Gost / jednokratni dolazak | Nema prvoklasnog „walk-in / guest book” toka |
| Katalog partnera (pronadi igraonicu) | Nema javne liste tenanata — samo `/s/{slug}` |
| Djeca kao profili | Nema child/guest entiteta |
| Poseban UI jezik (ne „članovi”) | Owner shell i copy još sportski orijentirani |

### Ciljni model (kasnije — ne implementirati sad)

1. **Service** s `membershipRequired: false` za čiste termine.  
2. Partner UI: „Klijenti / rezervacije” umjesto forsiranih „Članova” (ili label po niši).  
3. Opcija: paket posjeta (isti Membership mehanizam, drugačiji copy: „ulaznice”).  
4. Javna pretraga partnera — vidi Decision 8 u [13-decisions.md](13-decisions.md); post-pilot.  
5. Kapacitet i blocked periods ostaju iz booking enginea.

### Acceptance kad se otključa (skica)

- [ ] Roditelj može rezervirati termin **bez** članarine ako partner tako postavi  
- [ ] Owner vidi kalendar dolazaka  
- [ ] Copy / navigacija ne govore „trening / članarina” kad je niša `playroom`  
- [ ] Otkaz po `cancellationWindowMinutes`  

### Otvorena pitanja (pitati pilota igraonice)

1. Plaćanje unaprijed, na ulazu, ili samo rezervacija?  
2. Treba li pakete (10 ulazaka) u v1 igraonice?  
3. Jedna soba ili više resursa?  
4. Minimalna starost / broj djece po rezervaciji?

---

## Wellness / saloni — priprema

### Tipičan način rada

- Termin = tretman / usluga (trajanje 30–90+ min)  
- Klijent često **nije** „član”; dolazi po dogovoru  
- Kapacitet često **1** (jedan stol / soba) ili mali broj  
- Više usluga (različito trajanje) važnije od jednog „Termin” defaulta  
- Jezik: klijenti, tretmani, termini — ne članarine  

### Što trenutni MVP **ne** pokriva dobro

| Potreba wellness | Stanje danas |
| --- | --- |
| Book bez membership | Isto ograničenje kao igraonice |
| Više usluga u UI-ju klijenta | Member book page koristi prvu uslugu |
| Staff / više teraputa | Roles postoje u modelu; UI nije fokus |
| Resources (soba, stol) | Nema resource scheduling u lean fazama |

### Ciljni model (kasnije)

1. `membershipRequired: false` + usluge po cjeniku.  
2. Klijent bira **uslugu**, zatim sat.  
3. Niša `generic` / budući `wellness` za predloške i copy.  
4. Membership ostaje **opcija** (npr. mjesečni paket tretmana), ne obaveza.

### Acceptance kad se otključa (skica)

- [ ] Rezervacija tretmana bez članarine  
- [ ] Odabir usluge prije slota  
- [ ] Owner kalendar po usluzi / danu  
- [ ] Copy prilagođen niši  

### Otvorena pitanja

1. Jedan ili više zaposlenika po terminu?  
2. Buffer između tretmana?  
3. Online plaćanje obavezno kasnije ili i dalje na licu mjesta?

---

## Zajedničko za obje niše (kasnije)

| Tema | Napomena |
| --- | --- |
| Jedan User račun | Ostaje — Decision 2 |
| Više partnera | Membership / veza po tenantu; katalog partnera odvojen i kasniji |
| Javna stranica `/s/{slug}` | Već korisna za sve niše |
| Pretraga partnera | Post-pilot; ne blokira sportski MVP |
| `niche` na tenantu | Već postoji (`fitness`, `playroom`, …) — koristiti za copy/template kad se otključa |

## Što **ne** raditi dok traje sportski fokus

- Ne mijenjati default `membershipRequired` ponašanje za fitness pilote  
- Ne graditi marketplace / pretragu  
- Ne uvoditi child profiles, resources, multi-staff UI  
- Ne preimenovati cijeli owner shell u „klijenti” ako to zbunjuje fitness pilote — nišni label kasnije  

## Kad otključati implementaciju

Tek nakon što sportski lean loop (owner book + member self-book) pokaže stvarnu upotrebu. Tada:

1. Gap u [lean/backend-status.md](lean/backend-status.md): book bez membership kad service dozvoli  
2. Frontend: member/guest book tok + copy po `niche`  
3. Poseban kratki phase doc (npr. `lean/phase-niche-playroom.md`)  

## Povezani dokumenti

| Doc | Veza |
| --- | --- |
| [01-product-vision.md](01-product-vision.md) | Niše i principi |
| [04-booking-engine.md](04-booking-engine.md) | Slotovi, kapacitet, membership gate |
| [05-memberships-physical-payments.md](05-memberships-physical-payments.md) | Paketi / članarine |
| [13-decisions.md](13-decisions.md) | Decision 8 discovery |
| [12-roadmap.md](12-roadmap.md) | Redoslijed nakon pilota |
| [14-example-powerplate.md](14-example-powerplate.md) | Sportski referentni primjer |
