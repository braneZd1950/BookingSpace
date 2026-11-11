/**
 * JWT spremište.
 * Web: localStorage (preživi refresh Metro/preglednika).
 * Native kasnije: setTokenStorage s expo-secure-store.
 */

let memoryToken = null;

function createWebStorage() {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return {
        async getItem(key) {
          return globalThis.localStorage.getItem(key);
        },
        async setItem(key, value) {
          globalThis.localStorage.setItem(key, value);
        },
        async removeItem(key) {
          globalThis.localStorage.removeItem(key);
        },
      };
    }
  } catch {
    /* private mode / SSR */
  }
  return null;
}

let storage = createWebStorage() || {
  async getItem() {
    return memoryToken;
  },
  async setItem(_key, value) {
    memoryToken = value;
  },
  async removeItem() {
    memoryToken = null;
  },
};

export const TOKEN_KEY = 'bookingspace.token';

/** @param {{ getItem: Function, setItem: Function, removeItem: Function }} next */
export function setTokenStorage(next) {
  if (!next?.getItem || !next?.setItem || !next?.removeItem) {
    throw new Error('setTokenStorage expects getItem/setItem/removeItem');
  }
  storage = next;
}

export async function getToken() {
  try {
    return (await storage.getItem(TOKEN_KEY)) || memoryToken || null;
  } catch {
    return memoryToken;
  }
}

export async function setToken(token) {
  if (!token) {
    await clearToken();
    return;
  }
  memoryToken = String(token);
  await storage.setItem(TOKEN_KEY, String(token));
}

export async function clearToken() {
  memoryToken = null;
  try {
    await storage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
