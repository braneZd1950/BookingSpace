import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  filterStudioNavLinks,
  isStudioHomePath,
  matchStudioNavPath,
  STUDIO_NAV_ALL,
  STUDIO_NAV_PILOT_KEYS,
  studioNavPilotLabels,
} from '../src/lib/studioNavConfig.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('studio nav includes every pilot key when flags are off', () => {
  const links = filterStudioNavLinks(STUDIO_NAV_ALL, {
    gallery: false,
    online: false,
    payments: false,
    plan: false,
  });
  assert.deepEqual(
    links.map((item) => item.key),
    STUDIO_NAV_PILOT_KEYS,
  );
  assert.deepEqual(studioNavPilotLabels(STUDIO_NAV_ALL, {
    gallery: false,
    online: false,
    payments: false,
    plan: false,
  }), [
    'Početna',
    'Termini',
    'Kalendar',
    'Članovi',
    'Analitika',
    'Postavke',
  ]);
});

test('studio nav feature flags unlock optional destinations', () => {
  const links = filterStudioNavLinks(STUDIO_NAV_ALL, {
    gallery: true,
    online: true,
    payments: true,
    plan: true,
  });
  assert.ok(links.some((item) => item.key === 'gallery'));
  assert.ok(links.some((item) => item.key === 'online'));
  assert.ok(links.some((item) => item.key === 'payments'));
  assert.ok(links.some((item) => item.key === 'plan'));
  assert.equal(links.length, STUDIO_NAV_ALL.length);
});

test('studio nav routes stay under /stranica', () => {
  for (const item of STUDIO_NAV_ALL) {
    assert.ok(item.to.startsWith('/stranica'), item.to);
  }
});

test('matchStudioNavPath treats home as exact and nested routes as prefixes', () => {
  assert.equal(matchStudioNavPath('/stranica', '/stranica', { end: true }), true);
  assert.equal(matchStudioNavPath('/stranica/', '/stranica', { end: true }), true);
  assert.equal(matchStudioNavPath('/stranica/termini', '/stranica', { end: true }), false);

  assert.equal(matchStudioNavPath('/stranica/termini', '/stranica/termini'), true);
  assert.equal(matchStudioNavPath('/stranica/termini/edit', '/stranica/termini'), true);
  assert.equal(matchStudioNavPath('/stranica/kalendar', '/stranica/termini'), false);
});

test('isStudioHomePath ignores trailing slash only', () => {
  assert.equal(isStudioHomePath('/stranica'), true);
  assert.equal(isStudioHomePath('/stranica/'), true);
  assert.equal(isStudioHomePath('/stranica/postavke'), false);
});

test('StudioLayout wires config + topbar chrome (brand left, tabs right)', () => {
  const jsx = readFileSync(join(root, 'src/pages/owner/StudioLayout.jsx'), 'utf8');
  const scss = readFileSync(join(root, 'src/pages/owner/StudioLayout.scss'), 'utf8');

  assert.match(jsx, /filterStudioNavLinks/);
  assert.match(jsx, /STUDIO_NAV_ALL/);
  assert.match(jsx, /className="studio-topbar"/);
  assert.match(jsx, /className="studio-nav__brand"/);
  assert.match(jsx, /className="studio-nav__tabs"/);
  assert.match(jsx, /aria-label="Studio"/);
  assert.doesNotMatch(jsx, /position:\s*fixed/);

  assert.match(scss, /\.studio-topbar\s*\{[^}]*justify-content:\s*space-between/s);
  assert.match(scss, /\.studio-nav__brand\s*\{[^}]*text-align:\s*left/s);
  assert.match(scss, /\.studio-nav__tabs\s*\{[^}]*justify-content:\s*flex-end/s);
  assert.doesNotMatch(scss, /inset:\s*auto 0 0 0/);
  assert.doesNotMatch(scss, /position:\s*fixed/);
});

test('studio mobile chrome keeps icons in header and disables tooltips', () => {
  const scss = readFileSync(join(root, 'src/pages/owner/StudioLayout.scss'), 'utf8');
  assert.match(scss, /@media \(max-width: 52rem\)/);
  assert.match(scss, /content: none !important/);
  assert.match(scss, /@media \(max-width: 28rem\)/);
  assert.match(scss, /flex-wrap:\s*wrap/);
});
