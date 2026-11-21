# Kompletno testiranje (demo / pilot)

Indeks: [README.md](README.md) · Limits: [21-limits-testing.md](21-limits-testing.md) · Mobile Maestro: [../mobile/docs/e2e-maestro.md](../mobile/docs/e2e-maestro.md)

Prije shippa / dema pokreni što više od matrice ispod. Unit + security + Playwright deep su **obavezni** za web/API. Maestro zahtijeva emulator/uređaj s mrežom.

---

## Matrica naredbi

| Suite | Naredba | Što pokriva | Pilot |
| --- | --- | --- | --- |
| Server unit | `npm run test:server` | Booking, članarine, staff, billing… | Obavezno |
| Client unit | `npm run test:client` | FE unit | Obavezno |
| Sve unit | `npm test` | server + client | Obavezno |
| CI unit | `npm run test:ci` | server CI + client | Obavezno |
| Playwright e2e | `npm run test:e2e` | Web tokovi | Obavezno |
| Playwright deep + security | `npm run test:e2e:deep` | Deep owner/member + authz | Obavezno |
| API security | `npm run test:security` | Hardening, matrix, regressions | Obavezno |
| Limits / load | `npm run test:limits` | IDOR, flood, kapacitet race | Preporučeno |
| Mobile unit | `npm run test:mobile` | RN unit | Obavezno (mobile demo) |
| Mobile API load | `npm run test:mobile-load` | API load za mobile | Preporučeno |
| Mobile sve | `npm run test:mobile:all` | unit + load | Preporučeno |
| Maestro UI | `npm run test:mobile:e2e` | Android UI flowovi | Kad uređaj + APK rade |

```bash
# Tipičan pilot prolaz (web + API + mobile unit)
npm test
npm run test:security
npm run test:e2e:deep
npm run test:mobile:all
npm run test:limits

# UI na telefonu (opcionalno, zahtijeva emulator)
npm run test:mobile:e2e
```

---

## Web (Playwright)

```bash
npm run test:e2e
npm run test:e2e:deep
```

Spekovi:

- `client/e2e/studio-deep-flow.spec.js` — owner nav + članovi + XSS non-execution  
- `client/e2e/member-deep-flow.spec.js` — member termini/postavke + booking gate  
- `client/e2e/security-boundaries.spec.js` — authz / IDOR / logout / login input  
- `client/e2e/helpers/liveApi.js` — seed helper  

**Port:** deep suite koristi API port iz `E2E_API_PORT` / `PW_API_URL` (vidi `client/playwright.config.js`). Lokalni API default: `4001`.

---

## API security matrix

```bash
npm run test:security
```

Uključuje `server/test/security-matrix.test.js` (cross-tenant, oversized body, path id) + hardening / regressions.

---

## Limits

```bash
npm run test:limits
```

Detalji: [21-limits-testing.md](21-limits-testing.md).

**Napomena:** rate limiter je u `NODE_ENV=test` često **preskočen** radi brzine unit suitea — flood→429 očekivanje u limits testu može zahtijevati poseban env. Ne tumači to kao da produkcija nema limit.

---

## Mobile (Maestro)

Vidi `mobile/docs/e2e-maestro.md`.

```bash
npm run test:mobile:e2e
```

Zahtijeva:

1. Maestro CLI  
2. Emulator/uređaj s **mrežom**  
3. Instaliran preview/e2e APK (`hr.anyminutes.app`)  
4. App koja nije blokirana na `expo-updates` (offline emulator → crni splash)

Authenticated booking flowovi čekaju stabilan seed account.

---

## Van opsega testiranja (demo)

- Blagajna / payments UI tokovi (nema UI)  
- Stripe checkout  
- Native Expo push end-to-end  
- Store listing / Play Console  

---

## Napomena

Ovo su **defenzivne** provjere (authz, validacija, non-execution). Nisu offensive exploit PoC-ovi niti jamstvo “0 ranjivosti”.
