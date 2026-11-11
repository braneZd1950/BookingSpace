# Odluke (mobile)

Indeks: [README.md](README.md) · Web ADR: [../../docs/13-decisions.md](../../docs/13-decisions.md)

---

| # | Odluka | Zašto |
| --- | --- | --- |
| M1 | React Native + **Expo** | Brži start; isti React mindset kao web |
| M2 | Isti REST API / ista baza | Nema drugog backenda |
| M3 | JWT u **SecureStore** | Sigurnije od plain storage |
| M4 | Prvo **član self-book**, pa vlasnik | Najveća vrijednost na telefonu |
| M5 | Bez platform admina u ranim fazama | `/analitika` ostaje web |
| M6 | Bez novog booking enginea | Server već ima kapacitet i članarine |
| M7 | Hrvatski UI | Isto kao web |
| M8 | Native push tek u M4 (+ eventualni API gap) | Web VAPID nije dovoljan za store push |
| M9 | Store (EAS) tek u M5 | Najprije dokazati petlju u Expo Go |
| M10 | Monorepo folder `mobile/` | Jedan repo, zajednički docs/CI kasnije |

Ako se odluka mijenja — dopuni ovu tablicu i [07-status.md](07-status.md).
