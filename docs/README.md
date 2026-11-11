# Dokumentacija — anyminutes

Jednostavan indeks na hrvatskom. Počni od **što trebaš**, ne od broja datoteke.

Brand u aplikaciji: **anyminutes** (repo može još zvati `bookingspace`).

---

## Brzi start

| Želim… | Idi ovdje |
| --- | --- |
| Pokrenuti lokalno | [Root README](../README.md#lokalno) → `npm run dev` |
| Znati što je gotovo | [16 — Status](16-current-status.md) |
| Ići u produkciju | [20 — Go-live](20-production-launch.md) |
| Postaviti Render env | [22 — Env checklist](22-render-env-checklist.md) |
| Razumjeti Render | [17 — Deploy](17-render-deploy.md) |
| Graditi **mobilnu** app (RN/Expo) | [../mobile/docs/README.md](../mobile/docs/README.md) |

```bash
cp .env.example .env
npm run dev    # web :5173 + API :4001
npm test
```

---

## Po ulozi

### Pilot / proizvod

1. [16 — Status](16-current-status.md)  
2. [12 — Roadmap](12-roadmap.md)  
3. [lean/README.md](lean/README.md) — faze 1–5  
4. [01 — Vizija](01-product-vision.md)  

### Deploy

1. [20 — Go-live](20-production-launch.md)  
2. [22 — Env](22-render-env-checklist.md)  
3. [17 — Render](17-render-deploy.md)  
4. [19 — Ops sigurnost](19-security-maintenance.md)  
5. [21 — Limits](21-limits-testing.md)  

### Razvoj

1. [11 — Kako raditi](11-cursor-instructions.md)  
2. [08 — FE rute](08-routes-frontend.md)  
3. [07 — API](07-api-spec.md)  
4. [03 — Baza](03-database.md)  
5. [lean/backend-status.md](lean/backend-status.md)  

---

## Svi dokumenti

### Svakodnevno

| Datoteka | Sadržaj |
| --- | --- |
| [16-current-status.md](16-current-status.md) | Što je shipped |
| [20-production-launch.md](20-production-launch.md) | Prva produkcija |
| [22-render-env-checklist.md](22-render-env-checklist.md) | Render Environment |
| [17-render-deploy.md](17-render-deploy.md) | Deploy |
| [08-routes-frontend.md](08-routes-frontend.md) | FE rute |
| [07-api-spec.md](07-api-spec.md) | REST |
| [lean/README.md](lean/README.md) | Lean faze |

### Referenca

| Datoteka | Sadržaj |
| --- | --- |
| [01](01-product-vision.md) | Vizija |
| [02](02-architecture.md) | Arhitektura |
| [03](03-database.md) | Baza |
| [04](04-booking-engine.md) | Motor rezervacija |
| [05](05-memberships-physical-payments.md) | Članarine / naplata |
| [06](06-tenant-website.md) | Javna stranica |
| [09](09-mvp-build-plan.md) | MVP acceptance |
| [10](10-security-rules.md) | Sigurnosna pravila |
| [11](11-cursor-instructions.md) | Razvojne upute |
| [12](12-roadmap.md) | Roadmap |
| [13](13-decisions.md) | Odluke (ADR) |
| [14](14-example-powerplate.md) | Primjer Power Plate |
| [15](15-niches-playroom-wellness.md) | Niše (kasnije) |
| [19](19-security-maintenance.md) | Ops sigurnost |
| [21](21-limits-testing.md) | Limits test |

### Lean

[lean/README.md](lean/README.md) · [backend-status](lean/backend-status.md) · phase-01 … phase-05

---

## Konvencije

- **Status** = [16](16-current-status.md)  
- **API / baza** = [07](07-api-spec.md) / [03](03-database.md) — ažuriraj uz kod  
- Tajne nikad u git  
- Ne `seed:demo` na produ  

Ne znaš odakle? → ovaj README → **Brzi start**.
