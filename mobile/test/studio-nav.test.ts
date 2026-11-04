import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  activeStudioNavKey,
  STUDIO_NAV_LINKS,
  STUDIO_NAV_PILOT_LABELS,
} from '../src/features/nav/studioNavConfig';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('studio nav pilot labels match web owner shell', () => {
  assert.deepEqual(
    STUDIO_NAV_LINKS.map((item) => item.label),
    [...STUDIO_NAV_PILOT_LABELS],
  );
});

test('studio nav hrefs stay under /(app)', () => {
  for (const link of STUDIO_NAV_LINKS) {
    assert.ok(link.href === '/(app)' || link.href.startsWith('/(app)/'), link.href);
  }
});

test('activeStudioNavKey resolves exclusive routes', () => {
  assert.equal(activeStudioNavKey('/'), 'home');
  assert.equal(activeStudioNavKey('/(app)'), 'home');
  assert.equal(activeStudioNavKey('/(app)/termini'), 'slots');
  assert.equal(activeStudioNavKey('/(app)/studio'), 'slots');
  assert.equal(activeStudioNavKey('/(app)/kalendar'), 'calendar');
  assert.equal(activeStudioNavKey('/(app)/clanovi'), 'members');
  assert.equal(activeStudioNavKey('/(app)/member/abc'), 'members');
  assert.equal(activeStudioNavKey('/(app)/analitika'), 'analytics');
  assert.equal(activeStudioNavKey('/(app)/postavke'), 'settings');
});

test('home matcher does not steal nested destinations', () => {
  const home = STUDIO_NAV_LINKS.find((item) => item.key === 'home');
  assert.ok(home);
  assert.equal(home.match('/(app)/termini'), false);
  assert.equal(home.match('/(app)/postavke'), false);
  assert.equal(home.match('/(app)'), true);
});

test('StudioNav uses shared config and header chrome (no bottom bar)', () => {
  const tsx = readFileSync(join(root, 'src/components/StudioNav.tsx'), 'utf8');
  const styles = readFileSync(join(root, 'src/ui/navStyles.ts'), 'utf8');

  assert.match(tsx, /STUDIO_NAV_LINKS/);
  assert.match(tsx, /accessibilityLabel="Studio"/);
  assert.match(tsx, /accessibilityRole="header"/);
  assert.doesNotMatch(tsx, /bottom/);

  assert.match(styles, /justifyContent:\s*'space-between'/);
  assert.match(styles, /justifyContent:\s*'flex-end'/);
  assert.match(styles, /width:\s*32/);
  assert.doesNotMatch(styles, /position:\s*'absolute'/);
});
