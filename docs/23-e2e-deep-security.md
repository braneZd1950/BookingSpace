# Dubinski E2E + security (web + mobile)

## Web (Playwright)

```bash
npm run test:e2e
# samo deep + security:
npm run test:e2e:deep
```

Novi spekovi:

- `client/e2e/studio-deep-flow.spec.js` — owner nav + članovi + XSS non-execution
- `client/e2e/member-deep-flow.spec.js` — member termini/postavke + booking gate
- `client/e2e/security-boundaries.spec.js` — authz / IDOR / logout / login input
- `client/e2e/helpers/liveApi.js` — seed helper

## API security matrix

```bash
npm run test:security
```

Uključuje `server/test/security-matrix.test.js` (cross-tenant, oversized body, path id).

## Mobile (Maestro)

Vidi `mobile/docs/e2e-maestro.md`.

```bash
npm run test:mobile:e2e
```

Zahtijeva instaliran Maestro CLI + APK na uređaju/emulatoru.

## Napomena

Ovo su **defenzivne** provjere (authz, validacija, non-execution). Nisu offensive exploit PoC-ovi niti jamstvo “0 ranjivosti”.
