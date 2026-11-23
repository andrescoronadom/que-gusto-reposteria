import assert from 'node:assert/strict';
import test from 'node:test';
import { esc, safeImageUrl } from '../format.js';

test('escapes markup characters before rendering dynamic content', () => {
  assert.equal(esc(`<img src="x" onerror='bad'>`), '&lt;img src=&quot;x&quot; onerror=&#39;bad&#39;&gt;');
});

test('accepts HTTPS image URLs and rejects unsafe protocols', () => {
  assert.equal(safeImageUrl('/image.png', 'https://shop.example/'), 'https://shop.example/image.png');
  assert.equal(safeImageUrl('javascript:alert(1)', 'https://shop.example/'), '');
  assert.equal(safeImageUrl('http://images.example/image.png', 'https://shop.example/'), '');
});
