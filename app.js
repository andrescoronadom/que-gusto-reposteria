/* Qué Gusto · Pedidos (Cliente + Admin vía Fetch API) */
const API_URL = 'https://script.google.com/macros/s/AKfycby1v6jVj1CvDaRhcXaaD-qNFFEHAC0UWxID3WhIyFxZldNiEPYzP7_PoUXau1Io14AV/exec';

const $app = document.getElementById('app');
const money = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[character]);

const cop = (value) => '$' + money.format(Number.isFinite(Number(value)) ? Number(value) : 0);
const fecha = (value) => new Date(value + 'T12:00:00').toLocaleDateString('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long'
});
const hoy = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const ic = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/>',
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h2.5l2.2 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-1L20 8H6.2"/>'
};

const svg = (name) => `<svg class="qg-icon" viewBox="0 0 24 24" aria-hidden="true">${ic[name]}</svg>`;
const errMsg = (message, id) => `<p class="qg-field__error body-sm" id="${id}">${svg('alert')}${message}</p>`;
const safeImageUrl = (value) => {
  if (!value) return '';
  try {
    const url = new URL(value, window.location.href);
    return url.protocol === 'https:' ? url.href : '';
  } catch (error) {
    return '';
  }
};

let cart = {};
try {
  cart = JSON.parse(localStorage.getItem('qg-cart') || '{}');
  if (!cart || Array.isArray(cart) || typeof cart !== 'object') cart = {};
} catch (error) {
  console.warn('No se pudo recuperar el carrito guardado:', error);
}

const saveCart = () => {
  try {
    localStorage.setItem('qg-cart', JSON.stringify(cart));
  } catch (error) {
    console.warn('No se pudo guardar el carrito en este dispositivo:', error);
  }
};

const cartCount = () => Object.values(cart).reduce((sum, quantity) => sum + Number(quantity || 0), 0);
function setQty(id, quantity) {
  if (quantity <= 0) delete cart[id];
  else cart[id] = Math.min(quantity, 200);
  saveCart();
}

function reconcileCart() {
  let changed = false;
  for (const [id, quantity] of Object.entries(cart)) {
    const valid = products.some((product) => String(product.id) === String(id));
    const parsedQuantity = Number(quantity);
    if (!valid || !Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      delete cart[id];
      changed = true;
    } else if (parsedQuantity !== quantity || parsedQuantity > 200) {
      cart[id] = Math.min(parsedQuantity, 200);
      changed = true;
    }
  }
  if (changed) saveCart();
}

let products = [];
let adminProducts = [];
let adminPin = '';
let catalogLoaded = false;
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

async function apiGet(url) {
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'omit',
    redirect: 'follow'
  });
  if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
  return response.json();
}

