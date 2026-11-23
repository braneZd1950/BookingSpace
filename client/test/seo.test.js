import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  AUDIENCE_PAGES,
  FEATURE_PAGES,
  HOME_SEO,
  PRICING_SEO,
  absoluteUrl,
  breadcrumbJsonLd,
  defaultOgImage,
  getPrerenderCatalog,
  organizationJsonLd,
  siteOrigin,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from '../src/lib/seo.js';

test('siteOrigin prefers VITE_SITE_URL without trailing slash', () => {
  const prev = process.env.VITE_SITE_URL;
  process.env.VITE_SITE_URL = 'https://example.test/';
  assert.equal(siteOrigin(), 'https://example.test');
  if (prev === undefined) delete process.env.VITE_SITE_URL;
  else process.env.VITE_SITE_URL = prev;
});

test('absoluteUrl joins origin and path', () => {
  const prev = process.env.VITE_SITE_URL;
  process.env.VITE_SITE_URL = 'https://blizari.test';
  assert.equal(absoluteUrl('/'), 'https://blizari.test/');
  assert.equal(absoluteUrl('/cijene'), 'https://blizari.test/cijene');
  assert.equal(absoluteUrl('cijene'), 'https://blizari.test/cijene');
  assert.equal(defaultOgImage(), 'https://blizari.test/icons/icon-512.png');
  if (prev === undefined) delete process.env.VITE_SITE_URL;
  else process.env.VITE_SITE_URL = prev;
});

test('audience and feature catalogs keep stable public paths', () => {
  assert.equal(AUDIENCE_PAGES.fitness.path, '/za-koga-je-blizari/fitness');
  assert.equal(FEATURE_PAGES['online-rezervacije'].path, '/funkcionalnosti/online-rezervacije');
  assert.ok(AUDIENCE_PAGES.fitness.bullets.length >= 4);
  assert.ok(FEATURE_PAGES['clanarine-i-paketi'].h1);
});

test('json-ld helpers expose brand and breadcrumbs', () => {
  const org = organizationJsonLd();
  assert.equal(org['@type'], 'Organization');
  assert.equal(org.name, 'Blizari');
  assert.equal(websiteJsonLd().inLanguage, 'hr');
  assert.equal(softwareApplicationJsonLd().offers.price, '0');
  const crumbs = breadcrumbJsonLd([
    { name: 'Početna', path: '/' },
    { name: 'Cijene', path: PRICING_SEO.path },
  ]);
  assert.equal(crumbs.itemListElement.length, 2);
  assert.equal(crumbs.itemListElement[1].position, 2);
});

test('prerender catalog includes home, pricing and landing routes', () => {
  const catalog = getPrerenderCatalog();
  const paths = catalog.map((page) => page.path);
  assert.ok(paths.includes(HOME_SEO.path));
  assert.ok(paths.includes(PRICING_SEO.path));
  assert.ok(paths.includes('/za-koga-je-blizari/fitness'));
  assert.ok(paths.includes('/funkcionalnosti/online-rezervacije'));
  assert.ok(paths.includes('/privatnost'));
  for (const page of catalog) {
    assert.ok(page.title);
    assert.ok(page.h1);
  }
});
