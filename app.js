import { createApiClient } from './api.js';
import { createCartStore } from './cart-store.js';
import { esc, hoy, safeImageUrl } from './format.js';
import {
  catalogErrorView,
  catalogView,
  checkoutView,
  emptyCartView,
  landingView,
  loadingView,
  svg,
  thanksView
} from './views.js';

const LANDING_PHOTOS = [
  { url: 'https://drive.google.com/thumbnail?id=1sXB18_u1lufD5UxSKLK1ptigVskaNm22&sz=w1200', name: 'Pausa con café' },
  { url: 'https://drive.google.com/thumbnail?id=1ccTc71vofgQ01PihtOEtXz5iTTgDUN-C&sz=w1200', name: 'Pausa de desayuno' },
  { url: 'https://drive.google.com/thumbnail?id=1e_S8vmDm0nsNVD1ytUiUpYEjlmM8tvsE&sz=w1200', name: 'Pausa en la montaña' },
  { url: 'https://drive.google.com/thumbnail?id=1jiVQZOwNsHpYjb1KWue46PMIKxYg_W8O&sz=w1200', name: 'Pausa de paseo' }
];

const $app = document.getElementById('app');
const api = createApiClient();
const cartStore = createCartStore();

let products = [];
let catalogLoaded = false;
let catalogLoadPromise = null;
let renderToken = 0;
let landingPhoto = null;
const unavailableLandingPhotos = new Set();
let filter = 'todo';
let lastOrder = null;
let formDraft = {
  name: '',
  contact: '',
  delivery_date: '',
  franja: 'Mañana',
  metodoEntrega: 'Domicilio',
  direccion: '',
  notes: ''
};

function bindProductImageFallbacks() {
  $app.querySelectorAll('.qg-card__media img').forEach((image) => {
    image.addEventListener('error', () => {
      const media = image.parentElement;
      const tags = media.querySelector('.qg-card__tags');
      const disc = document.createElement('div');
      const label = document.createElement('span');
      disc.className = 'qg-card__disc';
      disc.setAttribute('aria-hidden', 'true');
      label.className = 'qg-card__ph caption';
      label.textContent = 'Hecho a mano, a su tiempo';
      media.insertBefore(disc, image);
      media.insertBefore(label, tags);
      image.remove();
    }, { once: true });
  });
}

function chooseLandingPhoto() {
  if (landingPhoto) return landingPhoto;

  const configuredPhotos = LANDING_PHOTOS.map((photo) => ({
    url: safeImageUrl(photo.url),
    name: photo.name
  })).filter((photo) => photo.url);
  const catalogPhotos = products
    .filter((product) => safeImageUrl(product.imagen))
    .map((product) => ({ url: safeImageUrl(product.imagen), name: product.nombre }));
  const uniquePhotos = [...new Map([...configuredPhotos, ...catalogPhotos].map((photo) => [photo.url, photo])).values()]
    .filter((photo) => !unavailableLandingPhotos.has(photo.url))
    .slice(0, 4);
  if (!uniquePhotos.length) return null;

  let previousUrl = '';
  try {
    previousUrl = sessionStorage.getItem('qg-landing-photo') || '';
  } catch (error) {
    console.warn('No se pudo recuperar la última foto de portada:', error);
  }
  const choices = uniquePhotos.filter((photo) => photo.url !== previousUrl);
  const pool = choices.length ? choices : uniquePhotos;
  landingPhoto = pool[Math.floor(Math.random() * pool.length)];
  try {
    sessionStorage.setItem('qg-landing-photo', landingPhoto.url);
  } catch (error) {
    console.warn('No se pudo guardar la foto de portada:', error);
  }
  return landingPhoto;
}

function viewLanding() {
  $app.innerHTML = landingView({
    photo: chooseLandingPhoto(),
    count: cartStore.count()
  });
  bindLandingImageFallbacks();
}