async function apiPost(payload) {
  const response = await fetch(API_URL, {
    method: 'POST',
    credentials: 'omit',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
  return response.json();
}

function isAdminView() {
  const params = new URLSearchParams(window.location.search);
  return params.get('vista') === 'admin';
}

function header(options = {}) {
  const adminMode = Boolean(options.adminMode);
  const count = cartCount();
  const actionBtn = adminMode
    ? `<a class="qg-cartbtn" href="./">Ver tienda</a>`
    : `<a class="qg-cartbtn" href="#/pedido" aria-label="${count ? `Ver mi pedido, ${count} productos` : 'Ver mi pedido'}">
        ${svg('cart')}<span>Mi pedido</span>${count ? `<span class="qg-cartbtn__count caption">${count}</span>` : ''}
      </a>`;

  return `<header class="qg-header"><div class="qg-header__inner">
    <a class="qg-brand" href="#/" aria-label="Qué Gusto Repostería, inicio">
      <span class="qg-brand__name">Qué Gusto</span>
      <span class="qg-brand__descriptor">Repostería artesanal</span>
    </a>
    <div class="qg-header__actions">
      <span class="qg-header__city caption">${adminMode ? 'Administración de catálogo' : 'Hecho con gusto en Medellín'}</span>
      ${actionBtn}
    </div>
  </div></header>`;
}

function productCard(product) {
  const id = String(product.id);
  const quantity = Number(cart[id] || 0);
  const category = product.categoria || 'Dulzuras';
  const imageUrl = safeImageUrl(product.imagen);
  const media = imageUrl
    ? `<img src="${esc(imageUrl)}" alt="${esc(product.nombre)}" loading="lazy">`
    : `<div class="qg-card__disc"></div><span class="qg-card__ph caption">Hecho a mano, a su tiempo</span>`;
  const action = quantity === 0
    ? `<button class="qg-btn qg-btn--fresh" type="button" data-add="${esc(id)}" aria-label="Agregar ${esc(product.nombre)} al pedido">${svg('plus')}Agregar</button>`
    : stepper(id, quantity, product.nombre);

  return `<article class="qg-card ${quantity ? 'qg-card--selected' : ''}">
    <div class="qg-card__media">${media}<div class="qg-card__tags"><span class="qg-tag qg-tag--inmediata label">${esc(category)}</span></div></div>
    <div class="qg-card__body"><h2 class="qg-card__title heading-sm">${esc(product.nombre)}</h2>${product.descripcion ? `<p class="qg-card__desc body">${esc(product.descripcion)}</p>` : ''}</div>
    <div class="qg-card__footer"><span class="qg-price price">${cop(product.precio)}</span>${action}</div></article>`;
}

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

function stepper(id, quantity, name) {
  const safeId = esc(id);
  const safeName = esc(name);
  return `<div class="qg-stepper" role="group" aria-label="Cantidad de ${safeName}">
    <button class="qg-stepper__btn" type="button" data-dec="${safeId}" aria-label="Quitar una unidad de ${safeName}">${svg('minus')}</button>
    <span class="qg-stepper__value body-strong" role="status" aria-live="polite" aria-atomic="true">${quantity}</span>
    <button class="qg-stepper__btn" type="button" data-inc="${safeId}" aria-label="Agregar una unidad de ${safeName}">${svg('plus')}</button></div>`;
}

function totalCarrito() {
  return Object.entries(cart).reduce((total, [id, quantity]) => {
    const product = products.find((item) => String(item.id) === String(id));
    return total + (product ? Number(quantity) * Number(product.precio) : 0);
  }, 0);
}

function viewCatalog() {
  const categories = [...new Set(products.map((product) => product.categoria).filter(Boolean))];
  const list = products.filter((product) => filter === 'todo' || product.categoria === filter);
  const allButton = `<button class="qg-filter ${filter === 'todo' ? 'is-selected' : ''}" type="button" data-filter="todo" aria-pressed="${filter === 'todo'}">Todo</button>`;
  const filterButtons = categories.map((category) =>
    `<button class="qg-filter ${filter === category ? 'is-selected' : ''}" type="button" data-filter="${esc(category)}" aria-pressed="${filter === category}">${esc(category)}</button>`
  ).join('');
  const count = cartCount();
  const total = totalCarrito();

  $app.innerHTML = `${header()}<main class="wrap qg-store">
    <section class="qg-hero" aria-labelledby="catalog-title">
      <div class="qg-hero__copy">
        <span class="eyebrow qg-eyebrow">UNA PAUSA RECIÉN HORNEADA</span>
        <h1 id="catalog-title" class="qg-hero__title">Date gusto, sin afán</h1>
        <p class="body-lg qg-hero__description">Cookies, rollos y otras dulzuras hechas a mano para acompañar tus momentos favoritos.</p>
        <button class="qg-btn qg-btn--primary qg-hero__cta" id="discover-menu" type="button">Explorar el menú <span aria-hidden="true">↓</span></button>
        <span class="qg-hero__note caption">Ábrelo con gusto, disfrútalo sin afán</span>
      </div>
      <div class="qg-hero__art" aria-hidden="true">
        <span class="qg-hero__orbit qg-hero__orbit--one"></span>
        <span class="qg-hero__orbit qg-hero__orbit--two"></span>
        <div class="qg-hero__cookie">
          <span class="qg-hero__chip qg-hero__chip--one"></span>
          <span class="qg-hero__chip qg-hero__chip--two"></span>
          <span class="qg-hero__chip qg-hero__chip--three"></span>
          <span class="qg-hero__chip qg-hero__chip--four"></span>
          <span class="qg-hero__chip qg-hero__chip--five"></span>
        </div>
        <span class="qg-hero__art-label">Hecho a mano</span>
      </div>
    </section>
    <section class="qg-catalog-section" id="menu" aria-labelledby="menu-title">
      <div class="qg-catalog-intro">
        <div class="qg-catalog-intro__copy">
          <span class="eyebrow qg-eyebrow">HECHO EN MEDELLÍN, PARA DISFRUTAR</span>
          <h2 id="menu-title" class="heading-lg brandc">Elige tu antojo</h2>
        </div>
        <p class="qg-catalog-intro__aside body-sm">${products.length} ${products.length === 1 ? 'dulzura lista' : 'dulzuras listas'} para descubrir. Todas hechas con cariño y tiempo.</p>
      </div>
      ${categories.length ? `<div class="qg-filter-row" role="group" aria-label="Filtrar por tipo de dulzura">${allButton}${filterButtons}</div>` : ''}
      ${list.length ? `<div class="grid">${list.map(productCard).join('')}</div>`
        : `<div class="center" style="padding:48px 16px;display:flex;flex-direction:column;gap:8px"><h2 class="heading-md brandc">${products.length ? 'Aún no hay dulzuras en esta categoría' : 'Por aquí todavía no hay dulzuras'}</h2><p>${products.length ? 'Prueba con otro tipo.' : 'Vuelve pronto; estaremos horneando algo rico.'}</p></div>`}
    </section>
    ${count ? `<div class="bar"><a class="qg-btn qg-btn--primary qg-btn--lg" href="#/pedido">Ver mi pedido · ${count} · ${cop(total)}</a></div>` : ''}
    <footer class="qg-footer"><span>Qué Gusto Repostería</span><span>Ábrelo con gusto, disfrútalo sin afán.</span></footer>
  </main>`;

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
      setQty(id, Number(cart[id] || 0) + 1);
      render({ scroll: false });
      focusQuantityButton(id, ['inc', 'add']);
    });
  });

  $app.querySelectorAll('[data-dec]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.dec;
      setQty(id, Number(cart[id] || 0) - 1);
      render({ scroll: false });
      focusQuantityButton(id, ['dec', 'add']);
    });
  });

  $app.querySelectorAll('[data-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      setQty(button.dataset.remove, 0);
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
  const ids = Object.keys(cart).filter((id) => products.some((product) => String(product.id) === String(id)));
  if (!ids.length) {
    $app.innerHTML = `${header()}<main class="wrap qg-empty-cart">
      <div class="qg-empty-cart__content">
        <span class="qg-empty-cart__icon" aria-hidden="true">${svg('cart')}</span>
        <span class="eyebrow qg-eyebrow">TU CAJITA ESTÁ ESPERANDO</span>
        <h1 class="heading-lg brandc">Todavía no hay antojos</h1>
        <p>Explora el menú y agrega algo rico para empezar tu pedido.</p>
        <a class="qg-btn qg-btn--primary qg-btn--lg" href="#/">Descubrir dulzuras</a>
      </div>
    </main>`;
    return;
  }

  const total = totalCarrito();
  const lines = ids.map((id) => {
    const product = products.find((item) => String(item.id) === String(id));
    const quantity = Number(cart[id]);
    return `<div class="qg-cart__line">
      <div style="min-width:0"><h2 class="qg-cart__name body-strong">${esc(product.nombre)}</h2><p class="qg-cart__meta body-sm">${esc(product.categoria || 'Dulzuras')} · ${cop(product.precio)} c/u</p></div>
      <span class="qg-price qg-cart__line-total price">${cop(Number(product.precio) * quantity)}</span>
      ${stepper(id, quantity, product.nombre)}
      <button class="qg-btn qg-btn--ghost body-sm" type="button" data-remove="${esc(id)}" style="justify-self:end" aria-label="Eliminar ${esc(product.nombre)} del pedido">${svg('trash')}Eliminar</button>
    </div>`;
  }).join('');

  const draft = formDraft;
  $app.innerHTML = `${header()}<main class="wrap qg-checkout">
    <div class="qg-checkout__intro">
      <a class="qg-btn qg-btn--ghost" href="#/">${svg('back')}Seguir eligiendo</a>
      <span class="eyebrow qg-eyebrow">UN PASITO MÁS</span>
      <h1 class="heading-lg brandc">Tu pedido con gusto</h1>
      <p>Revisa tus dulzuras y cuéntanos cuándo y dónde las quieres.</p>
    </div>
    <div class="qg-checkout__layout">
      <section class="qg-summary" aria-label="Resumen de tu pedido">
        <div class="qg-summary__card">
          <div class="qg-summary__head">
            <span class="eyebrow qg-eyebrow">TU SELECCIÓN</span>
            <h2 class="heading-md brandc">${cartCount()} ${cartCount() === 1 ? 'dulzura' : 'dulzuras'}</h2>
          </div>
          <div class="qg-cart">${lines}</div>
          <div class="qg-cart__totals">
            <div class="qg-cart__row"><span class="body-strong">Subtotal</span><span class="qg-price price">${cop(total)} COP</span></div>
            <p class="body-sm muted">El domicilio, si aplica, se confirma contigo por WhatsApp. Aquí no se realiza ningún pago.</p>
          </div>
        </div>
      </section>
      <form class="form qg-order-form" id="order-form" novalidate>
      <div class="qg-order-form__intro">
        <span class="eyebrow qg-eyebrow">HECHO A TU MEDIDA</span>
        <h2 class="heading-md brandc">¿Cómo te lo acercamos?</h2>
        <p class="body-sm muted">Déjanos tus datos para confirmar los detalles por WhatsApp. Los campos marcados con <span class="qg-required" aria-hidden="true">*</span> son obligatorios.</p>
      </div>
      <div class="qg-field" id="g-name"><label class="qg-field__label label" for="f-name">¿Cómo te llamas? <span class="qg-required" aria-hidden="true">*</span></label><input id="f-name" name="name" class="qg-input body" autocomplete="name" placeholder="Ej. Laura Gómez" value="${esc(draft.name)}" aria-describedby="name-error" required>${errMsg('Escribe tu nombre.', 'name-error')}</div>
      <div class="qg-field" id="g-contact"><label class="qg-field__label label" for="f-contact">Tu WhatsApp <span class="qg-required" aria-hidden="true">*</span></label><input id="f-contact" name="contact" class="qg-input body" inputmode="tel" autocomplete="tel" placeholder="Ej. 300 123 4567" value="${esc(draft.contact)}" aria-describedby="contact-hint contact-error" required><p class="qg-field__hint body-sm" id="contact-hint">Te escribiremos para confirmar.</p>${errMsg('Déjanos un WhatsApp.', 'contact-error')}</div>
      <div class="qg-field" id="g-date"><label class="qg-field__label label" for="f-date">¿Para qué fecha? <span class="qg-required" aria-hidden="true">*</span></label><input id="f-date" name="delivery_date" type="date" min="${hoy()}" class="qg-input body" value="${esc(draft.delivery_date)}" aria-describedby="date-error" required>${errMsg('Elige una fecha válida.', 'date-error')}</div>
      <div class="qg-field" id="g-franja">
        <label class="qg-field__label label" for="f-franja">¿En qué momento del día? <span class="qg-required" aria-hidden="true">*</span></label>
        <select id="f-franja" name="franja" class="qg-select body" required>
          <option value="Mañana" ${draft.franja === 'Mañana' ? 'selected' : ''}>En la mañana (9:00 a. m. – 12:00 p. m.)</option>
          <option value="Tarde" ${draft.franja === 'Tarde' ? 'selected' : ''}>En la tarde (2:00 p. m. – 5:00 p. m.)</option>
        </select>
      </div>
      <div class="qg-field qg-field--full" id="g-method">
        <label class="qg-field__label label" for="f-metodo">¿Cómo te lo acercamos? <span class="qg-required" aria-hidden="true">*</span></label>
        <select id="f-metodo" name="metodoEntrega" class="qg-select body" required>
          <option value="Domicilio" ${draft.metodoEntrega === 'Domicilio' ? 'selected' : ''}>Te lo llevamos hasta la puerta</option>
          <option value="Recoger en Envigado" ${draft.metodoEntrega === 'Recoger en Envigado' ? 'selected' : ''}>Lo recoges en Envigado</option>
        </select>
      </div>
      <div class="qg-field qg-field--full" id="g-address">
        <label class="qg-field__label label" for="f-address">Dirección y municipio <span class="qg-required" id="address-required" aria-hidden="true">*</span></label>
        <input id="f-address" name="direccion" class="qg-input body" autocomplete="street-address" placeholder="Calle, número, barrio y municipio" value="${esc(draft.direccion)}" aria-describedby="address-hint address-error">
        <p class="qg-field__hint body-sm" id="address-hint">Solo la necesitamos si eliges domicilio.</p>
        ${errMsg('Escribe la dirección de entrega.', 'address-error')}
      </div>
      <div class="qg-field qg-field--full"><label class="qg-field__label label" for="f-notes">¿Alguna nota para nosotros? (opcional)</label><textarea id="f-notes" name="notes" class="qg-textarea body" placeholder="Instrucciones especiales, dedicatoria...">${esc(draft.notes)}</textarea></div>
      <p class="qg-status qg-status--error body-sm qg-field--full" id="form-error" role="alert" hidden></p>
      <button type="submit" class="qg-btn qg-btn--primary qg-btn--lg qg-btn--block qg-field--full" id="send">Enviar solicitud de pedido</button>
    </form></div></main>`;

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
    submitOrder(form, ids, total);
  });
}

