/**
 * Partneri na početnoj (marquee).
 *
 * Dok je lista prazna, prikazuju se placeholderi + natpis „Uskoro s nama”.
 * Kad kreneš s pravim studijima: upiši ovdje ILI postavi VITE_HOME_PARTNERS na buildu (Render).
 *
 * VITE_HOME_PARTNERS primjeri:
 *   PowerFit Zadar, Studio Ravnoteža
 *   PowerFit Zadar|/s/powerfit, Studio Ravnoteža|/s/ravnoteza
 */

/** @typedef {{ name: string, href?: string }} HomePartner */

/** Pravi partneri — dopuni kad studio krene u produkciju. */
export const configuredPartners = /** @type {HomePartner[]} */ ([
  // { name: 'PowerFit Zadar', href: '/s/powerfit' },
]);

const placeholders = /** @type {HomePartner[]} */ ([
  { name: 'Igraonica Luka' },
  { name: 'PowerFit Zadar' },
  { name: 'Studio Ravnoteža' },
  { name: 'Pilates Kvart' },
  { name: 'Yoga Obala' },
  { name: 'Salon Mira' },
  { name: 'Tečaj Ritam' },
  { name: 'Wellness Obala' },
]);

function parseEnvPartners(raw) {
  if (!raw || !String(raw).trim()) return [];
  const text = String(raw).trim();
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((item) => {
          if (typeof item === 'string') return { name: item.trim() };
          if (item && typeof item.name === 'string') {
            return { name: item.name.trim(), href: item.href || item.url || undefined };
          }
          return null;
        })
        .filter((item) => item?.name);
    } catch {
      return [];
    }
  }

  return text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [name, href] = part.split('|').map((bit) => bit.trim());
      return href ? { name, href } : { name };
    });
}

export function getHomePartners() {
  const fromEnv = parseEnvPartners(import.meta.env.VITE_HOME_PARTNERS);
  const real = fromEnv.length > 0 ? fromEnv : configuredPartners.filter((p) => p?.name);
  if (real.length > 0) {
    return {
      partners: real,
      label: 'S nama',
      ariaLabel: 'Partneri na anyminutes',
      live: true,
    };
  }
  return {
    partners: placeholders,
    label: 'Uskoro s nama',
    ariaLabel: 'Partneri koji dolaze na anyminutes',
    live: false,
  };
}
