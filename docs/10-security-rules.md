# Sigurnosna pravila

Indeks: [README.md](README.md) · Ops: [19-security-maintenance.md](19-security-maintenance.md) · Backend: [lean/backend-status.md](lean/backend-status.md)

Ova pravila su **obvezujuća**. Frontend ih ne smije zaobići.

---

## Autentikacija

- Lozinke: bcrypt (12 rundi)  
- JWT: `sub` + `tokenVersion` — bump na odjavu / promjenu / reset lozinke  
- Rate limit na auth i kreiranje rezervacija  
- Ne logiraj lozinke ni tokene  
- Privremene lozinke samo e-poštom, **ne** u JSON-u  
- Produkcija: kraći život JWT-a (`JWT_EXPIRES_IN`, default `24h`)

## Admin platforme

- Produkcija: samo uloga `ADMIN` / `PLATFORM_STAFF`  
- `ADMIN_EMAILS` = bootstrap **izvan** produkcije (ili eksplicitni flag)  
- Promote: `server/scripts/promote-super-admin.js`

## Izolacija studija

Svaki dokument studija ima `tenantId`.  
Server sam određuje dozvoljeni studio iz JWT konteksta.

```text
JWT → autorizirani studio → resource.tenantId mora odgovarati
```

Pogrešno: vjerovati `tenantId` iz bodyja.  
`GET /tenants/mine` za člana: **bez** OIB-a i punih internih booking postavki.

## Privatnost

Član vidi samo svoje rezervacije / članarine.  
Osoblje vidi samo članove **svog** studija.

## Booking i cijene

Prije inserta server **ponovno** računa dostupnost.  
Ne vjeruj frontend `available`, kapacitetu, statusu članarine ni cijeni.  
Pri uplati: plan i iznos validiraj na serveru; stvarni iznos spremi u payment/membership.

## Uploadi

MIME + magic bytes, veličina, formati.  
Cloudinary u produkciji.  
Plaćeni video **nije** javni static file — auth / signed ruta.

## GDPR (osnova)

Privatnost, uvjeti, brisanje računa, razumna retencija.  
Ne skupljaj podatke koji nisu potrebni za booking.
