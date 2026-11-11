# Limits testiranje (sigurnost + opterećenje)

Indeks: [README.md](README.md) · Sigurnost: [19-security-maintenance.md](19-security-maintenance.md)

Teška suite — **nije** dio svakodnevnog `npm test`.

```bash
npm run test:limits
```

---

## Što provjerava

| Područje | Provjere |
| --- | --- |
| Authz / IDOR | Bez auth, tuđi tenant, tuđi cancel |
| JWT | Krivi secret, bumpani `tokenVersion`, logout |
| Privatnost | Član bez OIB-a u `/tenants/mine` |
| Uploadi | Video put zatvoren |
| Headeri | Helmet na `/api/health` |
| Payload | JSON > 1 MB → odbijen |
| Rate limit | Flood logina → 429 |
| Load | Health / public / discover storm |
| Kapacitet | 8 paralelnih bookova na capacity=1 → točno jedan `201` |
| SPA | Ako postoji `client/dist`, `/` HTML < 2 s |

Suite je ranije ulovila race za overbooking; create booking sada re-checka kapacitet nakon inserta.

---

## Napomene

- In-memory Mongo (sigurno lokalno / CI)  
- Auth flood ide **zadnji**  
- Latency budžeti su za lokalni Node — CI može biti sporiji  
- Live produkcijski smoke: `npm run smoke` (ne ova suite)  

Vezano: [20-production-launch.md](20-production-launch.md)
