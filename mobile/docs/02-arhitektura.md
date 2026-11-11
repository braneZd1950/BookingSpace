# Arhitektura — mobile

Indeks: [README.md](README.md) · Web: [../../docs/02-architecture.md](../../docs/02-architecture.md)

---

## Velika slika

```text
┌─────────────────┐     HTTPS/JSON      ┌──────────────────┐
│  Expo / RN app  │ ──────────────────► │  Express API     │
│  (mobile/)      │ ◄────────────────── │  server/         │
└─────────────────┘      JWT            └────────┬─────────┘
                                                 │
                                                 ▼
                                          MongoDB Atlas
                                          (isti tenantId)
```

Web (`client/`) i mobile dijele **isti** server i bazu.

---

## Stack (cilj)

| Sloj | Izbor |
| --- | --- |
| App | Expo (managed) + React Native |
| Navigacija | React Navigation (native stack + tabs) |
| State / API | Redux Toolkit + RTK Query **ili** tanji sloj oko `fetch` — biraj jedno i drži se |
| Auth token | `expo-secure-store` (ne AsyncStorage za JWT) |
| Push | `expo-notifications` + postojeći VAPID/web-push API (prilagodi native push kasnije) |
| UI | vlastite komponente; hrvatski copy |

Ne uvodи Flutter / drugi native stack.

---

## Multi-tenant

Isto kao web:

- studio = `tenantId`  
- član ulazi preko slug-a studija (`/s/:slug` logika)  
- vlasnik vidi svoje tenante iz `GET /tenants/mine`  
- **nikad** ne šalji „lažni” `tenantId` kao dokaz ovlasti  

---

## Tokovi

**Prijava**

```text
email/lozinka → POST /auth/login → JWT → SecureStore → GET /auth/me
```

**Član — rezervacija**

```text
slug → public tenant → usluga → availability → POST /bookings
(+ privola ako treba)
```

**Vlasnik — termini**

```text
tenant iz /tenants/mine → bookings lista → create/cancel
```

---

## Sigurnost (kratko)

- JWT u SecureStore  
- HTTPS u produkciji  
- Server i dalje odlučuje kapacitet, članarinu, uloge  
- Detalji: [../../docs/10-security-rules.md](../../docs/10-security-rules.md)  

---

## CORS / lokalni razvoj

API već dozvoljava lokalne Expo originе (portovi 8081–8099) u non-prod.  
Na pravom uređaju: `EXPO_PUBLIC_API_URL=http://TVOJ_LAN_IP:4001/api` (ne `localhost` s telefona).
