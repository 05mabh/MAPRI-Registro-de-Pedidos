// ══════════════════════════════════════════════════════════════════
// MAPRI FOOD SERVICE — Google Apps Script
// Versión: 1.0 · Mayo 2026
//
// INSTRUCCIONES:
// 1. Abre tu Google Sheet → Extensions (Extensiones) → Apps Script
// 2. Borra todo el código que aparece y pega este archivo completo
// 3. Guarda (Ctrl+S)
// 4. Clic en "Deploy" → "New deployment"
// 5. Tipo: Web App
//    Execute as: Me
//    Who has access: Anyone
// 6. Clic "Deploy" → copia la URL que aparece
// 7. Pega esa URL en la app HTML (línea que dice WEBAPP_URL)
// ══════════════════════════════════════════════════════════════════

function doPost(e) {
  try {
    const raw  = e.postData ? e.postData.contents : '{}';
    const data = JSON.parse(raw);

    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    let sheet   = ss.getSheetByName('Pedidos');

    // Crear hoja si no existe
    if (!sheet) {
      sheet = ss.insertSheet('Pedidos');
    }

    // Crear encabezados si la hoja está vacía
    if (sheet.getLastRow() === 0) {
      const headers = [
        '# Pedido', 'Fecha y Hora', 'Vendedor', 'ID Vendedor',
        'Cliente', 'Segmento', 'Productos (detalle)',
        'Subtotal Q', 'IVA Q', 'Total Q',
        'GPS Vendedor', 'Nota', 'Estado'
      ];
      sheet.appendRow(headers);
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#0F2A1A');
      headerRange.setFontColor('#F5EFE0');
      headerRange.setFontWeight('bold');
      headerRange.setFontSize(10);
      sheet.setFrozenRows(1);
      sheet.setColumnWidth(1,  110);  // # Pedido
      sheet.setColumnWidth(2,  145);  // Fecha
      sheet.setColumnWidth(3,  160);  // Vendedor
      sheet.setColumnWidth(4,  80);   // ID
      sheet.setColumnWidth(5,  180);  // Cliente
      sheet.setColumnWidth(6,  100);  // Segmento
      sheet.setColumnWidth(7,  380);  // Productos
      sheet.setColumnWidth(8,  90);   // Subtotal
      sheet.setColumnWidth(9,  75);   // IVA
      sheet.setColumnWidth(10, 90);   // Total
      sheet.setColumnWidth(11, 160);  // GPS
      sheet.setColumnWidth(12, 160);  // Nota
      sheet.setColumnWidth(13, 100);  // Estado
    }

    // Formatear lista de productos
    const items = data.items || [];
    const prodsStr = items
      .map(i => i.nombre + ' ×' + i.qty + ' (Q' + Number(i.sub || 0).toFixed(2) + ')')
      .join(' | ');

    // Segmento en texto legible
    const segLabels = {hogar:'Hogar', mercado:'Mercado Abierto', horeca:'HORECA', institucional:'Institucional'};
    const segmento  = segLabels[data.segmento] || data.segmento || '';

    const newRow = [
      data.numPedido  || '',
      data.timestamp  || '',
      data.vendedor   || '',
      (data.vendedorId|| ''),
      (data.cliente && data.cliente.nombre) || '',
      segmento,
      prodsStr,
      Number(data.subtotal || 0).toFixed(2),
      Number(data.iva      || 0).toFixed(2),
      Number(data.total    || 0).toFixed(2),
      data.gps  || '',
      data.nota || '',
      'Pendiente'
    ];

    sheet.appendRow(newRow);

    // Color de fila según segmento
    const lastRow   = sheet.getLastRow();
    const rowRange  = sheet.getRange(lastRow, 1, 1, newRow.length);
    const bgColors  = {hogar:'#FFF8E1', mercado:'#E8F5E9', horeca:'#E3F2FD', institucional:'#FBE9E7'};
    const bg = bgColors[data.segmento] || '#FFFFFF';
    rowRange.setBackground(bg);

    return buildResponse({status: 'ok', numPedido: data.numPedido, fila: lastRow});

  } catch (err) {
    return buildResponse({status: 'error', msg: err.toString()});
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput('MAPRI Web App activa ✓  |  ' + new Date().toLocaleString('es-GT'))
    .setMimeType(ContentService.MimeType.TEXT);
}

function buildResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
