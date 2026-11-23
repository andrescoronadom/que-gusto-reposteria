import assert from 'node:assert/strict';
import test from 'node:test';
import { checkoutView, catalogView, emptyCartView } from '../views.js';

const product = {
  id: 'cookie-1',
  nombre: 'Cookie de prueba',
  categoria: 'Cookies',
  precio: 12000
};

test('checkout view uses its minimum delivery date and keeps the shared footer', () => {
  const html = checkoutView({
    items: [{ product, quantity: 2 }],
    draft: {
      name: '',
      contact: '',
      delivery_date: '',
      franja: 'Mañana',
      metodoEntrega: 'Domicilio',
      direccion: '',
      notes: '',
      minDate: '2026-03-15'
    },
    count: 2,
    total: 24000
  });

  assert.match(html, /type="date" min="2026-03-15"/);
  assert.match(html, /@somosquegusto/);
  assert.match(html, /Cookie de prueba/);
});

test('catalog view filters products while preserving cart summary', () => {
  const html = catalogView({
    products: [product, { ...product, id: 'roll-1', nombre: 'Rollo de canela', categoria: 'Rollos' }],
    filter: 'Cookies',
    cart: { 'cookie-1': 1 },
    count: 1,
    total: 12000
  });

  assert.match(html, /Cookie de prueba/);
  assert.doesNotMatch(html, /Rollo de canela/);
  assert.match(html, /Ver mi pedido · 1 · \$12\.000/);
});

test('empty-cart view includes the shared footer', () => {
  assert.match(emptyCartView(), /@somosquegusto/);
});
