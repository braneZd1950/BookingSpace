import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  categoryLabel,
  toPublicDiscoverCategory,
} from '../src/lib/discoverCategories.js';
import {
  allowsOnlineBookingFromDiscover,
  isDiscoverExcludedTenant,
  isListedOnDiscover,
} from '../src/lib/discoverVisibility.js';

describe('discoverVisibility', () => {
  it('lists only public and public_contact', () => {
    assert.equal(isListedOnDiscover('private'), false);
    assert.equal(isListedOnDiscover('public'), true);
    assert.equal(isListedOnDiscover('public_contact'), true);
    assert.equal(allowsOnlineBookingFromDiscover('public'), true);
    assert.equal(allowsOnlineBookingFromDiscover('public_contact'), false);
  });

  it('excludes demo and e2e tenants', () => {
    assert.equal(isDiscoverExcludedTenant({ slug: 'demo-fitness', name: 'Demo Fitness' }), true);
    assert.equal(isDiscoverExcludedTenant({ slug: 'demostudio', name: 'demoStudio' }), true);
    assert.equal(isDiscoverExcludedTenant({ slug: 'e2e-mem-studio-1', name: 'E2E Mem' }), true);
    assert.equal(isDiscoverExcludedTenant({ slug: 'aura-spa', name: 'Aura Spa' }), false);
  });
});

describe('discoverCategories', () => {
  it('maps niches into public buckets', () => {
    assert.equal(toPublicDiscoverCategory('playroom'), 'playroom');
    assert.equal(toPublicDiscoverCategory('services'), 'beauty');
    assert.equal(toPublicDiscoverCategory('wellness'), 'wellness');
    assert.equal(toPublicDiscoverCategory('fitness'), 'sport');
    assert.equal(toPublicDiscoverCategory('workshop'), 'workshop');
    assert.equal(categoryLabel('playroom'), 'Igraonice i rođendani');
  });
});
