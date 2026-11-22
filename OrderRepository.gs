function OrderRepository_save_(order) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const spreadsheet = SpreadsheetApp.openById(APP_CONFIG.spreadsheetId);
    const ordersSheet = spreadsheet.getSheetByName(APP_CONFIG.sheets.orders);
    const detailsSheet = spreadsheet.getSheetByName(APP_CONFIG.sheets.orderDetails);
    if (!ordersSheet || !detailsSheet) {
      throw new Error('No se encontraron las hojas Pedidos y Detalle_Pedidos.');
    }

    const deliveryHeaders = ordersSheet.getRange(1, 11, 1, 2).getValues()[0];
    if (!deliveryHeaders[0]) ordersSheet.getRange(1, 11).setValue('Método de entrega');
    if (!deliveryHeaders[1]) ordersSheet.getRange(1, 12).setValue('Dirección de entrega');

    const now = new Date();
    const orderId = 'QG-' +
      Utilities.formatDate(now, APP_CONFIG.timeZone, 'yyyyMMdd') + '-' +
      Utilities.getUuid().replace(/-/g, '').slice(0, 8).toUpperCase();
    const orderRow = Math.max(2, ordersSheet.getLastRow() + 1);
    const warnings = [];

    ordersSheet.getRange(orderRow, 1, 1, 12).setValues([[
      orderId,
      now,
      order.nombreCliente,
      order.whatsapp,
      order.fechaEntrega,
      order.franja,
      order.observaciones,
      order.total,
      'Pendiente Pago',
      '',
      order.metodoEntrega,
      order.direccion
    ]]);

    const firstDetailRow = Math.max(2, detailsSheet.getLastRow() + 1);
    const details = order.carrito.map(function(item, index) {
      return [
        orderId + '-' + (index + 1),
        orderId,
        item.idProducto,
        item.nombre,
        item.cantidad,
        item.subtotal
      ];
    });

    try {
      detailsSheet.getRange(firstDetailRow, 1, details.length, 6).setValues(details);
    } catch (error) {
      Logger.log('No se pudieron guardar los detalles del pedido ' + orderId + ': ' + error.toString());
      ordersSheet.getRange(orderRow, 9).setValue('Revisar detalle');
      warnings.push('El pedido se registró, pero hay que revisar sus detalles en la hoja.');
    }

    return { id: orderId, row: orderRow, warnings: warnings };
  } finally {
    lock.releaseLock();
  }
}

function OrderRepository_updateTaskUrl_(row, url) {
  const spreadsheet = SpreadsheetApp.openById(APP_CONFIG.spreadsheetId);
  const sheet = spreadsheet.getSheetByName(APP_CONFIG.sheets.orders);
  if (!sheet) throw new Error('No existe la hoja Pedidos.');
  sheet.getRange(row, 10).setValue(url);
}
