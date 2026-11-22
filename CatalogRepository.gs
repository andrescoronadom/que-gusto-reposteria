function CatalogRepository_listActive_() {
  const spreadsheet = SpreadsheetApp.openById(APP_CONFIG.spreadsheetId);
  const sheet = spreadsheet.getSheetByName(APP_CONFIG.sheets.products);
  if (!sheet) throw new Error('No existe la hoja Productos.');

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  return sheet.getRange(2, 1, lastRow - 1, 7).getValues()
    .filter(function(row) {
      const active = String(row[6]).trim().toUpperCase();
      return row[6] === true || row[6] === 1 ||
        active === 'VERDADERO' || active === 'TRUE' || active === '1';
    })
    .map(function(row) {
      return {
        id: String(row[0]),
        nombre: String(row[1] || '').trim(),
        categoria: String(row[2] || '').trim(),
        descripcion: String(row[3] || '').trim(),
        precio: Number(row[4]),
        imagen: String(row[5] || '').trim()
      };
    })
    .filter(function(product) {
      return product.id && product.nombre && Number.isFinite(product.precio) && product.precio >= 0;
    });
}

function CatalogRepository_findActiveByIds_(ids) {
  const wanted = new Set(ids.map(String));
  return CatalogRepository_listActive_().filter(function(product) {
    return wanted.has(product.id);
  });
}
