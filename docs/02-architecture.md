# Tehnička arhitektura

Indeks: [README.md](README.md) · Status: [16-current-status.md](16-current-status.md) · Backend: [lean/backend-status.md](lean/backend-status.md)

---

## Stack (kratko)

| Sloj | Tehnologije |
| --- | --- |
| Frontend | React, Vite, React Router, Redux Toolkit + RTK Query, SCSS, PWA |
| Backend | Node.js, Express (moduli u `server/src/modules/`), REST, JWT, Mongoose |
| E-pošta / push / mediji | Brevo SMTP, Web Push (VAPID), Cloudinary (ili lokalni `uploads/`) |
| Baza | MongoDB Atlas — jedna baza + `tenantId` |
| Hosting / CI | Render · GitHub Actions (testovi, build, Playwright) |

Stripe je samo rezerviran za kasnije (env placeholderi).

---

## Stil arhitekture

**Modularni monolit.** Bez mikroservisa u MVP-u.

---

## Multi-tenancy

- Jedna MongoDB baza.  
- Dokumenti studija imaju `tenantId`.  
- Javni pristup danas ide **po slug-u** (`/s/:slug`), ne po hostnameu.  
- **Nikad** ne vjeruj `tenantId` iz frontenda za autorizaciju.

---

## Tokovi zahtjeva

**Javna stranica**

```text
slug → GET /tenants/:slug/public → tema/sadržaj → usluge → dostupnost
```

**Dashboard (prijavljen)**

```text
JWT → korisnik → uloga u TenantUser → autorizirani studio
```

**Rezervacija**

```text
korisnik → studio → usluga → članarina → dostupnost → booking (+ opcionalni staffId)
```

---

## Sigurnost (sažetak)

- JWT na zaštićenim rutama  
- Tenant kontekst na serveru (`TenantUser` / uloga)  
- Svaka promjena u studiju: provjera vlasništva i uloge  
- Admin: uloga `ADMIN` (ili bootstrap lista samo izvan produkcije)  
- Privola prije booking tokova koji obrađuju podatke  

Detalji: [10-security-rules.md](10-security-rules.md)

---

## Mobilno

Native app je maknuta. Telefoni koriste responsivni web. Android/iOS kasnije, kad bude spremno.
