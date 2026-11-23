import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { absoluteUrl, defaultOgImage } from '../lib/seo.js';

function upsertMeta(attr, key, content) {
  if (content == null || content === '') return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href, attrs = {}) {
  if (!href) return;
  const extra = Object.entries(attrs)
    .map(([k, v]) => `[${k}="${v}"]`)
    .join('');
  let el = document.head.querySelector(`link[rel="${rel}"]${extra}`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(id, data) {
  const existing = document.getElementById(id);
  if (!data) {
    existing?.remove();
    return;
  }
  const json = JSON.stringify(data);
  if (existing) {
    existing.textContent = json;
    return;
  }
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = json;
  document.head.appendChild(script);
}

/**
 * Sets document title + meta for the current public route.
 * Complements build-time prerender HTML (scripts/prerender-seo.mjs).
 */
export default function SeoHead({
  title,
  description,
  path = '/',
  noindex = false,
  ogType = 'website',
  image,
  jsonLd,
  jsonLdId = 'blizari-jsonld',
}) {
  useEffect(() => {
    const fullTitle = title;
    const url = absoluteUrl(path);
    const ogImage = image || defaultOgImage();
    document.title = fullTitle;

    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow');

    if (noindex) {
      document.head.querySelector('link[rel="canonical"]')?.remove();
    } else {
      upsertLink('canonical', url);
      upsertLink('alternate', url, { hreflang: 'hr' });
      upsertLink('alternate', url, { hreflang: 'x-default' });
    }

    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:site_name', 'Blizari');
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:locale', 'hr_HR');
    upsertMeta('property', 'og:image', ogImage);
    upsertMeta('property', 'og:image:alt', 'Blizari');

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', ogImage);

    if (Array.isArray(jsonLd)) {
      upsertJsonLd(jsonLdId, {
        '@context': 'https://schema.org',
        '@graph': jsonLd.map((item) => {
          const { '@context': _ctx, ...rest } = item || {};
          return rest;
        }),
      });
    } else {
      upsertJsonLd(jsonLdId, jsonLd);
    }

    document.dispatchEvent(new Event('blizari-seo-ready'));
  }, [title, description, path, noindex, ogType, image, jsonLd, jsonLdId]);

  return null;
}

export function SeoNoIndex({ title = 'Blizari' }) {
  const location = useLocation();
  return (
    <SeoHead
      title={title}
      description="Privatni dio Blizari aplikacije — nije namijenjen indeksiranju."
      path={location.pathname || '/'}
      noindex
    />
  );
}
