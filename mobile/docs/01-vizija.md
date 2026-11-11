# Vizija — mobilna app

Indeks: [README.md](README.md) · Web vizija: [../../docs/01-product-vision.md](../../docs/01-product-vision.md)

---

## Problem

Vlasnici i članovi studija često su na telefonu. Web radi, ali native app daje brži ulaz, push i bolji dojam „aplikacije studija”.

## Rješenje

**React Native (Expo)** klijent koji:

1. koristi **isti API** kao web  
2. pokriva član (self-book) i vlasnika (termini / članovi)  
3. ne gradi novi backend  

## Jedna rečenica

> Ista anyminutes logika — na telefonu, preko React Nativea.

## Zašto React Native

| Razlog | Objašnjenje |
| --- | --- |
| Web je React | Ista paradigma komponenti, state, fetch |
| Jedna baza / API | MongoDB + Express već gotovi |
| Expo | Brži start, OTA, jednostavniji store build |
| Tim | Manje konteksta za prebacivanje s `client/` |

## Što mobile NIJE

- Nije zamjena weba za admin platforme (`/analitika`) u M1–M3  
- Nije novi booking engine  
- Nije Stripe / waitlist (isto kao web roadmap)  

## Redoslijed vrijednosti

```text
M1 Auth + shell
 → M2 Član termini
 → M3 Vlasnik operacije
 → M4 Push / privola
 → M5 Store release
```

Prvo dokaži da član može rezervirati na telefonu. Ostalo dolazi poslije.
