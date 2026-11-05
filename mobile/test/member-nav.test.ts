import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  activeMemberNavKey,
  buildMemberNavLinks,
  MEMBER_NAV_LABELS,
  memberBaseHref,
} from '../src/features/nav/memberNavConfig';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('memberBaseHref and labels match web member shell', () => {
  assert.equal(memberBaseHref('demo-fitness'), '/(member)/demo-fitness');
  assert.equal(memberBaseHref('/demo-fitness/'), '/(member)/demo-fitness');
  assert.deepEqual([...MEMBER_NAV_LABELS], [
    'Početna',
    'Termini',
    'Otkrij',
    'Privatnost',
    'Postavke',
  ]);
});

test('buildMemberNavLinks builds slug-scoped hrefs', () => {
  const links = buildMemberNavLinks('demo-fitness');
  assert.deepEqual(
    links.map((item) => item.href),
    [
      '/(member)/demo-fitness',
      '/(member)/demo-fitness/termini',
      '/(member)/demo-fitness/otkrij',
      '/(member)/demo-fitness/privatnost',
      '/(member)/demo-fitness/postavke',
    ],
  );
  assert.deepEqual(
    links.map((item) => item.label),
    [...MEMBER_NAV_LABELS],
  );
});

test('activeMemberNavKey resolves exclusive member routes', () => {
  const slug = 'demo-fitness';
  assert.equal(activeMemberNavKey(`/(member)/${slug}`, slug), 'home');
  assert.equal(activeMemberNavKey(`/(member)/${slug}/termini`, slug), 'slots');
  assert.equal(activeMemberNavKey(`/(member)/${slug}/otkrij`, slug), 'discover');
  assert.equal(activeMemberNavKey(`/(member)/${slug}/privatnost`, slug), 'privacy');
  assert.equal(activeMemberNavKey(`/(member)/${slug}/postavke`, slug), 'settings');
});

test('home matcher ignores termini/otkrij/privatnost/postavke', () => {
  const home = buildMemberNavLinks('yoga').find((item) => item.key === 'home');
  assert.ok(home);
  assert.equal(home.match('/(member)/yoga'), true);
  assert.equal(home.match('/(member)/yoga/termini'), false);
  assert.equal(home.match('/(member)/yoga/otkrij'), false);
  assert.equal(home.match('/(member)/yoga/postavke'), false);
});

test('MemberNav is a single top header with icons (no bottom tab bar)', () => {
  const tsx = readFileSync(join(root, 'src/components/MemberNav.tsx'), 'utf8');
  const layout = readFileSync(join(root, 'app/(member)/[slug]/_layout.tsx'), 'utf8');
  const styles = readFileSync(join(root, 'src/ui/memberNavStyles.ts'), 'utf8');

  assert.match(tsx, /buildMemberNavLinks/);
  assert.match(tsx, /accessibilityLabel="Član"/);
  assert.match(tsx, /accessibilityRole="header"/);
  assert.match(tsx, /MemberBottomNav[\s\S]*return null/);

  assert.match(layout, /<MemberNav/);
  assert.doesNotMatch(layout, /MemberBottomNav/);

  assert.match(styles, /justifyContent:\s*'space-between'/);
  assert.match(styles, /justifyContent:\s*'flex-end'/);
  assert.doesNotMatch(styles, /borderTopWidth/);
  assert.doesNotMatch(styles, /tabLabel/);
});
