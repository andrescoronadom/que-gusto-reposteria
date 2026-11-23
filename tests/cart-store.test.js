import assert from 'node:assert/strict';
import test from 'node:test';
import { createCartStore } from '../cart-store.js';

function memoryStorage(initialValue = '{}') {
  const values = new Map([['qg-cart', initialValue]]);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
}

test('reconciles invalid items and caps saved quantities before totaling', () => {
  const storage = memoryStorage(JSON.stringify({ a: '2', b: 250, c: 0, missing: 1 }));
  const cart = createCartStore({ getStorage: () => storage });
  const products = [
    { id: 'a', precio: 100 },
    { id: 'b', precio: 5 },
    { id: 'c', precio: 10 }
  ];

  cart.reconcile(products);

  assert.deepEqual(cart.snapshot(), { a: 2, b: 200 });
  assert.equal(cart.count(), 202);
  assert.equal(cart.total(products), 1200);
  assert.deepEqual(JSON.parse(storage.getItem('qg-cart')), { a: 2, b: 200 });
});

test('removes quantities at zero and persists the change', () => {
  const storage = memoryStorage();
  const cart = createCartStore({ getStorage: () => storage });

  cart.setQty('a', 3);
  cart.setQty('a', 0);

  assert.deepEqual(cart.snapshot(), {});
  assert.deepEqual(JSON.parse(storage.getItem('qg-cart')), {});
});