async function submitOrder(form, ids, total) {
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
    carrito: ids.map((id) => {
      const product = products.find((item) => String(item.id) === String(id));
      return {
        idProducto: id,
        nombre: product.nombre,
        descripcion: product.descripcion || '',
        cantidad: Number(cart[id]),
        subtotal: Number(cart[id]) * Number(product.precio)
      };
    })
  };

  try {
    const response = await apiPost({ accion: 'crearPedido', datos: payload });
    if (response && (response.status === 'success' || response.ok === true)) {
      lastOrder = {
        name: formDraft.name.trim(),
        contact: formDraft.contact.trim(),
        date: formDraft.delivery_date,
        id: response.orderId || '',
        avisos: Array.isArray(response.avisos) ? response.avisos : []
      };
      cart = {};
      saveCart();
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
  const internalWarning = lastOrder.avisos.length > 0;
  const statusText = internalWarning
    ? 'Tu solicitud quedó registrada. Tuvimos un inconveniente con una notificación interna; no necesitas enviarla de nuevo. Te confirmaremos por WhatsApp.'
    : 'Tu pedido quedó registrado. No se realizó ningún pago.';
  $app.innerHTML = `${header()}<main class="wrap qg-thanks">
    <div class="qg-thanks__card">
      <span class="qg-thanks__icon" aria-hidden="true">${svg('check')}</span>
      <span class="eyebrow qg-eyebrow">UN PEDIDO HECHO CON GUSTO</span>
      <h1 class="heading-lg brandc">¡Gracias, ${esc(lastOrder.name)}!</h1>
      <p class="body-lg">Recibimos tu solicitud para el ${esc(fecha(lastOrder.date))}. Te escribiremos al ${esc(lastOrder.contact)} para confirmar los detalles.</p>
      <p class="qg-thanks__status body-sm" role="status">${statusText}</p>
      ${lastOrder.id ? `<p class="qg-thanks__id caption">Número de pedido <strong>${esc(lastOrder.id)}</strong></p>` : ''}
      <a class="qg-btn qg-btn--primary qg-btn--lg" href="#/">Volver a las dulzuras</a>
    </div>
  </main>`;
}

function viewAdmin() {
  $app.innerHTML = `${header({ adminMode: true })}<main class="wrap qg-admin-wrap">
    <div>
      <span class="eyebrow qg-eyebrow">PANEL PRIVADO</span>
      <h1 class="heading-lg brandc">Administrar productos</h1>
    </div>

    ${!adminPin ? `
      <form class="qg-admin-card" id="admin-auth-form">
        <div class="qg-field">
          <label class="qg-field__label label" for="admin-pin">PIN de administrador</label>
          <input id="admin-pin" type="password" class="qg-input body" required autocomplete="current-password" placeholder="Ingresa tu PIN">
        </div>
        <p class="qg-status qg-status--error body-sm" id="admin-auth-error" role="alert" hidden></p>
        <button type="submit" class="qg-btn qg-btn--primary qg-btn--lg" id="admin-login-btn">Ingresar</button>
      </form>
    ` : `
      <form class="qg-admin-card" id="admin-product-form">
        <h2 class="heading-md brandc">Nuevo producto</h2>
        <div class="qg-field">
          <label class="qg-field__label label" for="p-nombre">Nombre</label>
          <input id="p-nombre" type="text" class="qg-input body" required placeholder="Ej. Cookie Doble Chocolate 110g">
        </div>
        <div class="qg-field">
          <label class="qg-field__label label" for="p-categoria">Categoría</label>
          <input id="p-categoria" type="text" class="qg-input body" placeholder="Ej. Cookies, Rollos, Cajas">
        </div>
        <div class="qg-field">
          <label class="qg-field__label label" for="p-precio">Precio (COP)</label>
          <input id="p-precio" type="number" min="0" step="100" class="qg-input body" required placeholder="12000">
        </div>
        <div class="qg-field">
          <label class="qg-field__label label" for="p-desc">Descripción</label>
          <textarea id="p-desc" class="qg-textarea body" placeholder="Ingredientes, gramaje o notas del producto"></textarea>
        </div>
        <div class="qg-field">
          <label class="qg-field__label label" for="p-img">URL de imagen (opcional, HTTPS)</label>
          <input id="p-img" type="url" class="qg-input body" placeholder="https://...">
        </div>
        <p class="qg-status body-sm" id="admin-msg" role="status" hidden></p>
        <button type="submit" class="qg-btn qg-btn--primary qg-btn--lg" id="admin-save-btn">Guardar producto</button>
      </form>

      <section class="qg-admin-card" aria-label="Listado de productos">
        <h2 class="heading-md brandc">Productos en hoja (${adminProducts.length})</h2>
        <div id="admin-products-list">${renderAdminProductRows()}</div>
      </section>
    `}
  </main>`;

  if (!adminPin) {
    document.getElementById('admin-auth-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const pinInput = document.getElementById('admin-pin').value.trim();
      const errBox = document.getElementById('admin-auth-error');
      const btn = document.getElementById('admin-login-btn');
      errBox.hidden = true;
      btn.disabled = true;
      btn.textContent = 'Validando…';

      try {
        const url = `${API_URL}?admin=true&pin=${encodeURIComponent(pinInput)}`;
        const data = await apiGet(url);
        if (!data.ok || !Array.isArray(data.productos)) {
          throw new Error(data.error || 'PIN no válido.');
        }
        adminPin = pinInput;
        adminProducts = data.productos;
        viewAdmin();
      } catch (error) {
        btn.disabled = false;
        btn.textContent = 'Ingresar';
        errBox.innerHTML = `${svg('alert')}${esc(error.message || 'No se pudo validar el PIN.')}`;
        errBox.hidden = false;
      }
    });
    return;
  }

  document.getElementById('admin-product-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const btn = document.getElementById('admin-save-btn');
    const msg = document.getElementById('admin-msg');
    btn.disabled = true;
    msg.hidden = true;

    try {
      const res = await apiPost({
        accion: 'agregarProducto',
        pin: adminPin,
        datos: {
          nombre: document.getElementById('p-nombre').value.trim(),
          categoria: document.getElementById('p-categoria').value.trim() || 'Dulzuras',
          precio: Number(document.getElementById('p-precio').value),
          descripcion: document.getElementById('p-desc').value.trim(),
          imagen: document.getElementById('p-img').value.trim()
        }
      });
      if (!res.ok) throw new Error(res.error || 'No se pudo guardar.');
      await refreshAdminCatalog();
      msg.className = 'qg-status qg-status--success body-sm';
      msg.textContent = 'Producto agregado correctamente.';
      msg.hidden = false;
      event.target.reset();
    } catch (error) {
      msg.className = 'qg-status qg-status--error body-sm';
      msg.textContent = error.message;
      msg.hidden = false;
    } finally {
      btn.disabled = false;
    }
  });

  bindAdminActions();
}

