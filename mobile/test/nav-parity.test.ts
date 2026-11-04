import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { MEMBER_NAV_LABELS } from '../src/features/nav/memberNavConfig';
import {
  STUDIO_NAV_LINKS,
  STUDIO_NAV_PILOT_LABELS,
} from '../src/features/nav/studioNavConfig';

const repo = join(dirname(fileURLToPath(import.meta.url)), '../..');

function read(rel: string) {
  return readFileSync(join(repo, rel), 'utf8');
}

test('web and mobile owner pilot labels stay identical', () => {
  const web = read('client/src/lib/studioNavConfig.js');
  for (const label of STUDIO_NAV_PILOT_LABELS) {
    assert.match(web, new RegExp(`label: '${label}'`));
  }
  assert.deepEqual(
    STUDIO_NAV_LINKS.map((item) => item.label),
    [...STUDIO_NAV_PILOT_LABELS],
  );
});

test('web and mobile member core labels stay identical', () => {
  const web = read('client/src/lib/memberNavConfig.js');
  for (const label of MEMBER_NAV_LABELS) {
    assert.match(web, new RegExp(`label: '${label}'`));
  }
});

test('mobile chrome styles mirror web header geometry', () => {
  const studioStyles = read('mobile/src/ui/navStyles.ts');
  const memberStyles = read('mobile/src/ui/memberNavStyles.ts');
  const webStudio = read('client/src/pages/owner/StudioLayout.scss');
  const webMember = read('client/src/pages/member/MemberLayout.scss');

  for (const src of [studioStyles, memberStyles]) {
    assert.match(src, /flexDirection:\s*'row'/);
    assert.match(src, /justifyContent:\s*'space-between'/);
    assert.match(src, /width:\s*32/);
    assert.match(src, /borderRadius:\s*999/);
  }

  assert.match(webStudio, /justify-content:\s*space-between/);
  assert.match(webMember, /justify-content:\s*space-between/);
  assert.match(webMember, /member-nav__label/);
  assert.doesNotMatch(webStudio, /inset:\s*auto 0 0 0/);
});

test('mobile icon set exports studio + member glyphs used by headers', () => {
  const icons = read('mobile/src/components/StudioNavIcons.tsx');
  for (const name of [
    'IconHome',
    'IconSlots',
    'IconCalendar',
    'IconPeople',
    'IconChart',
    'IconGear',
    'IconPower',
    'IconDiscover',
    'IconPrivacy',
  ]) {
    assert.match(icons, new RegExp(`export function ${name}`));
  }
  assert.match(icons, /width=\{16\}/);
});
