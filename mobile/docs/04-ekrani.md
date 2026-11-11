# Ekrani (mapa)

Indeks: [README.md](README.md) · Web rute: [../../docs/08-routes-frontend.md](../../docs/08-routes-frontend.md)

Mobile **ne mora** 1:1 kopirati sve web rute. Prvo paritet člana i vlasničkih termina.

---

## Auth (svi)

| Ekran | Odgovara webu | Napomena |
| --- | --- | --- |
| Prijava | `/login` | email + lozinka |
| Registracija člana | dio `/register` | po potrebi; vlasnik može ostati na webu u M1 |
| Zaboravljena lozinka | `/zaboravljena-lozinka` | isti API |
| Privola | banner / gate | prije bookinga |

---

## Član (prioritet M2)

| Ekran | Web | Sadržaj |
| --- | --- | --- |
| Početna studija | `/s/:slug` | članarina, CTA termini |
| Termini | `/s/:slug/termini` | dani, slotovi, book/cancel |
| Postavke | member settings (dio) | tema, obavijesti, privola, odjava |

Odabir studija: slug iz deep linka, QR, ili lista iz `memberships/my`.

---

## Vlasnik (prioritet M3)

| Ekran | Web | Sadržaj |
| --- | --- | --- |
| Početna | `/stranica` | kratki pregled (bez site buildera) |
| Termini | `/stranica/termini` | raspored, book, cancel |
| Članovi | `/stranica/clanovi` | lista, dodaj/obnovi (minimalno) |
| Postavke | `/stranica/postavke` | profil, obavijesti, odjava |

**Ne** u prvim fazama: wizard `/postavljanje`, platform `/analitika`, blagajna, online katalog.

---

## Navigacija (predloženo)

```text
AuthStack
  Login | ForgotPassword | Consent

MemberTabs
  Home | Termini | Postavke

OwnerTabs
  Home | Termini | Članovi | Postavke
```

Nakon `/auth/me`: ako je owner/staff za tenant → Owner; ako ima membership → Member.  
Korisnik s obje uloge: izbornik „Uđi kao…”.

---

## Deep linkovi (kasnije)

Primjeri:

- `anyminutes://s/{slug}/termini`  
- `https://…/s/{slug}/termini` (universal links u M5)  

---

## UI principi

- Jedan posao po ekranu  
- Jasni hrvatski labeli (Termini, Članovi, Prihvaćam…)  
- Tamna/svijetla tema — po želji kasnije; prvo funkcionalnost  
- Ne graditi web SiteFrame u nativeu  
