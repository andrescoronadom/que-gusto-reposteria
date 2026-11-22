function OrderAutomation_run_(orderId, order) {
  const warnings = [];
  let taskUrl = '';

  try {
    OrderAutomation_sendAdminEmail_(orderId, order);
  } catch (error) {
    Logger.log('No se pudo enviar el correo del pedido ' + orderId + ': ' + error.toString());
    warnings.push('No se pudo enviar la notificación por correo.');
  }

  try {
    OrderAutomation_createCalendarEvent_(orderId, order);
  } catch (error) {
    Logger.log('No se pudo crear el evento del pedido ' + orderId + ': ' + error.toString());
    warnings.push('No se pudo crear el evento de Calendar.');
  }

  try {
    taskUrl = OrderAutomation_createProductionTask_(orderId, order);
    if (!taskUrl) warnings.push('No se pudo crear la tarea de producción.');
  } catch (error) {
    Logger.log('No se pudo crear la tarea del pedido ' + orderId + ': ' + error.toString());
    warnings.push('No se pudo crear la tarea de producción.');
  }

  return { taskUrl: taskUrl, warnings: warnings };
}

function OrderAutomation_sendAdminEmail_(orderId, order) {
  const subject = `Nuevo pedido: ${order.nombreCliente} - ${order.fechaEntrega}`;
  let body = `Hola,\n\nTienes un nuevo pedido.\n`;
  body += `ID pedido: ${orderId}\n`;
  body += `Cliente: ${order.nombreCliente}\n`;
  body += `WhatsApp: ${order.whatsapp}\n`;
  body += `Fecha y franja: ${order.fechaEntrega} (${order.franja})\n`;
  body += `Entrega: ${order.metodoEntrega}\n`;
  if (order.direccion) body += `Dirección: ${order.direccion}\n`;
  body += `Observaciones: ${order.observaciones || 'Ninguna'}\n\n`;
  body += `Total a confirmar: $${order.total}\n\n`;
  body += 'Revisa Google Tasks o Calendar para el detalle logístico.';

  MailApp.sendEmail(APP_CONFIG.adminEmail, subject, body);
}

function OrderAutomation_createCalendarEvent_(orderId, order) {
  const calendar = CalendarApp.getCalendarById(APP_CONFIG.adminEmail) || CalendarApp.getDefaultCalendar();
  const baseDate = new Date(order.fechaEntrega + 'T12:00:00');
  const start = new Date(baseDate);
  const end = new Date(baseDate);

  if (order.franja === 'Mañana') {
    start.setHours(9, 0, 0);
    end.setHours(12, 0, 0);
  } else {
    start.setHours(14, 0, 0);
    end.setHours(17, 0, 0);
  }

  const location = order.metodoEntrega === 'Domicilio' ? order.direccion : 'Recoger en Envigado';
  const description =
    `WhatsApp: wa.me/57${order.whatsapp.replace(/\D/g, '')}\n` +
    `Método: ${order.metodoEntrega}\n` +
    `Total: $${order.total}\n` +
    `Notas: ${order.observaciones || 'Ninguna'}`;

  calendar.createEvent(`Entrega: ${order.nombreCliente} [${orderId}]`, start, end, {
    description: description,
    location: location
  });
}

function OrderAutomation_createProductionTask_(orderId, order) {
  const products = order.carrito.map(function(item) {
    return `${item.cantidad}x ${item.nombre}`;
  }).join('\n');

  let notes = `Cliente: ${order.nombreCliente}\n`;
  notes += `WhatsApp: ${order.whatsapp}\n`;
  notes += `Franja: ${order.franja}\n`;
  notes += `Entrega: ${order.metodoEntrega}\n`;
  if (order.direccion) notes += `Dirección: ${order.direccion}\n`;
  notes += `\nPedido:\n${products}\n\n`;
  notes += `Notas: ${order.observaciones || 'Ninguna'}\n`;

  const due = new Date(order.fechaEntrega + 'T12:00:00.000Z').toISOString();
  const task = {
    title: `Hornear para ${order.nombreCliente} [${orderId}]`,
    notes: notes,
    due: due
  };
  const createdTask = Tasks.Tasks.insert(task, '@default');
  return createdTask.selfLink || '';
}

function forzarPermisos() {
  const calendarName = CalendarApp.getDefaultCalendar().getName();
  const tasks = Tasks.Tasks.list('@default');
  const mailQuota = MailApp.getRemainingDailyQuota();
  Logger.log('Sistemas en línea. Calendar: ' + calendarName + '; correos restantes hoy: ' + mailQuota);
  return tasks.items ? tasks.items.length : 0;
}
