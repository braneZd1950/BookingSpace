# Product Vision

## Problem

Small fitness studios and similar businesses often manage bookings, customer lists, monthly memberships, remaining sessions, cancellations, group capacity, and schedules through a mixture of WhatsApp, phone calls, spreadsheets, and generic booking tools.

## Solution

BookingSpace combines:

1. A personalized mini-website.
2. Online booking.
3. Capacity management.
4. Memberships and packages.
5. Customer accounts.
6. A business dashboard.

## Positioning

> BookingSpace gives a business its own website, booking system, and customer membership management in one simple platform.

## Initial niche

Start with Power Plate, fitness studios, Pilates, and yoga or group training.

Then expand to children's playrooms, salons, wellness, courses, and other appointment businesses.

## Product principles

### Simple

A business owner should be able to publish a usable booking website in minutes.

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
