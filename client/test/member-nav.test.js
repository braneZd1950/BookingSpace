import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  buildMemberNavLinks,
  isMemberHomePath,
  matchMemberNavPath,
  memberBasePath,
  memberNavHref,
  MEMBER_NAV_CORE,
} from '../src/lib/memberNavConfig.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('memberBasePath and memberNavHref normalize slug segments', () => {
  assert.equal(memberBasePath('demo-fitness'), '/s/demo-fitness');
  assert.equal(memberBasePath('/demo-fitness/'), '/s/demo-fitness');
  assert.equal(memberNavHref('demo-fitness'), '/s/demo-fitness');
  assert.equal(memberNavHref('demo-fitness', 'termini'), '/s/demo-fitness/termini');
  assert.equal(memberNavHref('demo-fitness', '/otkrij/'), '/s/demo-fitness/otkrij');
});

test('buildMemberNavLinks hides Otkrij for guests and Online when flag is off', () => {
  const guest = buildMemberNavLinks('demo-fitness', {
    loggedIn: false,
    onlineEnabled: false,
  });
  assert.deepEqual(guest.map((item) => item.key), ['home', 'slots', 'privacy']);
  assert.equal(guest.find((item) => item.key === 'home')?.end, true);
});

test('buildMemberNavLinks includes Otkrij when logged in', () => {
  const links = buildMemberNavLinks('demo-fitness', {
    loggedIn: true,
    onlineEnabled: false,
  });
  assert.deepEqual(
    links.map((item) => item.label),
    ['Početna', 'Termini', 'Otkrij', 'Privatnost'],
  );
  assert.deepEqual(
    links.map((item) => item.to),
    [
      '/s/demo-fitness',
      '/s/demo-fitness/termini',
      '/s/demo-fitness/otkrij',
      '/s/demo-fitness/privatnost',
    ],
  );
});

test('buildMemberNavLinks includes Online when flag is on', () => {
  const links = buildMemberNavLinks('yoga', {
    loggedIn: true,
    onlineEnabled: true,
  });
  assert.ok(links.some((item) => item.key === 'online' && item.to === '/s/yoga/online'));
});

test('matchMemberNavPath distinguishes home from nested member routes', () => {
  const base = '/s/demo-fitness';
  assert.equal(matchMemberNavPath(base, base, { end: true }), true);
  assert.equal(matchMemberNavPath(`${base}/`, base, { end: true }), true);
  assert.equal(matchMemberNavPath(`${base}/termini`, base, { end: true }), false);
  assert.equal(matchMemberNavPath(`${base}/termini`, `${base}/termini`), true);
  assert.equal(isMemberHomePath(`${base}/`, 'demo-fitness'), true);
  assert.equal(isMemberHomePath(`${base}/otkrij`, 'demo-fitness'), false);
});

test('MEMBER_NAV_CORE labels stay stable for mobile parity', () => {
  assert.deepEqual(
    MEMBER_NAV_CORE.map((item) => item.label),
    ['Početna', 'Termini', 'Otkrij', 'Privatnost'],
  );
});

test('MemberLayout uses config and icon+label chrome for small screens', () => {
  const jsx = readFileSync(join(root, 'src/pages/member/MemberLayout.jsx'), 'utf8');
  const scss = readFileSync(join(root, 'src/pages/member/MemberLayout.scss'), 'utf8');

  assert.match(jsx, /buildMemberNavLinks/);
  assert.match(jsx, /memberBasePath/);
  assert.match(jsx, /className="member-nav__tabs"/);
  assert.match(jsx, /member-nav__label/);
  assert.match(jsx, /aria-label="Član"/);

  assert.match(scss, /\.member-nav\s*\{[^}]*justify-content:\s*space-between/s);
  assert.match(scss, /@media \(max-width: 52rem\)/);
  assert.match(scss, /\.member-nav__item svg\s*\{[^}]*display:\s*block/s);
  assert.match(scss, /\.member-nav__label\s*\{[^}]*clip:\s*rect\(0, 0, 0, 0\)/s);
  assert.match(scss, /overflow-x:\s*hidden/);
});
