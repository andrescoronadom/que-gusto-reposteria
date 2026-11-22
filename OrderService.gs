function OrderService_process_(payloadJSON) {
  let order;
  try {
    order = OrderService_prepare_(JSON.parse(payloadJSON));
  } catch (error) {
    return { status: 'error', message: error.message || 'La solicitud no tiene un formato válido.' };
  }

  let savedOrder;
  try {
    savedOrder = OrderRepository_save_(order);
  } catch (error) {
    Logger.log('No se pudo guardar el pedido: ' + error.toString());
    return { status: 'error', message: error.message || 'No pudimos guardar tu pedido.' };
  }

  const warnings = savedOrder.warnings.slice();
  const automation = OrderAutomation_run_(savedOrder.id, order);
  warnings.push.apply(warnings, automation.warnings);

  if (automation.taskUrl) {
    try {
      OrderRepository_updateTaskUrl_(savedOrder.row, automation.taskUrl);
    } catch (error) {
      Logger.log('No se pudo guardar el enlace de Tasks para ' + savedOrder.id + ': ' + error.toString());
      warnings.push('El pedido se registró, pero no se pudo guardar el enlace de la tarea.');
    }
  }

  return {
    status: 'success',
    orderId: savedOrder.id,
    fecha: order.fechaEntrega,
    avisos: warnings
  };
}

function OrderService_prepare_(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('La solicitud no tiene un formato válido.');
  }

  const nombreCliente = String(payload.nombreCliente || '').trim();
  const whatsapp = String(payload.whatsapp || '').trim();
  const fechaEntrega = String(payload.fechaEntrega || '').trim();
  const franja = String(payload.franja || '').trim();
  const metodoEntrega = String(payload.metodoEntrega || '').trim();
  const direccion = String(payload.direccion || '').trim();
  const observaciones = String(payload.observaciones || '').trim();

  if (nombreCliente.length < 2 || nombreCliente.length > 120) {
    throw new Error('Escribe un nombre válido para continuar.');
  }
  if (whatsapp.length < 5 || whatsapp.length > 80) {
    throw new Error('Escribe un WhatsApp de contacto válido.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaEntrega)) {
    throw new Error('Elige una fecha de entrega válida.');
  }
  const date = new Date(fechaEntrega + 'T12:00:00-05:00');
  if (Utilities.formatDate(date, APP_CONFIG.timeZone, 'yyyy-MM-dd') !== fechaEntrega) {
    throw new Error('Elige una fecha de entrega válida.');
  }
  const today = Utilities.formatDate(new Date(), APP_CONFIG.timeZone, 'yyyy-MM-dd');
  if (fechaEntrega < today) throw new Error('La fecha de entrega no puede estar en el pasado.');
  if (!['Mañana', 'Tarde'].includes(franja)) {
    throw new Error('Elige una franja horaria válida.');
  }
  if (!['Domicilio', 'Recoger en Envigado'].includes(metodoEntrega)) {
    throw new Error('Elige un método de entrega válido.');
  }
  if (metodoEntrega === 'Domicilio' && (direccion.length < 5 || direccion.length > 500)) {
    throw new Error('Escribe una dirección válida para la entrega.');
  }
  if (observaciones.length > 1000) throw new Error('Las notas son demasiado largas.');
  if (!Array.isArray(payload.carrito) || payload.carrito.length === 0 || payload.carrito.length > 50) {
    throw new Error('Agrega entre uno y 50 productos al pedido.');
  }

  const productIds = payload.carrito.map(function(item) {
    return item && item.idProducto != null ? String(item.idProducto) : '';
  });
  if (productIds.some(function(id) { return !id; })) {
    throw new Error('El pedido contiene un producto no válido.');
  }

  const products = CatalogRepository_findActiveByIds_(productIds);
  const productsById = new Map(products.map(function(product) {
    return [product.id, product];
  }));
  const quantities = new Map();

  payload.carrito.forEach(function(item) {
    const id = String(item.idProducto);
    const quantity = Number(item.cantidad);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 200) {
      throw new Error('La cantidad de un producto no es válida.');
    }
    const totalQuantity = (quantities.get(id) || 0) + quantity;
    if (totalQuantity > 200) throw new Error('La cantidad de un producto supera el máximo permitido.');
    quantities.set(id, totalQuantity);
  });

  const cart = Array.from(quantities.entries()).map(function(entry) {
    const id = entry[0];
    const quantity = entry[1];
    const product = productsById.get(id);
    if (!product) throw new Error('Uno de los productos ya no está disponible.');
    if (!Number.isFinite(product.precio) || product.precio < 0) {
      throw new Error('Hay un precio no válido en el catálogo.');
    }
    return {
      idProducto: product.id,
      nombre: product.nombre,
      cantidad: quantity,
      subtotal: product.precio * quantity
    };
  });

  return {
    nombreCliente: nombreCliente,
    whatsapp: whatsapp,
    fechaEntrega: fechaEntrega,
    franja: franja,
    metodoEntrega: metodoEntrega,
    direccion: metodoEntrega === 'Domicilio' ? direccion : '',
    observaciones: observaciones,
    total: cart.reduce(function(sum, item) { return sum + item.subtotal; }, 0),
    carrito: cart
  };
}
