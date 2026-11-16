# Mobile E2E (Maestro)

Dubinski UI tokovi za Android APK `hr.anyminutes.app`.

## Preduvjeti

1. Instaliran [Maestro CLI](https://maestro.mobile.dev/getting-started/installing-maestro)
2. Emulator ili uređaj s instaliranim preview / e2e APK-om
3. App package: `hr.anyminutes.app`

## Build za E2E

```bash
cd mobile
npx eas-cli build -p android --profile e2e-test
# ili preview profile koji već koristite
```

Instaliraj APK na emulator/uređaj.

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

## Flowovi

| Datoteka | Što pokriva |
|----------|-------------|
| `01-landing.yaml` | Brand, CTA |
| `02-login-validation.yaml` | Validacija prijave |
| `03-discover-faq.yaml` | Otkrij / FAQ / O nama |
| `04-register-chooser.yaml` | Izbor klijent/partner |

Authenticated booking/članovi tokovi zahtijevaju seed korisnika na API-ju — dodaju se kad postoji stabilan test account.

## EAS Workflow (opcionalno)

Vidi Expo docs: Maestro job nakon `e2e-test` builda (`.eas/workflows/`).
