import { contactEmail } from './contact.js';
import { CONSENT_VERSION } from './consent.js';

/** Identifikacija pružatelja usluge / voditelja obrade (dopunite OIB i sjedište kad budu gotovi). */
export const legalEntity = {
  productName: 'anyminutes',
  tradeName: 'anyminutes',
  email: contactEmail,
  /** Popunite nakon registracije obrta / društva. */
  legalName: 'anyminutes',
  oib: '',
  address: 'Republika Hrvatska',
  website: 'https://anyminutes.hr',
  azopUrl: 'https://azop.hr',
  azopMail: 'azop@azop.hr',
  azopAddress: 'Selska cesta 136, 10000 Zagreb',
  consentVersion: CONSENT_VERSION,
};

export function entityLine() {
  const bits = [legalEntity.legalName || legalEntity.tradeName];
  if (legalEntity.oib) bits.push(`OIB: ${legalEntity.oib}`);
  if (legalEntity.address) bits.push(legalEntity.address);
  bits.push(legalEntity.email);
  return bits.join(' · ');
}
