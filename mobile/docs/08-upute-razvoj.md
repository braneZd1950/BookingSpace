# Upute za razvoj (mobile)

Indeks: [README.md](README.md) · Web: [../../docs/11-cursor-instructions.md](../../docs/11-cursor-instructions.md)

---

## Aktivna pravila

1. Pročitaj [07-status.md](07-status.md) i aktivnu [lean fazu](lean/README.md).  
2. Najmanja promjena koja zatvara fazu.  
3. API gap → zabilježi u [../../docs/lean/backend-status.md](../../docs/lean/backend-status.md), pa tek kod.  
4. UI copy na **hrvatskom**. Brand: **anyminutes**.  
5. Ne dupliciraj autorizaciju samo u UI-u.

---

## Prije koda

1. Koja faza? (M1–M5)  
2. Koji ekrani / API pozivi? ([04](04-ekrani.md), [05](05-api-i-auth.md))  
3. Radi li API lokalno? (`/health`)  
4. Implementiraj → ručni smoke na Expo Go → ažuriraj status  

---

## Principi

- Jedan feature po PR-u / sesiji  
- SecureStore za JWT  
- Jasni loading / error stateovi  
- Ista imena domena kao web (`booking`, `membership`, `tenant`)  
- Bez prerane „super app” navigacije  

## Nemoj

- Novi backend u `mobile/`  
- Hardkodirani demo kapacitet u klijentu  
- Commit `.env` s produkcijskim URL-ovima/tajnama  
- Store submit prije gotove M2 petlje  

---

## Korisne naredbe

```bash
# root
npm run dev
npm run test:mobile-load

# mobile (kad postoji package.json)
cd mobile && npx expo start
```
