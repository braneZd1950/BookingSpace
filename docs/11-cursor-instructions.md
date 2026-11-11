# Upute za rad u Cursoru / razvoj

Indeks: [README.md](README.md) · Status: [16-current-status.md](16-current-status.md)

---

## Aktivna pravila

1. Pročitaj [16-current-status.md](16-current-status.md) i relevantnu lean fazu.  
2. Najmanja promjena koja pomiče cilj (trenutno: faza 5 blagajna UI, osim ako korisnik kaže drugačije).  
3. Backend smiješ dirati — zabilježi rupu u [lean/backend-status.md](lean/backend-status.md) i ažuriraj [07-api-spec.md](07-api-spec.md) / [03-database.md](03-database.md).  
4. UI copy na **hrvatskom**. Brand: **anyminutes**.

---

## Prije koda

1. Odredi područje (lean faza ili rupa u statusu).  
2. Pogledaj postojeći `client/` / `server/` kod.  
3. Predloži najmanju implementaciju.  
4. Implementiraj; dodaj/proširi server test za booking / članarine / staff / billing.  
5. Smoke u browseru.  
6. Navedi izmijenjene datoteke.

---

## Principi koda

- Jasna imena; tanke stranice; dijeljeni helperi samo ako već postoje  
- HTTP preko RTK Query (bez Axiosa)  
- Autorizacija na **serveru**, ne samo u Reactu  
- Bez preranih apstrakcija  

## Layout repoa

```text
client/src/     # SPA
server/src/     # Express moduli, modeli
server/test/    # API testovi
docs/           # ova dokumentacija
docs/lean/      # faze učenja
scripts/        # dev, smoke
.github/        # CI
```

---

## Nemoj

- Waitlist / Stripe / marketplace bez eksplicitnog zahtjeva  
- Paliti Online bez namjernog `ONLINE_ENABLED`  
- `seed:demo` na produkcijskoj bazi  
- Commitati `.env` / tajne  
