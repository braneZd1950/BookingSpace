# Primjer pilota — Power Plate

Indeks: [README.md](README.md) · Motor: [04-booking-engine.md](04-booking-engine.md)

---

## Studio

Primjer sluga: `powerfit` → javno `/s/powerfit`  
(Domena `powerfit.…` je vizija, ne proizvod danas.)

## Usluga

```text
Trajanje: 30 min
Interval: 15 min
Kapacitet: 6
Otkaz: 15 min prije
Članarina: obavezna
```

## Raspored (primjer)

```text
17:00  4/6
17:15  6/6  ← POPUNJENO
17:30  3/6
18:00  6/6
```

## Član i uplata

Ivan Horvat plaća 120 € u studiju (gotovina).  
Osoblje zapiše uplatu → sustav kreira `MEM-…` (12 treninga, 01.09.–30.09.).

## Rezervacija

Ivan bira 17:30. Server provjerava:

- aktivnu članarinu  
- dozvoljenu uslugu  
- preostale termine  
- kapacitet  
- konflikte  

Zatim kreira booking i smanjuje preostale termine.

## Pitanje za studio (kapacitet)

Treba li 18:00 i 18:15 imati **odvojena** 6 mjesta (model A) ili dijele isti resurs dok se trajanja preklapaju (model B)?  
Odgovor određuje `bookingSettings.capacityModel`.

## Što mjerimo u pilotu

Koristi li studio app svaki dan za članove i rezervacije umjesto WhatsAppa / papira.
