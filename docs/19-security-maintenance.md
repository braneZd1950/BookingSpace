# Održavanje sigurnosti (ops)

Indeks: [README.md](README.md) · Pravila: [10-security-rules.md](10-security-rules.md) · Env: [22-render-env-checklist.md](22-render-env-checklist.md)

Kratki ops checklist — bez teške birokracije. Server je izvor istine; UI role checkovi su samo pogodnost.

---

## Što štitimo

| Sloj | Fokus |
| --- | --- |
| API | Izolacija studija, authz, uploadi, rate limiti |
| Web | XSS → krađa JWT-a; admin gateovi (server i dalje odlučuje) |

---

## Što je već ojačano

1. `/tenants/mine` — član ne dobiva OIB ni pune interne postavke  
2. Online video — nije javni static; auth / short-lived token  
3. JWT `tokenVersion` — logout / lozinka poništava stare tokene  
4. `ADMIN_EMAILS` — bootstrap izvan produkcije  
5. Helmet (osnovni headeri)  
6. Rate limit kreiranja rezervacija  
7. Upload: magic bytes, ne samo mimetype  
8. Invite osoblja — privremena lozinka samo e-poštom  

---

## Env (produkcija) — minimum

| Varijabla | Pravilo |
| --- | --- |
| `NODE_ENV` | `production` |
| `JWT_SECRET` / `EXPORT_SEAL_SECRET` | Duge, različite, nikad u gitu |
| `ADMIN_EMAIL_BOOTSTRAP` | `false` |
| `CLIENT_ORIGIN` | Točan HTTPS |
| Cloudinary / SMTP / VAPID | Pravi kredencijali; tajne ne u `VITE_*` |

---

## Redovite provjere

- CI zelen prije deploya  
- `npm run test:limits` prije većeg prometa  
- Render logovi: `[mail]`, `[security]`, Sentry  
- Rotacija tajni ako procurе  
- Nakon incidente: bump tokenVersion / logout  

Detaljnija stres-suite: [21-limits-testing.md](21-limits-testing.md).
