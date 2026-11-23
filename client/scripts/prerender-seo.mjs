/**
 * Build-time SEO prerender for the Vite SPA.
 *
 * Writes route-specific HTML (meta + visible body) under client/dist so crawlers
 * and social previews get content without executing JavaScript. React still
 * mounts over #root for interactive users.
 *
 * Usage: node scripts/prerender-seo.mjs  (after vite build)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(__dirname, '..');
const distDir = path.join(clientRoot, 'dist');
const templatePath = path.join(distDir, 'index.html');

const defaultOrigin = 'https://bookingspaceapp.onrender.com';
if (!process.env.VITE_SITE_URL && !process.env.SITE_URL) {
  process.env.VITE_SITE_URL = defaultOrigin;
}

const seoModuleUrl = pathToFileURL(path.join(clientRoot, 'src/lib/seo.js')).href;
const {
  absoluteUrl,
  defaultOgImage,
  getPrerenderCatalog,
  siteOrigin,
} = await import(seoModuleUrl);

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function upsertMeta(html, attr, key, content) {
  const re = new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]*>`, 'i');
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

function upsertLink(html, rel, href, extra = '') {
  const re = new RegExp(`<link[^>]+rel=["']${rel}["'][^>]*>`, 'i');
  const tag = `<link rel="${rel}" href="${escapeHtml(href)}"${extra} />`;
  if (re.test(html) && rel !== 'alternate') return html.replace(re, tag);
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

function setTitle(html, title) {
  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  }
  return html.replace(/<\/head>/i, `    <title>${escapeHtml(title)}</title>\n  </head>`);
}

function injectJsonLd(html, data, id) {
  if (!data) return html;
  const payload = Array.isArray(data)
    ? {
      '@context': 'https://schema.org',
      '@graph': data.map((item) => {
        const { '@context': _c, ...rest } = item || {};
        return rest;
      }),
    }
    : data;
  const script = `<script type="application/ld+json" id="${id}">${JSON.stringify(payload)}</script>`;
  const re = new RegExp(`<script[^>]+id=["']${id}["'][^>]*>[\\s\\S]*?<\\/script>`, 'i');
  if (re.test(html)) return html.replace(re, script);
  return html.replace(/<\/head>/i, `    ${script}\n  </head>`);
}

function buildBody(page) {
  const bullets = (page.bullets || [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('');
  const links = (page.links || [])
    .map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`)
    .join('');

  return `
<main id="blizari-prerender" data-prerender="true">
  <header>
    <p><strong>Blizari</strong></p>
    <h1>${escapeHtml(page.h1 || page.title)}</h1>
    ${page.lead ? `<p>${escapeHtml(page.lead)}</p>` : ''}
  </header>
  ${bullets ? `<section aria-label="Što možete raditi"><h2>Što možete raditi danas</h2><ul>${bullets}</ul></section>` : ''}
  ${links ? `<nav aria-label="Poveznice"><ul>${links}</ul></nav>` : ''}
  <p><a href="/register">Isprobajte Blizari</a> · <a href="/kontakt">Kontakt</a></p>
</main>`.trim();
}

function applyPage(template, page) {
  const url = absoluteUrl(page.path);
  const image = defaultOgImage();
  let html = template;

  html = setTitle(html, page.title);
  html = upsertMeta(html, 'name', 'description', page.description);
  html = upsertMeta(html, 'name', 'robots', 'index,follow');
  html = upsertLink(html, 'canonical', url);

  html = upsertMeta(html, 'property', 'og:type', 'website');
  html = upsertMeta(html, 'property', 'og:site_name', 'Blizari');
  html = upsertMeta(html, 'property', 'og:locale', 'hr_HR');
  html = upsertMeta(html, 'property', 'og:title', page.title);
  html = upsertMeta(html, 'property', 'og:description', page.description);
  html = upsertMeta(html, 'property', 'og:url', url);
  html = upsertMeta(html, 'property', 'og:image', image);
  html = upsertMeta(html, 'property', 'og:image:alt', 'Blizari');

  html = upsertMeta(html, 'name', 'twitter:card', 'summary_large_image');
  html = upsertMeta(html, 'name', 'twitter:title', page.title);
  html = upsertMeta(html, 'name', 'twitter:description', page.description);
  html = upsertMeta(html, 'name', 'twitter:image', image);

  // hr + x-default prepare multi-language later without empty /en shells.
  html = html.replace(/<link[^>]+rel=["']alternate["'][^>]*>\s*/gi, '');
  html = upsertLink(html, 'alternate', url, ' hreflang="hr"');
  html = upsertLink(html, 'alternate', url, ' hreflang="x-default"');

  html = injectJsonLd(html, page.jsonLd, 'blizari-jsonld');

  // Prerendered body replaces the empty shell; drop noscript to avoid duplicate H1s.
  html = html.replace(/<noscript>[\s\S]*?<\/noscript>\s*/i, '');

  const body = buildBody(page);
  if (/<div id="root"><\/div>/i.test(html)) {
    html = html.replace(
      /<div id="root"><\/div>/i,
      `<div id="root">${body}</div>`,
    );
  } else if (/<div id="root">[\s\S]*?<\/div>/i.test(html)) {
    html = html.replace(
      /<div id="root">[\s\S]*?<\/div>/i,
      `<div id="root">${body}</div>`,
    );
  }

  return html;
}

function writePage(page, html) {
  if (page.path === '/') {
    fs.writeFileSync(templatePath, html, 'utf8');
    return templatePath;
  }
  const dir = path.join(distDir, page.path.replace(/^\//, ''));
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, 'index.html');
  fs.writeFileSync(out, html, 'utf8');
  return out;
}

function writeSitemap(pages) {
  const origin = siteOrigin();
  const urls = pages.map((page) => {
    const loc = page.path === '/' ? `${origin}/` : `${origin}${page.path}`;
    return `  <url><loc>${loc}</loc><changefreq>${page.changefreq || 'monthly'}</changefreq><priority>${page.priority || '0.5'}</priority></url>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  const out = path.join(distDir, 'sitemap.xml');
  fs.writeFileSync(out, xml, 'utf8');
  // Keep public/ in sync for local preview of source tree.
  fs.writeFileSync(path.join(clientRoot, 'public', 'sitemap.xml'), xml, 'utf8');
  return out;
}

function main() {
  if (!fs.existsSync(templatePath)) {
    console.error('[prerender-seo] Missing dist/index.html — run vite build first.');
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, 'utf8');
  const pages = getPrerenderCatalog();
  const written = [];

  for (const page of pages) {
    const html = applyPage(template, page);
    written.push(writePage(page, html));
  }

  const sitemap = writeSitemap(pages);
  console.log(`[prerender-seo] origin=${siteOrigin()}`);
  console.log(`[prerender-seo] pages=${written.length}`);
  console.log(`[prerender-seo] sitemap=${path.relative(clientRoot, sitemap)}`);
}

main();