function bindLandingImageFallbacks() {
  $app.querySelectorAll('.qg-launch__photo img').forEach((image) => {
    image.addEventListener('error', () => {
      unavailableLandingPhotos.add(image.currentSrc || image.src);
      landingPhoto = null;
      viewLanding();
    }, { once: true });
  });
}

function viewCatalog() {
  $app.innerHTML = catalogView({
    products,
    filter,
    cart: cartStore.snapshot(),
    count: cartStore.count(),
    total: cartStore.total(products)
  });

  bindProductImageFallbacks();
  document.getElementById('discover-menu').addEventListener('click', () => {
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    document.getElementById('menu').scrollIntoView({ behavior, block: 'start' });
  });
  $app.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      filter = button.dataset.filter;
      render({ scroll: false });
    });
  });
  bindCart();
}

function bindCart() {
  $app.querySelectorAll('[data-add], [data-inc]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.add || button.dataset.inc;
      cartStore.setQty(id, cartStore.quantity(id) + 1);
      render({ scroll: false });
      focusQuantityButton(id, ['inc', 'add']);
    });
  });

  $app.querySelectorAll('[data-dec]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.dec;
      cartStore.setQty(id, cartStore.quantity(id) - 1);
      render({ scroll: false });
      focusQuantityButton(id, ['dec', 'add']);
    });
  });

  $app.querySelectorAll('[data-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      cartStore.setQty(button.dataset.remove, 0);
      render({ scroll: false });
    });
  });
}

function focusQuantityButton(id, attributes) {
  const button = [...$app.querySelectorAll('[data-inc], [data-dec], [data-add]')]
    .find((element) => attributes.some((attribute) => element.dataset[attribute] === id));
  if (button) button.focus();
}

function syncDeliveryFields() {
  const isHomeDelivery = document.getElementById('f-metodo').value === 'Domicilio';
  const addressGroup = document.getElementById('g-address');
  const addressInput = document.getElementById('f-address');
  const addressRequired = document.getElementById('address-required');
  addressGroup.hidden = !isHomeDelivery;
  addressInput.required = isHomeDelivery;
  addressRequired.hidden = !isHomeDelivery;
}

function viewCart() {
  const items = cartStore.entries()
    .map(([id, quantity]) => ({
      product: products.find((item) => String(item.id) === String(id)),
      quantity: Number(quantity)
    }))
    .filter((item) => item.product);

  if (!items.length) {
    $app.innerHTML = emptyCartView();
    return;
  }

  const total = cartStore.total(products);
  $app.innerHTML = checkoutView({
    items,
    draft: { ...formDraft, minDate: hoy() },
    count: cartStore.count(),
    total
  });

  bindCart();
  const form = document.getElementById('order-form');
  syncDeliveryFields();
  form.addEventListener('input', () => {
    formDraft = Object.fromEntries(new FormData(form));
  });
  document.getElementById('f-metodo').addEventListener('change', () => {
    formDraft = Object.fromEntries(new FormData(form));
    syncDeliveryFields();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitOrder(form, items, total);
  });
}

