import { cop, esc, fecha, safeImageUrl } from './format.js';

const icons = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/>',
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h2.5l2.2 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-1L20 8H6.2"/>'
};

export const svg = (name) => `<svg class="qg-icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
const errMsg = (message, id) => `<p class="qg-field__error body-sm" id="${id}">${svg('alert')}${message}</p>`;

export function header(count) {
  const actionBtn = `<a class="qg-cartbtn" href="#/pedido" aria-label="${count ? `Ver mi pedido, ${count} productos` : 'Ver mi pedido'}">
    ${svg('cart')}<span>Mi pedido</span>${count ? `<span class="qg-cartbtn__count caption">${count}</span>` : ''}
  </a>`;

  return `<header class="qg-header"><div class="qg-header__inner">
    <a class="qg-brand" href="#/" aria-label="Qué Gusto · Repostería, inicio">
      <img class="qg-header__logo" src="./logo-A-blanco.png" alt="Qué Gusto · Repostería">
    </a>
    <div class="qg-header__actions">${actionBtn}</div>
  </div></header>`;
}

export function footer() {
  return `<footer class="qg-footer"><span>Qué Gusto · Repostería</span><a class="qg-footer__instagram" href="https://www.instagram.com/somosquegusto/" target="_blank" rel="noopener noreferrer">${svg('instagram')}<span>@somosquegusto</span></a><span>Ábrelo con gusto, disfrútalo sin afán.</span></footer>`;
}

function stepper(id, quantity, name) {
  const safeId = esc(id);
  const safeName = esc(name);
  return `<div class="qg-stepper" role="group" aria-label="Cantidad de ${safeName}">
    <button class="qg-stepper__btn" type="button" data-dec="${safeId}" aria-label="Quitar una unidad de ${safeName}">${svg('minus')}</button>
    <span class="qg-stepper__value body-strong" role="status" aria-live="polite" aria-atomic="true">${quantity}</span>
    <button class="qg-stepper__btn" type="button" data-inc="${safeId}" aria-label="Agregar una unidad de ${safeName}">${svg('plus')}</button></div>`;
}

function productCard(product, quantity) {
  const id = String(product.id);
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

export function landingView({ photo, count }) {
  const visual = photo
    ? `<figure class="qg-launch__photo"><img src="${esc(photo.url)}" alt="${esc(photo.name)}, hecho en Qué Gusto · Repostería" loading="eager" fetchpriority="high"><figcaption>${esc(photo.name)}</figcaption></figure>`
    : `<div class="qg-launch__photo qg-launch__photo--empty" aria-hidden="true"><span>Recién horneado</span></div>`;

  return `${header(count)}<main class="qg-launch">
    <section class="qg-launch__hero" aria-labelledby="launch-title">
      <div class="qg-launch__hero-copy">
        <span class="eyebrow qg-eyebrow">HOY SALE DEL HORNO</span>
        <h1 id="launch-title" class="qg-launch__title">Una pausa para volver a ti.</h1>
        <p class="qg-launch__lead"><strong>Qué Gusto · Repostería</strong> nace de volver a lo que nos hace bien: hacer una pausa, crear y disfrutar el camino sin afán.</p>
        <a class="qg-btn qg-btn--primary qg-btn--lg qg-launch__cta" href="#/productos">Ver las dulzuras <span aria-hidden="true">→</span></a>
      </div>
      <div class="qg-launch__visual" aria-label="Dulzura de Qué Gusto · Repostería">${visual}</div>
    </section>
    <section class="qg-launch__story" aria-label="La historia de Qué Gusto · Repostería">
      <p class="qg-launch__opening">Hay momentos en los que la vida te invita a hacer una pausa.</p>
      <div class="qg-launch__chapter">
        <span class="eyebrow qg-eyebrow">VOLVER A MÍ</span>
        <p>A veces vivimos en automático y no nos damos cuenta de lo que pasa a nuestro alrededor: el ritmo acelerado, el trabajo, los hijos, la familia, las mascotas... no nos permiten frenar, y la vida misma se encarga de hacerlo.</p>
        <p><strong>Qué Gusto · Repostería</strong> nace de un momento de pausa personal, cuando el piloto automático siguió de largo y el silencio y la reflexión abrieron espacio para algo que me gusta mucho: la repostería. Desde hace tiempo la hacía por hobby, y en esa pausa volví a ella buscando reconectar conmigo y sobrellevar esos momentos de dificultad. Así como la fotografía me ayudó en otro momento, la repostería me trajo de vuelta a mí.</p>
      </div>
      <div class="qg-launch__chapter qg-launch__chapter--warm">
        <span class="eyebrow qg-eyebrow">HECHO SIN AFÁN</span>
        <p>Hoy disfruto profundamente este proceso de creación de <strong>Qué Gusto · Repostería</strong>. Horneamos y amasamos sin afán, disfrutando el camino y cuidando el resultado, con amor y dedicación.</p>
      </div>
      <div class="qg-launch__chapter">
        <span class="eyebrow qg-eyebrow">UN GUSTO PARA COMPARTIR</span>
        <p>Quiero que cuando pruebes cada producto, puedas vivir esa misma experiencia: hacer la pausa que necesitas en el día y disfrutar algo rico y de buen gusto, reconectar contigo, con tu familia, amigos o compañeros, o simplemente consentirte con un instante agradable sin culpa.</p>
        <p>Gracias por abrirnos un espacio para acompañarte en tus momentos de pausa y celebración.</p>
      </div>
    </section>
    <section class="qg-launch__end" aria-label="Descubrir el menú">
      <p class="eyebrow">REPOSTERÍA ARTESANAL · MEDELLÍN</p>
      <h2>Tu pausa rica empieza aquí.</h2>
      <a class="qg-btn qg-btn--fresh qg-btn--lg" href="#/productos">Conocer los productos <span aria-hidden="true">→</span></a>
    </section>
    ${footer()}
  </main>`;
}

export function catalogView({ products, filter, cart, count, total }) {
  const categories = [...new Set(products.map((product) => product.categoria).filter(Boolean))];
  const list = products.filter((product) => filter === 'todo' || product.categoria === filter);
  const allButton = `<button class="qg-filter ${filter === 'todo' ? 'is-selected' : ''}" type="button" data-filter="todo" aria-pressed="${filter === 'todo'}">Todo</button>`;
  const filterButtons = categories.map((category) =>
    `<button class="qg-filter ${filter === category ? 'is-selected' : ''}" type="button" data-filter="${esc(category)}" aria-pressed="${filter === category}">${esc(category)}</button>`
  ).join('');
  const totalCount = Object.values(cart).reduce((sum, quantity) => sum + Number(quantity || 0), 0);

  return `${header(count)}<main class="wrap qg-store">
    <section class="qg-hero" aria-labelledby="catalog-title">
      <div class="qg-hero__copy">
        <span class="eyebrow qg-eyebrow">UNA PAUSA RECIÉN HORNEADA</span>
        <h1 id="catalog-title" class="qg-hero__title">Date gusto, sin afán</h1>
        <p class="body-lg qg-hero__description">Cookies, rollos y otras dulzuras hechas a mano para acompañar tus momentos favoritos.</p>
        <button class="qg-btn qg-btn--primary qg-hero__cta" id="discover-menu" type="button">Explorar el menú <span aria-hidden="true">↓</span></button>
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
      ${list.length ? `<div class="grid">${list.map((product) => productCard(product, Number(cart[String(product.id)] || 0))).join('')}</div>`
        : `<div class="center" style="padding:48px 16px;display:flex;flex-direction:column;gap:8px"><h2 class="heading-md brandc">${products.length ? 'Aún no hay dulzuras en esta categoría' : 'Por aquí todavía no hay dulzuras'}</h2><p>${products.length ? 'Prueba con otro tipo.' : 'Vuelve pronto; estaremos horneando algo rico.'}</p></div>`}
    </section>
    ${totalCount ? `<div class="bar"><a class="qg-btn qg-btn--primary qg-btn--lg" href="#/pedido">Ver mi pedido · ${totalCount} · ${cop(total)}</a></div>` : ''}
    ${footer()}
  </main>`;
}

export function emptyCartView() {
  return `${header(0)}<main class="wrap qg-empty-cart">
    <div class="qg-empty-cart__content">
      <span class="qg-empty-cart__icon" aria-hidden="true">${svg('cart')}</span>
      <span class="eyebrow qg-eyebrow">TU CAJITA ESTÁ ESPERANDO</span>
      <h1 class="heading-lg brandc">Todavía no hay antojos</h1>
      <p>Explora el menú y agrega algo rico para empezar tu pedido.</p>
      <a class="qg-btn qg-btn--primary qg-btn--lg" href="#/productos">Descubrir dulzuras</a>
    </div>
    ${footer()}
  </main>`;
}

export function checkoutView({ items, draft, count, total }) {
  const lines = items.map(({ product, quantity }) => `<div class="qg-cart__line">
    <div style="min-width:0"><h2 class="qg-cart__name body-strong">${esc(product.nombre)}</h2><p class="qg-cart__meta body-sm">${esc(product.categoria || 'Dulzuras')} · ${cop(product.precio)} c/u</p></div>
    <span class="qg-price qg-cart__line-total price">${cop(Number(product.precio) * quantity)}</span>
    ${stepper(product.id, quantity, product.nombre)}
    <button class="qg-btn qg-btn--ghost body-sm" type="button" data-remove="${esc(product.id)}" style="justify-self:end" aria-label="Eliminar ${esc(product.nombre)} del pedido">${svg('trash')}Eliminar</button>
  </div>`).join('');

  return `${header(count)}<main class="wrap qg-checkout">
    <div class="qg-checkout__intro">
      <a class="qg-btn qg-btn--ghost" href="#/productos">${svg('back')}Seguir eligiendo</a>
      <span class="eyebrow qg-eyebrow">UN PASITO MÁS</span>
      <h1 class="heading-lg brandc">Tu pedido con gusto</h1>
      <p>Revisa tus dulzuras y cuéntanos cuándo y dónde las quieres.</p>
    </div>
    <div class="qg-checkout__layout">
      <section class="qg-summary" aria-label="Resumen de tu pedido">
        <div class="qg-summary__card">
          <div class="qg-summary__head">
            <span class="eyebrow qg-eyebrow">TU SELECCIÓN</span>
            <h2 class="heading-md brandc">${count} ${count === 1 ? 'dulzura' : 'dulzuras'}</h2>
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
      <div class="qg-field" id="g-date"><label class="qg-field__label label" for="f-date">¿Para qué fecha? <span class="qg-required" aria-hidden="true">*</span></label><input id="f-date" name="delivery_date" type="date" min="${esc(draft.minDate)}" class="qg-input body" value="${esc(draft.delivery_date)}" aria-describedby="date-error" required>${errMsg('Elige una fecha válida.', 'date-error')}</div>
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
    </form></div>
    ${footer()}
  </main>`;
}

export function thanksView(order, count) {
  const statusText = order.avisos.length > 0
    ? 'Tu solicitud quedó registrada. Tuvimos un inconveniente con una notificación interna; no necesitas enviarla de nuevo. Te confirmaremos por WhatsApp.'
    : 'Tu pedido quedó registrado. No se realizó ningún pago.';

  return `${header(count)}<main class="wrap qg-thanks">
    <div class="qg-thanks__card">
      <span class="qg-thanks__icon" aria-hidden="true">${svg('check')}</span>
      <span class="eyebrow qg-eyebrow">UN PEDIDO HECHO CON GUSTO</span>
      <h1 class="heading-lg brandc">¡Gracias, ${esc(order.name)}!</h1>
      <p class="body-lg">Recibimos tu solicitud para el ${esc(fecha(order.date))}. Te escribiremos al ${esc(order.contact)} para confirmar los detalles.</p>
      <p class="qg-thanks__status body-sm" role="status">${statusText}</p>
      ${order.id ? `<p class="qg-thanks__id caption">Número de pedido <strong>${esc(order.id)}</strong></p>` : ''}
      <a class="qg-btn qg-btn--primary qg-btn--lg" href="#/productos">Volver a las dulzuras</a>
    </div>
  </main>`;
}

export function loadingView(isLanding) {
  return `<main class="wrap qg-loading" role="status" aria-live="polite">
    <div class="qg-loading__content">
      <span class="qg-loading__mark" aria-hidden="true">${svg('cart')}</span>
      <h1 class="heading-md brandc">${isLanding ? 'Preparando tu pausa…' : 'Trayendo las dulzuras…'}</h1>
      <p class="muted">${isLanding ? 'Estamos eligiendo algo rico para recibirte.' : 'Estamos preparando el menú con cariño.'}</p>
      ${isLanding ? '<div class="qg-loading__progress" role="progressbar" aria-label="Preparando la portada"><span></span></div>' : ''}
    </div>
  </main>`;
}

export function catalogErrorView() {
  return `<main class="wrap center">
    <h1 class="heading-md brandc">No pudimos traer las dulzuras</h1>
    <p>Revisa tu conexión e inténtalo de nuevo.</p>
    <button class="qg-btn qg-btn--primary" id="retry-catalog" type="button">Intentar de nuevo</button>
  </main>`;
}
