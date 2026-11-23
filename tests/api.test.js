import assert from 'node:assert/strict';
import test from 'node:test';
import { createApiClient } from '../api.js';

test('loads products from the published API response shape', async () => {
  const calls = [];
  const api = createApiClient({
    endpoint: 'https://example.test/exec',
    fetcher: async (...args) => {
      calls.push(args);
      return new Response(JSON.stringify({ ok: true, productos: [{ id: 'a' }] }), { status: 200 });
    }
  });

  assert.deepEqual(await api.getCatalog(), [{ id: 'a' }]);
  assert.equal(calls[0][0], 'https://example.test/exec');
  assert.equal(calls[0][1].method, 'GET');
});

test('sends an order as JSON and surfaces HTTP failures', async () => {
  let request;
  const api = createApiClient({
    endpoint: 'https://example.test/exec',
    fetcher: async (url, options) => {
      request = { url, options };
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
  });
  const payload = { accion: 'crearPedido', datos: { nombreCliente: 'Ana' } };

  assert.deepEqual(await api.createOrder(payload), { ok: true });
  assert.equal(request.options.headers['Content-Type'], 'text/plain;charset=utf-8');
  assert.deepEqual(JSON.parse(request.options.body), payload);

  const failingApi = createApiClient({
    fetcher: async () => new Response('', { status: 503 })
  });
  await assert.rejects(failingApi.getCatalog(), /Error HTTP 503/);
});
