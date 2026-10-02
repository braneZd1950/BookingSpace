import { randomInt } from 'crypto';
import { HttpError } from './httpError.js';
import { createDoc } from './transaction.js';

export async function createWithCode(Model, prefix, data, session) {
  const year = new Date().getFullYear();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const serial = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const code = `${prefix}-${year}-${serial}`;
    try {
      return await createDoc(Model, { ...data, code }, session);
    } catch (error) {
      if (error?.code === 11000 && error.keyPattern?.code) continue;
      throw error;
    }
  }

  throw new HttpError(500, 'Could not allocate a code', { code: 'CODE_ALLOCATION' });
}
