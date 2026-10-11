import { randomInt } from 'crypto';

/** Avoid ambiguous chars: 0/O, 1/l/I */
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%&*';
const ALL = `${UPPER}${LOWER}${DIGITS}${SYMBOLS}`;

function pick(alphabet) {
  return alphabet[randomInt(alphabet.length)];
}

/**
 * Cryptographically random password for invited members.
 * Always includes upper, lower, digit and symbol; length 12 by default.
 */
export function generateMemberPassword(length = 12) {
  const size = Math.max(10, Math.min(32, Number(length) || 12));
  const chars = [
    pick(UPPER),
    pick(LOWER),
    pick(DIGITS),
    pick(SYMBOLS),
  ];
  while (chars.length < size) chars.push(pick(ALL));
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
