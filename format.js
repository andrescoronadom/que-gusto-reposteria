const money = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[character]);

export const cop = (value) => '$' + money.format(Number.isFinite(Number(value)) ? Number(value) : 0);

export const fecha = (value) => new Date(value + 'T12:00:00').toLocaleDateString('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long'
});

export const hoy = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

export const safeImageUrl = (value, baseUrl = globalThis.location?.href ?? 'https://localhost/') => {
  if (!value) return '';
  try {
    const url = new URL(value, baseUrl);
    return url.protocol === 'https:' ? url.href : '';
  } catch (error) {
    return '';
  }
};
