# Personalized Tenant Websites

## Concept

Every business receives a personalized website under its BookingSpace subdomain.

Examples:

- `powerfit.bookingspace.hr`
- `studioana.bookingspace.hr`
- `igraonica-zadar.bookingspace.hr`

This is more than a booking page. It is a mini business website with booking functionality.

## MVP website sections

- Hero
- About
- Services
- Schedule / Booking
- Gallery
- Contact
- Location
- Opening hours

Sections should be configurable.

## Owner editor

Dashboard section `Website`:

- Logo
- Hero image
- Business name
- Description
- Gallery
- Phone
- Email
- Address
- Social links
- Theme color
- Template
- Visible sections

## Templates

MVP templates:

1. Fitness
2. Pilates
3. Power Plate
4. Children's playroom
5. Generic service business

Do not build a full drag-and-drop website builder in the MVP. Use predefined blocks and templates.

## Theme

Store tenant-specific theme data:

```text
primaryColor
secondaryColor
fontFamily
borderRadius
buttonStyle
```

Keep the number of options small.

## Images

Use Cloudinary or an equivalent. Store only URLs and public IDs in MongoDB. Do not store large binary images directly in MongoDB.

## Public page behavior

When the browser visits `powerfit.bookingspace.hr`, the frontend:

1. Reads the hostname.
2. Extracts the tenant slug.
3. Calls the tenant public API.
4. Loads theme and content.
5. Renders services.
6. Loads availability.
7. Enables booking.

## SEO

Each tenant page should have a title, description, Open Graph metadata, a canonical URL, and basic sitemap support.

Advanced SEO is later.

## Custom domains

Do not implement custom domains in the MVP.

Later, `powerfit.hr` can point to the same tenant after DNS and TLS verification.