function renderAdminProductRows() {
  if (!adminProducts.length) return '<p class="muted body-sm">No hay productos registrados todavía.</p>';
  return adminProducts.map((item) => `
    <div class="qg-admin-item">
      <div style="min-width:0">
        <strong class="body-strong brandc">${esc(item.nombre)}</strong>
        <p class="body-sm muted">${esc(item.categoria || 'Dulzuras')} · ${cop(item.precio)} · ${item.activo ? 'Activo' : 'Oculto'}</p>
        ${item.descripcion ? `<p class="body-sm muted">${esc(item.descripcion)}</p>` : ''}
      </div>
      <button class="qg-btn qg-btn--secondary" type="button" data-toggle-id="${esc(item.id)}" data-toggle-next="${!item.activo}">
        ${item.activo ? 'Ocultar' : 'Activar'}
      </button>
    </div>
  `).join('');
}

async function refreshAdminCatalog() {
  const url = `${API_URL}?admin=true&pin=${encodeURIComponent(adminPin)}`;
  const data = await apiGet(url);
  if (data.ok && Array.isArray(data.productos)) {
    adminProducts = data.productos;
    catalogLoaded = false;
    viewAdmin();
  }
}

function bindAdminActions() {
  $app.querySelectorAll('[data-toggle-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      await apiPost({
        accion: 'cambiarEstadoProducto',
        pin: adminPin,
        datos: {
          id: btn.dataset.toggleId,
          activo: btn.dataset.toggleNext === 'true'
        }
      });
      await refreshAdminCatalog();
    });
  });
}

