# Kako pregledati mobilni UI na računalu

Indeks: [README.md](README.md)

Landing i ostali ekrani rade u **Expo** projektu (`mobile/`). Na PC-u najbrže je **web preview** u pregledniku (simulira mobitel).

---

## Opcija A — preporučeno: Expo Web (Chrome / Edge)

1. Pokreni API (opcionalno za sam landing — landing ne zove API):

```bash
# iz root-a repoa
npm run dev
```

2. U drugom terminalu:

```bash
cd mobile
npm run web
```

ili:

```bash
cd mobile
npx expo start --web
```

3. Otvori URL koji Expo ispiše (obično `http://localhost:8081`).  
4. U DevToolsu uključi **device toolbar** (Ctrl+Shift+M) → iPhone / Pixel širina.

### Ako traži instalaciju weba

```bash
cd mobile
npx expo install react-dom react-native-web
npm run web
```

---

## Opcija B — Expo DevTools + emulator

```bash
cd mobile
npm start
```

- **a** → Android emulator (ako imaš Android Studio)  
- **w** → web  
- QR → Expo Go na telefonu (ista Wi‑Fi mreža)

---

## Opcija C — samo landing, bez API-ja

Landing trenutno **ne treba** backend. Dovoljno:

```bash
cd mobile
npm run web
```

---

## Tipični problemi

| Simptom | Rješenje |
| --- | --- |
| Port zauzet | `npx expo start --web --port 8082` |
| Prazan ekran / fontovi | Pričekaj download fontova; hard refresh |
| `localhost` na telefonu | Za API kasnije koristi LAN IP u `EXPO_PUBLIC_API_URL` |
| Stari bundle | U terminalu Expo: pritisni `r` (reload) ili `shift+r` (clear cache) |

---

## Što trebaš vidjeti (landing)

- Tamna “night studio” pozadina (ne web kalendar-hero)  
- Veliki brand **anyminutes**  
- Naslov: „Vaš termin. U džepu.”  
- Gumbi **Prijava** i **Samo pogledaj**  
- Kratka animacija ulaska (brand → crta → tekst → gumbi)  

---

## Sljedeći korak u planu

Nakon pregleda landinga → M1 login ekran (`docs/lean/faza-m1-auth-shell.md`).
