import { BRAND } from './brand.js';
import { contactEmail } from './contact.js';

function readViteEnv(key) {
  try {
    const env = import.meta.env;
    if (env && env[key]) return String(env[key]);
  } catch {
    // Node prerender script — no Vite env object.
  }
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return String(process.env[key]);
  }
  return '';
}

/** Canonical public origin (Render / custom domain). */
export function siteOrigin() {
  const fromEnv = String(
    readViteEnv('VITE_SITE_URL')
      || readViteEnv('VITE_APP_ORIGIN')
      || (typeof process !== 'undefined' ? process.env?.SITE_URL || '' : ''),
  ).trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://bookingspaceapp.onrender.com';
}

export function absoluteUrl(path = '/') {
  const origin = siteOrigin();
  if (!path || path === '/') return `${origin}/`;
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

export function defaultOgImage() {
  return absoluteUrl('/icons/icon-512.png');
}

/** @deprecated Prefer defaultOgImage() so origin stays current. */
export const DEFAULT_OG_IMAGE = defaultOgImage();

export const HOME_SEO = {
  title: 'Blizari – Online rezervacije i upravljanje poslovanjem',
  description:
    'Upravljajte terminima, rezervacijama, klijentima, članovima i uslugama na jednom mjestu. Blizari pojednostavljuje svakodnevno poslovanje.',
  path: '/',
};

/** Build a marketing landing entry without copy-pasted object shapes (Sonar duplication). */
function landingPage(basePath, slug, { title, description, h1, lead, bullets, cta }) {
  return {
    path: `${basePath}/${slug}`,
    title,
    description,
    h1,
    lead,
    bullets,
    ...(cta ? { cta } : {}),
  };
}

const AUDIENCE_BASE = '/za-koga-je-blizari';

/** Audience landings — unique copy, only shipped capabilities. */
export const AUDIENCE_PAGES = {
  fitness: landingPage(AUDIENCE_BASE, 'fitness', {
    title: 'Program za fitness studije i online rezervacije | Blizari',
    description:
      'Upravljajte grupnim treninzima, kapacitetima, članovima i članarinama. Omogućite online rezervacije putem vlastite stranice studija.',
    h1: 'Jednostavnije upravljanje fitness studijem',
    lead:
      'Blizari pomaže fitness i sportskim studijima organizirati termine, članove i rezervacije — bez WhatsApp zbrke i bez dijeljenja klijenata s konkurencijom.',
    bullets: [
      'Raspored grupnih i individualnih treninga uz kapacitet termina',
      'Evidencija članova i status članarine',
      'Paketi / članarine koje vlasnik dodaje i obnavlja',
      'Online rezervacija i otkaz putem vaše stranice /s/…',
      'Kalendar zauzeća bez izlaganja osobnih podataka članova',
      'Pregled aktivnosti u studijskom prostoru',
    ],
    cta: 'Organizirajte svoj fitness studio uz Blizari',
  }),
  'pilates-yoga': landingPage(AUDIENCE_BASE, 'pilates-yoga', {
    title: 'Program za Pilates i yoga studije | Blizari',
    description:
      'Organizirajte satove, kapacitete i članove. Klijenti rezerviraju online na vašoj stranici — vi zadržavate odnos s njima.',
    h1: 'Mirniji raspored za Pilates i yoga studio',
    lead:
      'Manje poruka oko slobodnih mjesta, jasniji raspored satova i članarine na jednom mjestu — prilagođeno studijima koji rade s terminima i grupama.',
    bullets: [
      'Termini i kapaciteti za manje i veće grupe',
      'Članovi i paketi koje vodite vi',
      'Self-book i otkaz unutar pravila studija',
      'Vlastita javna stranica studija (slug)',
      'Staff / treneri kad trebate više osoba u rasporedu',
    ],
    cta: 'Podesite studio u Blizariju',
  }),
  'kozmeticki-saloni': landingPage(AUDIENCE_BASE, 'kozmeticki-saloni', {
    title: 'Program za kozmetičke i frizerske salone | Blizari',
    description:
      'Upravljajte terminima, uslugama i klijentima. Omogućite online rezervacije na vlastitoj stranici salona.',
    h1: 'Termin i klijent — bez beskrajnog dogovaranja',
    lead:
      'Saloni koji rade po terminima mogu klijentima dati jasnu dostupnost, a sebi pregledan kalendar i evidenciju — bez online naplate u appu (pilot).',
    bullets: [
      'Usluge i trajanje termina koje sami definirate',
      'Rezervacije i otkazi u jednom kalendaru',
      'Računi klijenata / članova uz status',
      'Vlastita poveznica za dijeljenje (WhatsApp, Instagram)',
      'Bez indeksiranja tuđih klijenata — privatnost tenanta',
    ],
    cta: 'Pokrenite stranicu salona',
  }),
  igraonice: landingPage(AUDIENCE_BASE, 'igraonice', {
    title: 'Sustav za dječje igraonice i rođendaonice | Blizari',
    description:
      'Organizirajte rezervacije prostora i termina. Roditelji rezerviraju online, vi vidite raspored na jednom mjestu.',
    h1: 'Raspored igraonice bez telefonskog kaosa',
    lead:
      'Za igraonice i proslave: jasniji termini, kapaciteti i kontakt s klijentima preko vaše stranice — ne preko javnog kataloga konkurenata.',
    bullets: [
      'Rezervacije termina / prostora s kapacitetom',
      'Pregled dana u kalendaru',
      'Evidencija klijenata koje vi vodite',
      'Dijeljenje vlastitog linka roditeljima',
      'Pilot: naplata i dalje na način koji već koristite',
    ],
    cta: 'Organizirajte rezervacije uz Blizari',
  }),
  wellness: landingPage(AUDIENCE_BASE, 'wellness', {
    title: 'Rezervacije za wellness centre | Blizari',
    description:
      'Upravljajte terminima, uslugama i klijentima u wellnessu. Online rezervacije na vašoj stranici, bez gubitka kontrole nad klijentima.',
    h1: 'Wellness termini pod kontrolom',
    lead:
      'Masaže, tretmani i individualni termini — klijenti biraju dostupnost, vi pratite raspored i članarine bez dijeljenja podataka s drugim poslovanjima.',
    bullets: [
      'Usluge i dostupni slotovi',
      'Online rezervacija i otkaz',
      'Članovi / paketi kad radite s pretplatama',
      'Vlastita stranica centra',
      'Analitika osnovnih aktivnosti studija',
    ],
    cta: 'Isprobajte Blizari za wellness',
  }),
};

export const AUDIENCE_HUB = {
  path: '/za-koga-je-blizari',
  title: 'Za koga je Blizari — djelatnosti i uslužna poslovanja',
  description:
    'Blizari je namijenjen fitnessu, pilatesu, salonima, igraonicama, wellnessu i drugim poslovanjima koja rade s terminima, članovima i rezervacijama.',
  h1: 'Za koga je Blizari',
  lead:
    'Ako radite s rasporedom, klijentima i rezervacijama, Blizari vam daje vlastitu stranicu i alate za organizaciju — bez preusmjeravanja klijenata konkurenciji.',
};

const FEATURE_BASE = '/funkcionalnosti';

export const FEATURE_PAGES = {
  'online-rezervacije': landingPage(FEATURE_BASE, 'online-rezervacije', {
    title: 'Online rezervacije termina | Blizari',
    description:
      'Omogućite klijentima online rezervacije i otkaz na vašoj stranici. Vi upravljate kapacitetom i pravilima otkaza.',
    h1: 'Online rezervacije bez beskrajnih poruka',
    lead:
      'Klijenti vide dostupnost i rezerviraju sami. Vi u studijskom prostoru pratite i po potrebi otkazujete termine.',
    bullets: [
      'Self-book uz aktivnu članarinu (pravila studija)',
      'Kapacitet termina i status dostupnosti',
      'Otkaz unutar prozora koji postavite',
      'Obavijesti e-poštom (kad je SMTP podešen)',
    ],
  }),
  'upravljanje-clanovima': landingPage(FEATURE_BASE, 'upravljanje-clanovima', {
    title: 'Upravljanje članovima i klijentima | Blizari',
    description:
      'Dodajte članove, pratite status i obnovu paketa. Evidencija klijenata ostaje unutar vašeg studija.',
    h1: 'Članovi i klijenti na jednom mjestu',
    lead:
      'Vlasnik dodaje i obnavlja članarine, suspendira kad treba — bez izlaganja podataka drugim tenantima.',
    bullets: [
      'Lista članova u studiju',
      'Dodaj / obnovi / suspend',
      'Pozivnice i privremene lozinke e-poštom',
      'Odvojeni prostori po studiju (tenant izolacija)',
    ],
  }),
  'usluge-i-termini': landingPage(FEATURE_BASE, 'usluge-i-termini', {
    title: 'Upravljanje uslugama i terminima | Blizari',
    description:
      'Definirajte usluge, trajanje i kapacitete. Vodite dnevni raspored i kalendar rezervacija.',
    h1: 'Usluge, sati i kapaciteti',
    lead:
      'Postavite što nudite i kada ste dostupni. Sustav drži kapacitet termina pod kontrolom.',
    bullets: [
      'Usluge studija',
      'Radno vrijeme i dostupni slotovi',
      'Kalendar i termini vlasnika',
      'Opcionalni trener / staff na rezervaciji',
    ],
  }),
  'clanarine-i-paketi': landingPage(FEATURE_BASE, 'clanarine-i-paketi', {
    title: 'Članarine i paketi | Blizari',
    description:
      'Vodite pakete i preostale termine. Blagajna i kartična naplata u appu nisu dio trenutačnog pilota.',
    h1: 'Članarine i paketi koje vi kontrolirate',
    lead:
      'U pilotu članarine vodite kroz dodaj / obnovi u aplikaciji. Fizička naplata ostaje na vašoj blagajni dok ne uvedemo blagajnu UI.',
    bullets: [
      'Planovi i članarine u studiju',
      'Preostali termini utječu na rezervacije',
      'Bez Stripe / online kartica u ovom demu',
      'Jasna komunikacija statusa članu',
    ],
  }),
};

export const FEATURES_HUB = {
  path: '/funkcionalnosti',
  title: 'Funkcionalnosti Blizaria — rezervacije, članovi, termini',
  description:
    'Pregled onoga što Blizari nudi danas: online rezervacije, članovi, usluge, članarine i vlastita poslovna stranica.',
  h1: 'Funkcionalnosti Blizaria',
  lead:
    'Samo ono što je dostupno u pilotu — bez obećanja koja još nisu u proizvodu.',
};

export const PRICING_SEO = {
  path: '/cijene',
  title: 'Cijene Blizaria — pilot besplatno',
  description:
    'Tijekom zatvorenog pilota korištenje Blizaria je besplatno. O budućim cijenama korisnici će biti pravovremeno obaviješteni.',
  h1: 'Cijene',
};

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND.name,
    url: siteOrigin(),
    email: contactEmail,
    slogan: BRAND.sloganHr,
    logo: absoluteUrl('/icons/icon-512.png'),
  };
}

