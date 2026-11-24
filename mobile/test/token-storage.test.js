import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  TOKEN_KEY,
  clearToken,
  getToken,
  setToken,
  setTokenStorage,
} from '../src/api/token.js';

describe('mobile token storage adapter', () => {
  it('persists JWT through a pluggable secure-like store', async () => {
    const map = new Map();
    setTokenStorage({
      async getItem(key) {
        return map.has(key) ? map.get(key) : null;
      },
      async setItem(key, value) {
        map.set(key, value);
      },
      async removeItem(key) {
        map.delete(key);
      },
    });

    await setToken('jwt-test-token');
    assert.equal(map.get(TOKEN_KEY), 'jwt-test-token');
    assert.equal(await getToken(), 'jwt-test-token');

    await clearToken();
    assert.equal(map.has(TOKEN_KEY), false);
    assert.equal(await getToken(), null);
  });
});
