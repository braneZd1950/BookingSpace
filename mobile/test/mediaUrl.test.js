import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { mediaUrl } from '../src/lib/mediaUrl.js';

describe('mobile mediaUrl', () => {
  test('passes through https urls', () => {
    const url = 'https://images.unsplash.com/photo.jpg';
    assert.equal(mediaUrl(url), url);
  });

  test('rejects unsafe raw values', () => {
    assert.equal(mediaUrl('"), url("evil'), '');
    assert.equal(mediaUrl(''), '');
  });

  test('resolves relative uploads against API origin', () => {
    const url = mediaUrl('/uploads/gallery/a.jpg');
    assert.match(url, /\/uploads\/gallery\/a\.jpg$/);
    assert.match(url, /^https?:\/\//);
  });
});