export function softwareApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: BRAND.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, Android (preview)',
    url: siteOrigin(),
    description: HOME_SEO.description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      description: 'Besplatno tijekom zatvorenog pilota',
    },
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND.name,
    url: siteOrigin(),
    inLanguage: 'hr',
  };
}

export function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/**
 * Public marketing pages to prerender as static HTML (crawlable without JS).
 * Keep copy aligned with live React pages — only shipped capabilities.
 */
export function getPrerenderCatalog() {
  const audienceLinks = Object.values(AUDIENCE_PAGES).map((page) => ({
    href: page.path,
    label: page.h1,
  }));
  const featureLinks = Object.values(FEATURE_PAGES).map((page) => ({
    href: page.path,
    label: page.h1,
  }));

  const staticPages = [
    {
      path: HOME_SEO.path,
      title: HOME_SEO.title,
      description: HOME_SEO.description,
      h1: 'Upravljajte svojim poslovanjem i terminima na jednom mjestu.',
      lead:
        'Blizari je platforma za poslovanja koja žele jednostavnije upravljati terminima, rezervacijama, klijentima i uslugama. Kreirajte vlastitu poslovnu stranicu, omogućite online rezervacije i pratite poslovanje iz jedne aplikacije.',
      bullets: [
        'Vlastita poslovna stranica i online rezervacije',
        'Upravljanje terminima, uslugama i kapacitetima',
        'Evidencija članova / klijenata i članarina',
        'Klijenti ostaju vaši — Blizari nije katalog konkurencije',
      ],
      links: [
        { href: '/register', label: 'Isprobajte Blizari' },
        { href: '/za-koga-je-blizari', label: 'Za koga je Blizari' },
        { href: '/funkcionalnosti', label: 'Funkcionalnosti' },
        { href: '/cijene', label: 'Cijene' },
      ],
      jsonLd: [organizationJsonLd(), websiteJsonLd(), softwareApplicationJsonLd()],
      changefreq: 'weekly',
      priority: '1.0',
    },
    {
      path: AUDIENCE_HUB.path,
      title: AUDIENCE_HUB.title,
      description: AUDIENCE_HUB.description,
      h1: AUDIENCE_HUB.h1,
      lead: AUDIENCE_HUB.lead,
      links: audienceLinks,
      jsonLd: [
        organizationJsonLd(),
        breadcrumbJsonLd([
          { name: 'Početna', path: '/' },
          { name: 'Za koga je Blizari', path: AUDIENCE_HUB.path },
        ]),
      ],
      changefreq: 'monthly',
      priority: '0.9',
    },
    ...Object.values(AUDIENCE_PAGES).map((page) => ({
      ...page,
      links: [
        { href: '/register', label: page.cta || 'Isprobajte Blizari' },
        { href: AUDIENCE_HUB.path, label: 'Sve djelatnosti' },
        { href: FEATURES_HUB.path, label: 'Funkcionalnosti' },
      ],
      jsonLd: breadcrumbJsonLd([
        { name: 'Početna', path: '/' },
        { name: 'Za koga je Blizari', path: AUDIENCE_HUB.path },
        { name: page.h1, path: page.path },
      ]),
      changefreq: 'monthly',
      priority: '0.8',
    })),
    {
      path: FEATURES_HUB.path,
      title: FEATURES_HUB.title,
      description: FEATURES_HUB.description,
      h1: FEATURES_HUB.h1,
      lead: FEATURES_HUB.lead,
      links: featureLinks,
      jsonLd: [
        softwareApplicationJsonLd(),
        breadcrumbJsonLd([
          { name: 'Početna', path: '/' },
          { name: 'Funkcionalnosti', path: FEATURES_HUB.path },
        ]),
      ],
      changefreq: 'monthly',
      priority: '0.85',
    },
    ...Object.values(FEATURE_PAGES).map((page) => ({
      ...page,
      links: [
        { href: '/register', label: 'Isprobajte Blizari' },
        { href: FEATURES_HUB.path, label: 'Sve funkcionalnosti' },
      ],
      jsonLd: breadcrumbJsonLd([
        { name: 'Početna', path: '/' },
        { name: 'Funkcionalnosti', path: FEATURES_HUB.path },
        { name: page.h1, path: page.path },
      ]),
      changefreq: 'monthly',
      priority: '0.75',
    })),
    {
      path: PRICING_SEO.path,
      title: PRICING_SEO.title,
      description: PRICING_SEO.description,
      h1: PRICING_SEO.h1,
      lead:
        'Tijekom zatvorenog pilota korištenje Blizaria je besplatno. Ne naplaćujemo pretplatu dok ne objavimo drugačije.',
      bullets: [
        'Pilot: 0 EUR — rezervacije, članovi, termini, vlastita stranica',
        'Bez skrivenih naknada u ovoj fazi',
        'Online kartična naplata i blagajna UI nisu dio pilota',
      ],
      links: [
        { href: '/register', label: 'Registrirajte studio' },
        { href: '/kontakt', label: 'Kontakt' },
      ],
      jsonLd: breadcrumbJsonLd([
        { name: 'Početna', path: '/' },
        { name: 'Cijene', path: PRICING_SEO.path },
      ]),
      changefreq: 'monthly',
      priority: '0.8',
    },
    {
      path: '/mogucnosti',
      title: `Mogućnosti ${BRAND.name} — rezervacije, članovi, termini`,
      description:
        'Pregled mogućnosti Blizaria: vlastita stranica, online rezervacije, raspored, članovi i članarine na jednom mjestu.',
      h1: 'Mogućnosti Blizaria',
      lead:
        'Blizari vam pomaže organizirati svakodnevni rad, upravljati klijentima i rezervacijama te omogućiti jednostavniji način dogovaranja termina.',
      links: [
        { href: '/funkcionalnosti', label: 'Detaljne funkcionalnosti' },
        { href: '/register', label: 'Napravite svoju stranicu' },
      ],
      changefreq: 'monthly',
      priority: '0.7',
    },
    {
      path: '/o-nama',
      title: 'O nama — Blizari',
      description:
        'Blizari je nastao iz stvarnog problema: termini, rezervacije i klijenti u bilježnicama i porukama. Gradimo jednostavan alat za uslužna poslovanja.',
      h1: 'O nama',
      lead:
        'Jedna ideja i želja da vođenje poslovanja bude jednostavnije. Gradimo alat koji vlasnicima uslužnih poslovanja štedi vrijeme na administraciji — uz vlastitu stranicu i kontrolu nad klijentima.',
      links: [
        { href: '/register', label: 'Isprobajte Blizari' },
        { href: '/kontakt', label: 'Kontakt' },
      ],
      jsonLd: organizationJsonLd(),
      changefreq: 'monthly',
      priority: '0.6',
    },
    {
      path: '/kontakt',
      title: 'Kontakt — Blizari',
      description:
        'Kontaktirajte Blizari podršku ili se javite svom studiju zbog termina.',
      h1: 'Kontakt',
      lead: `Za platformu pišite na ${contactEmail}. Za termine javite se svom studiju.`,
      links: [{ href: `mailto:${contactEmail}`, label: contactEmail }],
      changefreq: 'monthly',
      priority: '0.6',
    },
    {
      path: '/otkrij',
      title: 'Otkrij usluge i studije — Blizari',
      description:
        'Pregledajte javno otkrivene studije i usluge. Rezervirajte izravno na stranici poslovanja koje odaberete.',
      h1: 'Pronađite uslugu ili mjesto koje tražite.',
      lead:
        'Samo poslovanja koja su eksplicitno uključila javno otkrivanje. Rezervacija ide na njihovu stranicu — ne na zajednički katalog klijenata.',
      links: [
        { href: '/za-koga-je-blizari', label: 'Za vlasnike poslovanja' },
        { href: '/register', label: 'Otvorite studio' },
      ],
      changefreq: 'weekly',
      priority: '0.5',
    },
    {
      path: '/privatnost',
      title: 'Politika privatnosti — Blizari',
      description:
        'Kako Blizari obrađuje osobne podatke, pravna osnova, rokovi čuvanja i vaša prava prema GDPR-u.',
      h1: 'Politika privatnosti',
      lead: 'Jednostavno: što radimo s vašim podacima, zašto, koliko dugo — i kako ostvarujete svoja prava.',
      changefreq: 'yearly',
      priority: '0.3',
    },
    {
      path: '/uvjeti',
      title: 'Uvjeti korištenja — Blizari',
      description:
        'Uvjeti korištenja Blizari platforme za studije i članove — prava, obveze i ograničenja usluge.',
      h1: 'Uvjeti korištenja',
      lead: 'Pravila korištenja aplikacije za vlasnike studija i članove.',
      changefreq: 'yearly',
      priority: '0.3',
    },
    {
      path: '/kolacici',
      title: 'Politika kolačića — Blizari',
      description:
        'Koje kolačiće Blizari koristi, zašto i kako upravljati pristankom.',
      h1: 'Politika kolačića',
      lead: 'Što preglednik pamti kod nas — uglavnom da ostanete prijavljeni.',
      changefreq: 'yearly',
      priority: '0.3',
    },
  ];

  return staticPages;
}
