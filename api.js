export const API_URL = 'https://script.google.com/macros/s/AKfycby1v6jVj1CvDaRhcXaaD-qNFFEHAC0UWxID3WhIyFxZldNiEPYzP7_PoUXau1Io14AV/exec';

export function createApiClient({
  endpoint = API_URL,
  fetcher = (...args) => globalThis.fetch(...args)
} = {}) {
  async function request(url, options) {
    const response = await fetcher(url, options);
    if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
    return response.json();
  }

  async function getCatalog() {
    const data = await request(endpoint, {
      method: 'GET',
      credentials: 'omit',
      redirect: 'follow'
    });
    if (Array.isArray(data)) return data;
    if (data && data.ok && Array.isArray(data.productos)) return data.productos;
    throw new Error(data && data.error ? data.error : 'El catálogo no tiene un formato válido.');
  }

  async function createOrder(payload) {
    return request(endpoint, {
      method: 'POST',
      credentials: 'omit',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
  }

  return { getCatalog, createOrder };
}
