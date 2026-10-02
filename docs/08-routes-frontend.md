# Frontend Routes and UX

## Public platform

| Route | Page |
| --- | --- |
| `/` | Landing page |
| `/login` | Login |
| `/register` | Registration |
| `/choose-niche` | Choose a business category |
| `/create-business` | Create a tenant |

## Tenant public website

The tenant is resolved from the hostname. Examples:

- `powerfit.bookingspace.hr/`
- `powerfit.bookingspace.hr/services`
- `powerfit.bookingspace.hr/book`

The public tenant page should not require login to browse. Login is required to finalize a member-only booking.

## Customer area

| Route | Page |
| --- | --- |
| `/my-bookings` | The customer's bookings |
| `/my-memberships` | The customer's memberships |
| `/profile` | Profile |

## Business dashboard

| Route | Page |
| --- | --- |
| `/dashboard` | Overview |
| `/dashboard/calendar` | Calendar |
| `/dashboard/bookings` | Bookings |
| `/dashboard/customers` | Customers |
| `/dashboard/memberships` | Memberships |
| `/dashboard/payments` | Physical payments |
| `/dashboard/services` | Services |
| `/dashboard/website` | Website editor |
| `/dashboard/settings` | Business settings |

## Booking UX

```text
Choose service
  -> Choose date
  -> See available capacity
  -> Choose time
  -> Login or register if required
  -> Membership check
  -> Confirm booking
  -> Success
```

## Member-only behavior

A non-member can see `18:00` and `4/6`, but the button says `MEMBERSHIP REQUIRED`.

The user can view the service, schedule, price, and membership options. The backend blocks booking without an eligible membership.

## Customer cross-tenant discovery

A logged-in user can browse other businesses. Example:

```text
PowerFit        ACTIVE MEMBERSHIP   [BOOK]
Pilates Ana     NO MEMBERSHIP       [VIEW]
FitZone         NO MEMBERSHIP       [VIEW]
```

The user has one BookingSpace account. Membership rights are always tenant-specific.

## Business dashboard principle

Keep it operational, not complicated.

The first screen should show today's bookings, today's occupancy, active memberships, memberships expiring soon, and quick actions.
