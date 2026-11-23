const STORAGE_KEY = 'qg-cart';
const MAX_QUANTITY = 200;

export function createCartStore({
  getStorage = () => globalThis.localStorage,
  warn = (...args) => console.warn(...args)
} = {}) {
  let cart = {};
  try {
    cart = JSON.parse(getStorage().getItem(STORAGE_KEY) || '{}');
    if (!cart || Array.isArray(cart) || typeof cart !== 'object') cart = {};
  } catch (error) {
    warn('No se pudo recuperar el carrito guardado:', error);
  }

  function save() {
    try {
      getStorage().setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      warn('No se pudo guardar el carrito en este dispositivo:', error);
    }
  }

  function count() {
    return Object.values(cart).reduce((sum, quantity) => sum + Number(quantity || 0), 0);
  }

  function quantity(id) {
    return Number(cart[id] || 0);
  }

  function setQty(id, nextQuantity) {
    if (nextQuantity <= 0) delete cart[id];
    else cart[id] = Math.min(nextQuantity, MAX_QUANTITY);
    save();
  }

  function reconcile(products) {
    let changed = false;
    for (const [id, storedQuantity] of Object.entries(cart)) {
      const valid = products.some((product) => String(product.id) === String(id));
      const parsedQuantity = Number(storedQuantity);
      if (!valid || !Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
        delete cart[id];
        changed = true;
      } else if (parsedQuantity !== storedQuantity || parsedQuantity > MAX_QUANTITY) {
        cart[id] = Math.min(parsedQuantity, MAX_QUANTITY);
        changed = true;
      }
    }
    if (changed) save();
  }

  function total(products) {
    return Object.entries(cart).reduce((sum, [id, storedQuantity]) => {
      const product = products.find((item) => String(item.id) === String(id));
      return sum + (product ? Number(storedQuantity) * Number(product.precio) : 0);
    }, 0);
  }

  function snapshot() {
    return { ...cart };
  }

  function entries() {
    return Object.entries(cart);
  }

  function clear() {
    cart = {};
    save();
  }

  return { clear, count, entries, quantity, reconcile, setQty, snapshot, total };
}
