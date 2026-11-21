# Mobile E2E (Maestro)

Dubinski UI tokovi za Android APK `hr.anyminutes.app` (brand **Blizari**).

Dio kompletne test matrice: [../../docs/23-e2e-deep-security.md](../../docs/23-e2e-deep-security.md)

---

## Preduvjeti

1. Instaliran [Maestro CLI](https://maestro.mobile.dev/getting-started/installing-maestro)  
2. Emulator ili uređaj s instaliranim preview / e2e APK-om **i radnom mrežom**  
3. App package: `hr.anyminutes.app`  
4. Ako app visi na crnom splashu (`expo-updates` / offline) — popravi mrežu ili koristi build bez blokirajućeg updatea  

---

## Build za E2E / demo

```bash
cd mobile
npx eas-cli build -p android --profile preview
# ili e2e-test profil ako postoji
```

Instaliraj APK na emulator/uređaj (`adb install …`).

---

## Pokretanje

```bash
cd mobile
maestro test .maestro
# ili jedan flow:
maestro test .maestro/01-landing.yaml
```

Root skripta:

```bash
npm run test:mobile:e2e
```

Uz unit + load:

```bash
npm run test:mobile:all
```

---

## Flowovi

| Datoteka | Što pokriva |
|----------|-------------|
| `01-landing.yaml` | Brand, CTA |
| `02-login-validation.yaml` | Validacija prijave |
| `03-discover-faq.yaml` | Otkrij / FAQ / O nama (landing `clearState` između koraka) |
| `04-register-chooser.yaml` | Izbor klijent/partner |

Authenticated booking/članovi tokovi zahtijevaju seed korisnika na API-ju — dodaju se kad postoji stabilan test account.

**Van dema:** blagajna / payments UI flowovi (nema UI).

---

## EAS Workflow (opcionalno)

Vidi Expo docs: Maestro job nakon `e2e-test` builda (`.eas/workflows/`).
