function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Qué Gusto · Repostería')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  const allowedFiles = ['styles', 'app'];
  if (!allowedFiles.includes(filename)) {
    throw new Error('Plantilla no permitida.');
  }
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function obtenerProductosActivos() {
  try {
    return JSON.stringify(CatalogService_listActive_());
  } catch (error) {
    Logger.log('Error al cargar el catálogo: ' + error.toString());
    throw new Error('No pudimos cargar el catálogo en este momento.');
  }
}

function procesarPedido(payloadJSON) {
  return OrderService_process_(payloadJSON);
}
