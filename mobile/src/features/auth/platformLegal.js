import {
  cookiesSections,
  privacySections,
  termsSections,
} from '../../../../shared/platformLegal/sections.js';

/** Identifikacija pružatelja — usklađeno s web legal.js. */
export const legalEntity = {
  productName: 'anyminutes',
  tradeName: 'anyminutes',
  email: 'kontakt@anyminutes.hr',
  legalName: 'anyminutes',
  oib: '',
  address: 'Republika Hrvatska',
  website: 'https://anyminutes.hr',
  azopUrl: 'https://azop.hr',
  azopMail: 'azop@azop.hr',
  azopAddress: 'Selska cesta 136, 10000 Zagreb',
};

export const LEGAL_DOCS = [
  {
    id: 'privatnost',
    label: 'Privatnost',
    title: 'Politika privatnosti',
    lead:
      'Jednostavno: što radimo s vašim podacima, zašto, koliko dugo — i kako ostvarujete svoja prava.',
    basis:
      'GDPR (Uredba EU 2016/679) · Zakon o provedbi Opće uredbe o zaštiti podataka (RH) · propisi Republike Hrvatske',
    sections: () => privacySections(legalEntity),
  },
  {
    id: 'uvjeti',
    label: 'Uvjeti',
    title: 'Uvjeti korištenja',
    lead:
      'Pravila igre: što smijete očekivati od aplikacije, što od studija — i što očekujemo od vas.',
    basis:
      'Zakon o obveznim odnosima · Zakon o elektroničkoj trgovini · Zakon o zaštiti potrošača (kad se primjenjuje) · GDPR · pravo RH i EU',
    sections: () => termsSections(legalEntity),
  },
  {
    id: 'kolacici',
    label: 'Kolačići',
    title: 'Politika kolačića',
    lead:
      'Što preglednik pamti kod nas — uglavnom da ostanete prijavljeni, bez marketinških tragova.',
    basis: 'Zakon o elektroničkim komunikacijama · GDPR · praksa ePrivacy',
    sections: () => cookiesSections(legalEntity),
  },
];

export const LEGAL_UPDATED = '13. 10. 2026.';

export function findLegalDoc(id) {
  return LEGAL_DOCS.find((item) => item.id === id) || LEGAL_DOCS[0];
}
