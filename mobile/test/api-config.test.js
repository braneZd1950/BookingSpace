import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getApiBaseUrl } from '../src/api/config.js';

describe('mobile getApiBaseUrl', () => {
  it('falls back to localhost in development when env is empty', () => {
    const prevPublic = process.env.EXPO_PUBLIC_API_URL;
    const prevApi = process.env.API_URL;
    const prevNode = process.env.NODE_ENV;
    delete process.env.EXPO_PUBLIC_API_URL;
    delete process.env.API_URL;
    process.env.NODE_ENV = 'development';
    try {
      assert.equal(getApiBaseUrl(), 'http://localhost:4001/api');
    } finally {
      if (prevPublic === undefined) delete process.env.EXPO_PUBLIC_API_URL;
      else process.env.EXPO_PUBLIC_API_URL = prevPublic;
      if (prevApi === undefined) delete process.env.API_URL;
      else process.env.API_URL = prevApi;
      if (prevNode === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = prevNode;
    }
  });

  it('fails closed in production without EXPO_PUBLIC_API_URL', () => {
    const prevPublic = process.env.EXPO_PUBLIC_API_URL;
    const prevApi = process.env.API_URL;
    const prevNode = process.env.NODE_ENV;
    delete process.env.EXPO_PUBLIC_API_URL;
    delete process.env.API_URL;
    process.env.NODE_ENV = 'production';
    try {
      assert.throws(() => getApiBaseUrl(), /EXPO_PUBLIC_API_URL/);
    } finally {
      if (prevPublic === undefined) delete process.env.EXPO_PUBLIC_API_URL;
      else process.env.EXPO_PUBLIC_API_URL = prevPublic;
      if (prevApi === undefined) delete process.env.API_URL;
      else process.env.API_URL = prevApi;
      if (prevNode === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = prevNode;
    }
  });
});
