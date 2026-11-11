# Dizajn baze

Indeks: [README.md](README.md) · Status: [16-current-status.md](16-current-status.md)

Uskladi s Mongoose modelima u `server/src/models/`.

---

## Kolekcije

### Osnovne (MVP)

`users`, `tenants`, `tenantUsers`, `services`, `membershipPlans`, `memberships`, `payments`, `bookings`

### Već u kodu

`onlineWorkouts`, `pushSubscriptions`, `consentEvents`, `usageEvents`, `staffNotifications`

### Samo u planu

- `waitlistEntries` — još nema  
- Zasebna `sitePages` — **nema**; stranica živi u `tenants.siteSettings`

---

## User (korisnik)

Jedan trajni račun. **Ne** stvaraj novog korisnika svaki mjesec.

| Polje | Napomena |
| --- | --- |
| name, email, passwordHash, phone | Osnovni profil |
| role | `CUSTOMER`, `BUSINESS_OWNER`, `STAFF`, `ADMIN` |
| notificationPrefs | e-pošta + push |
| privacyConsent | privola (verzija, datum…) |
| passwordReset* | select: false |

Platform admin: `role === ADMIN` **ili** (samo izvan produkcije) email u `ADMIN_EMAILS`.

---

## Tenant (studio)

| Polje | Napomena |
| --- | --- |
| name, slug | Jedinstveni slug |
| niche | npr. powerplate, fitness, pilates… |
| ownerId, kontakt, adresa, timezone | |
| theme | boje, font, radius |
| siteSettings | predložak, layout, galerija, SEO |
| bookingSettings | sati rada, kapacitet model |
| billing | SaaS status (trial / paid…) |
| active | |

---

## TenantUser

Veza korisnik ↔ studio. Jedan korisnik može biti u više studija.

```text
tenantId, userId, role (OWNER|STAFF|CUSTOMER), status (ACTIVE|INVITED|SUSPENDED)
```

---

## Service (usluga)

```text
tenantId, name, durationMinutes, slotIntervalMinutes, capacity,
price, active, membershipRequired, cancellationWindowMinutes
```

Primjer: Power Plate, 30 min, interval 15, kapacitet 6.

---

## MembershipPlan / Membership

**Plan** = što se prodaje (npr. „12 treninga”, cijena, valjanost).  
**Membership** = konkretna kupljena članarina člana (`MEM-2026-…`, status, potrošeni termini).

---

## Payment

Knjiga fizičkih uplata. Metode: `CASH`, `CARD_TERMINAL`, `BANK_TRANSFER`, `ONLINE` (enum; Stripe još nije).

Uplata ≠ pravo na trening — pravo je **Membership**.

---

## Booking

```text
tenantId, serviceId, userId, membershipId, staffId?,
date, startTime, endTime,
status (CONFIRMED|CANCELLED|COMPLETED|NO_SHOW),
source (CUSTOMER|STAFF)
```

---

## Ostalo (kratko)

| Kolekcija | Svrha |
| --- | --- |
| OnlineWorkout | Video treninzi (UI flag off) |
| PushSubscription | Web Push pretplata |
| ConsentEvent | Audit privole |
| UsageEvent | Analitika |
| StaffNotification | Red obavijesti osoblju |

---

## Indeksi (važni)

```text
Tenant.slug unique
User.email unique
Service(tenantId, active)
Membership(tenantId, userId, status)
Booking(tenantId, date, startTime, serviceId, status)
TenantUser(tenantId, userId) unique
```

## Izolacija

Svaka kolekcija studija mora imati `tenantId`. Upiti uvijek filtriraju po autoriziranom studiju.