async function submitOrder(form, items, total) {
  formDraft = Object.fromEntries(new FormData(form));
  const isHomeDelivery = formDraft.metodoEntrega === 'Domicilio';
  const invalid = {
    name: formDraft.name.trim().length < 2,
    contact: formDraft.contact.trim().length < 5,
    date: !formDraft.delivery_date || formDraft.delivery_date < hoy(),
    address: isHomeDelivery && formDraft.direccion.trim().length < 5
  };

  for (const [field, isInvalid] of Object.entries(invalid)) {
    const group = document.getElementById(`g-${field}`);
    if (group) {
      group.dataset.invalid = String(isInvalid);
      const input = group.querySelector('input');
      if (input) input.setAttribute('aria-invalid', String(isInvalid));
    }
  }
  if (Object.values(invalid).some(Boolean)) {
    const firstInvalid = Object.keys(invalid).find((field) => invalid[field]);
    document.querySelector(`#g-${firstInvalid} input`).focus();
    return;
  }

  const button = document.getElementById('send');
  const errorBox = document.getElementById('form-error');
  button.disabled = true;
  button.textContent = 'Enviando tu solicitud…';
  errorBox.hidden = true;

  const payload = {
    nombreCliente: formDraft.name.trim(),
    whatsapp: formDraft.contact.trim(),
    fechaEntrega: formDraft.delivery_date,
    franja: formDraft.franja,
    metodoEntrega: formDraft.metodoEntrega,
    direccion: isHomeDelivery ? formDraft.direccion.trim() : '',
    observaciones: formDraft.notes.trim(),
    total,
    carrito: items.map(({ product, quantity }) => {
      return {
        idProducto: String(product.id),
        nombre: product.nombre,
        descripcion: product.descripcion || '',
        cantidad: quantity,
        subtotal: quantity * Number(product.precio)
      };
    })
  };

  try {
    const response = await api.createOrder({ accion: 'crearPedido', datos: payload });
    if (response && (response.status === 'success' || response.ok === true)) {
      lastOrder = {
        name: formDraft.name.trim(),
        contact: formDraft.contact.trim(),
        date: formDraft.delivery_date,
        id: response.orderId || '',
        avisos: Array.isArray(response.avisos) ? response.avisos : []
      };
      cartStore.clear();
      formDraft = {
        name: '',
        contact: '',
        delivery_date: '',
        franja: 'Mañana',
        metodoEntrega: 'Domicilio',
        direccion: '',
        notes: ''
      };
      location.hash = '#/gracias';
      return;
    }

    button.disabled = false;
    button.textContent = 'Enviar solicitud de pedido';
    showOrderError(errorBox, response && response.message
      ? response.message
      : 'No pudimos registrar tu solicitud. Intenta de nuevo.');
  } catch (error) {
    button.disabled = false;
    button.textContent = 'Enviar solicitud de pedido';
    console.error('Error al procesar el pedido:', error);
    showOrderError(errorBox, 'Hubo un error de conexión. Intenta de nuevo.');
  }
}

function showOrderError(container, message) {
  container.innerHTML = `${svg('alert')}${esc(message)}`;
  container.hidden = false;
}

function viewThanks() {
  if (!lastOrder) {
    location.hash = '#/';
    return;
  }
  $app.innerHTML = thanksView(lastOrder, cartStore.count());
}

async function loadCatalog() {
  if (catalogLoaded) return;
  if (!catalogLoadPromise) {
    catalogLoadPromise = api.getCatalog()
      .then((catalog) => {
        products = catalog;
        cartStore.reconcile(products);
        catalogLoaded = true;
      })
      .finally(() => {
        catalogLoadPromise = null;
      });
  }
  await catalogLoadPromise;
}

async function render(options = {}) {
  const renderId = ++renderToken;
  let route = location.hash.replace(/^#/, '') || '/';
  if (options.scroll !== false) window.scrollTo(0, 0);

  if (!catalogLoaded) {
    const isLanding = route === '/';
    $app.innerHTML = loadingView(isLanding);
    try {
      await loadCatalog();
    } catch (error) {
      if (renderId !== renderToken) return;
      route = location.hash.replace(/^#/, '') || '/';
      if (route === '/') {
        console.warn('No se pudieron cargar las fotos del catálogo:', error);
        viewLanding();
      } else {
        console.error('Error al cargar el catálogo:', error);
        $app.innerHTML = catalogErrorView();
        document.getElementById('retry-catalog').addEventListener('click', render, { once: true });
      }
      return;
    }
    if (renderId !== renderToken) return;
    route = location.hash.replace(/^#/, '') || '/';
  }

  if (route === '/') {
    viewLanding();
  } else if (route === '/pedido') {
    viewCart();
  } else if (route === '/gracias') {
    viewThanks();
  } else {
    viewCatalog();
  }
  if (options.focus) {
    requestAnimationFrame(() => {
      const heading = $app.querySelector('h1');
      if (heading) heading.setAttribute('tabindex', '-1');
      heading?.focus();
    });
  }
}

window.addEventListener('hashchange', () => render({ focus: true }));
render();
