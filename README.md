# Qué Gusto · Repostería

Interfaz mobile-first para el catálogo y la solicitud de pedidos de Qué Gusto · Repostería. No captura pagos ni incluye un panel administrativo: el catálogo se mantiene directamente en Google Sheets, con acceso compartido solo a las cuentas autorizadas.

Consulta [design.md](./design.md) para las reglas visuales, tipografía, componentes, accesibilidad y tono de contenido.

## Arquitectura

La app separa la interfaz, las operaciones de negocio y las integraciones:

- `app.js`: enrutamiento, coordinación de pantallas y eventos del navegador.
- `views.js`: plantillas HTML de portada, catálogo, pedido y estados.
- `cart-store.js`: estado persistido del carrito, cantidades y totales.
- `api.js`: comunicación con la Web App de Apps Script.
- `format.js`: formato monetario, fechas, escape HTML y validación de URLs.
- `tests/`: pruebas unitarias del cliente API, carrito y utilidades. Ejecuta `npm test` con Node.js.
- `Index.html`, `styles.html`, `app.html`: plantilla, estilos y comportamiento del catálogo.
- `Code.gs`: puntos de entrada de la Web App y funciones invocables desde el navegador.
- `CatalogService.gs` y `CatalogRepository.gs`: caché breve y lectura del catálogo en Sheets.
- `OrderService.gs` y `OrderRepository.gs`: validación del pedido y persistencia.
- `OrderAutomation.gs`: correo, Calendar y Tasks; sus fallos no deshacen un pedido guardado.
- `Config.gs`: nombres de hojas, zona horaria y configuración del proyecto.

Los nombres `Index`, `styles` y `app` deben coincidir con los argumentos de `createTemplateFromFile` e `include` en `Code.gs`. Apps Script no usa carpetas de módulos como un servidor Node; estos archivos `.gs` mantienen responsabilidades separadas dentro del mismo proyecto.

## Estructura esperada en Google Sheets

La hoja `Productos` usa las columnas A:G para ID, nombre, categoría, descripción, precio, URL de imagen y estado activo. La columna F debe contener una URL HTTPS directa y accesible sin iniciar sesión; los enlaces `lh3.googleusercontent.com` del archivo de referencia se muestran directamente. Un enlace a una página de vista previa de Drive no es una URL de imagen directa. Si una URL falta o no carga, la tarjeta muestra un placeholder. El estado activo acepta casillas booleanas y valores `1`/`0`, como aparecen en el archivo de referencia. Las modificaciones del catálogo se reflejan en la tienda en un máximo aproximado de un minuto por la caché breve.

La hoja `Pedidos` conserva sus primeras diez columnas en este orden: ID del pedido, fecha de registro, cliente, WhatsApp, fecha de entrega, franja, observaciones, total, estado y URL de Google Tasks. La columna K se usa para el método de entrega y la L para la dirección. El script completa esos encabezados si están vacíos.

La hoja `Detalle_Pedidos` usa las columnas A:F para ID del detalle, ID del pedido, ID del producto, nombre, cantidad y subtotal.

El archivo de referencia también contiene `Capacidad_Logística`, actualmente sin reglas ni valores configurados. No la uso para rechazar pedidos; si más adelante defines un límite por fecha o franja, se puede integrar sin cambiar el catálogo ni el formulario.

El servidor vuelve a validar los productos activos y calcula el total desde los precios de Sheets. No toma el total enviado por el navegador como valor definitivo. Los pedidos se guardan bajo un bloqueo para reducir colisiones cuando llegan solicitudes simultáneas.

Google Sheets y Apps Script son adecuados para comenzar y mantener una operación pequeña. Si el volumen o la concurrencia crecen, las capas de repositorio permiten migrar el almacenamiento sin rehacer la interfaz ni las reglas principales del pedido; Apps Script y Sheets siguen sujetos a sus cuotas y límites.

## Publicación

Web App publicada: https://script.google.com/macros/s/AKfycby1v6jVj1CvDaRhcXaaD-qNFFEHAC0UWxID3WhIyFxZldNiEPYzP7_PoUXau1Io14AV/exec

1. Reemplaza el código anterior en Apps Script con estos archivos; no mantengas funciones duplicadas como `doGet`, `procesarPedido` o `obtenerProductosActivos`.
2. Verifica los encabezados de las hojas y que los datos del proyecto (`SPREADSHEET_ID` y correo de administración) sean los correctos.
3. Habilita el servicio avanzado de Google Tasks si quieres crear tareas de producción.
4. Ejecuta `forzarPermisos` una vez desde el editor para solicitar permisos de correo, Calendar y Tasks.
5. Implementa el proyecto como Web App y prueba la carga de productos y el envío de un pedido.