async function cargarProductosAPI() {
  const data = await apiGet(API_URL);
  if (Array.isArray(data)) return data;
  if (data && data.ok && Array.isArray(data.productos)) return data.productos;
  throw new Error(data && data.error ? data.error : 'El catálogo no tiene un formato válido.');
}

async function render(options = {}) {
  if (isAdminView()) {
    if (options.scroll !== false) window.scrollTo(0, 0);
    viewAdmin();
    return;
  }

  const route = location.hash.replace(/^#/, '') || '/';
  if (options.scroll !== false) window.scrollTo(0, 0);

  if (!catalogLoaded) {
    $app.innerHTML = `<main class="wrap qg-loading" role="status" aria-live="polite">
      <div class="qg-loading__content">
        <span class="qg-loading__mark" aria-hidden="true">${svg('cart')}</span>
        <h1 class="heading-md brandc">Trayendo las dulzuras…</h1>
        <p class="muted">Estamos preparando el menú con cariño.</p>
      </div>
    </main>`;
    try {
      products = await cargarProductosAPI();
      reconcileCart();
      catalogLoaded = true;
    } catch (error) {
      console.error('Error al cargar el catálogo:', error);
      $app.innerHTML = `<main class="wrap center">
        <h1 class="heading-md brandc">No pudimos traer las dulzuras</h1>
        <p>Revisa tu conexión e inténtalo de nuevo.</p>
        <button class="qg-btn qg-btn--primary" id="retry-catalog" type="button">Intentar de nuevo</button>
      </main>`;
      document.getElementById('retry-catalog').addEventListener('click', render, { once: true });
      return;
    }
  }

  if (route === '/pedido') {
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
