# Product Vision

> **How we ship now:** lean phases in [lean/README.md](lean/README.md). Frontend first; backend frozen until unlocked.

## Problem

Small fitness studios and similar businesses often manage bookings, customer lists, monthly memberships, remaining sessions, cancellations, group capacity, and schedules through a mixture of WhatsApp, phone calls, spreadsheets, and generic booking tools.

## Solution

BookingSpace combines (full vision):

1. Online booking and capacity management.
2. Memberships and packages.
3. Customer accounts.
4. A business dashboard.
5. A simple public studio page (after the booking loop works).

## Positioning

> BookingSpace helps a studio run memberships and bookings in one place — then gives clients a simple way to book.

Lean launch order: **members & hours → owner bookings → member self-book → public page → physical payments.**

## Initial niche

**Pilot first:** sports venues — Power Plate, fitness studios, Pilates, yoga, and group training (memberships + capacity slots).

**Prepared, not built yet:** children's playrooms and wellness/salons — see [15-niches-playroom-wellness.md](15-niches-playroom-wellness.md). Those niches often book appointments or visit packs **without** gym-style memberships; do not stretch the sports MVP to cover them until the sports booking loop is proven.

## Product principles

### Simple

A business owner should be able to manage members and bookings in minutes. A public page comes after that loop works.

### Multi-tenant

Every business is isolated by `tenantId`.

### Flexible

The booking engine must support both appointments and capacity-based group sessions.

### Reusable

The same backend and frontend should support multiple niches.

### Secure

The backend, not the frontend, decides whether a user can book.

## Main user types

### Business owner

Creates and manages a business.

### Customer

Creates one BookingSpace account and can belong to multiple businesses.

### Staff

Manages bookings and customers for an assigned tenant.

### Admin

Manages the platform.

## Core relationship

`User -> TenantMembership -> MembershipPlan -> Booking -> Service -> Tenant`
