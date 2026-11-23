# Qué Gusto · Repostería: especificaciones de diseño

Guía de referencia para mantener coherentes el catálogo virtual, el carrito y el formulario de solicitud de pedidos. La marca debe sentirse artesanal, cálida y alegre, sin apurar a quien compra.

## Principios

- **Cercanía:** hablar de tú y acompañar el pedido como quien recibe a alguien en casa.
- **Oficio visible:** destacar lo hecho a mano, los ingredientes y el cuidado del horneado.
- **Alegría con calma:** usar acentos de color y mensajes amables, sin urgencia artificial.
- **Claridad:** mostrar características y precio antes de agregar un producto; explicar que enviar la solicitud no equivale a pagar.
- **Mobile first:** priorizar lectura, controles cómodos y un recorrido corto desde el catálogo hasta la solicitud.

## Identidad visual

### Paleta

| Token | Color | Uso recomendado |
| --- | --- | --- |
| Crema | `#FDF9F2` | Fondo principal y superficies cálidas. |
| Morado | `#4A1E51` | Títulos, texto de marca, bordes y acciones principales. |
| Cobalto | `#1E40AF` | Enlaces, indicadores y anillo de foco. |
| Menta | `#BCE9D6` | Fondos de apoyo y acentos frescos. |
| Canela | `#C25E3A` | Acento cálido y detalles decorativos. |
| Vainilla | `#FCE794` | Etiquetas suaves y avisos informativos. |
| Rosa | `#F7B5CD` | Acentos de regalo o variedad. |
| Pistacho | `#8EA873` | Acentos secundarios de temporada o categoría. |
| Espresso | `#2E1A16` | Texto corrido de alto contraste. |

Usar como referencia la proporción **70/20/10**: predominio de crema, morado y cobalto; menta y canela como apoyo; colores secundarios con moderación.

La menta es un fondo, no un color de texto sobre crema o blanco. Para texto pequeño sobre fondos claros, usar espresso, morado o cobalto. Cuando la canela no alcance contraste suficiente, usar una variante más oscura (`#A64B2B`) para texto; reservar `#C25E3A` para acentos.

Los colores originales del logo (morado aproximado `#623060` y azul aproximado `#344B92`) son distintos de la paleta de interfaz y no deben recolorearse. No inventar versiones del logo ni combinar el artesano con la Q.

### Tipografía

- **Caprasimo:** nombre de marca, títulos principales y destacados.
- **DM Sans:** navegación, descripciones, formularios, etiquetas, botones y texto corrido.
- Mantener frases breves, interlineado cómodo y jerarquía clara. Evitar Caprasimo en bloques largos o controles pequeños.

### Fotografía e imágenes

- Preferir luz natural cálida, manos y proceso, o una mesa servida para compartir.
- Evitar flash directo, fondos grises o fríos, filtros muy saturados y el producto aislado sobre blanco puro.
- Las imágenes del catálogo deben conservar su proporción y recortarse sin deformación (`object-fit: cover`). Si no hay imagen válida, mostrar un placeholder de marca sin inventar una fotografía.
- Escapar y validar las URL de imagen antes de mostrarlas.

## Componentes e interacción

### Encabezado

- Mostrar el nombre de marca y un acceso visible al pedido.
- En escritorio, acompañar la marca con una nota discreta de ubicación; en móvil, dar prioridad al acceso al carrito.
- Mantener el encabezado compacto y disponible durante el desplazamiento.
- El contador del carrito debe indicar unidades agregadas, no el número de tipos de producto.

### Catálogo

- Abrir con un hero editorial menta: titular Caprasimo, acción para descubrir el menú y una ilustración CSS de galleta. La ilustración es decorativa, no es un logo ni sustituye las fotos de los productos.
- En escritorio, distribuir el hero en texto e ilustración; en móvil, apilarlo y reducir el arte para que el catálogo siga cerca del primer pantallazo.
- Mostrar las categorías como filtros tipo píldora; permitir desplazamiento horizontal en pantallas estrechas sin comprimir sus etiquetas.
- Dar protagonismo a la foto de cada dulzura. En móvil, usar una ficha compacta con imagen lateral; en pantallas amplias, mostrar una cuadrícula con fotos más grandes.
- Cada tarjeta puede mostrar imagen, categoría, nombre, descripción/características, precio y acción para agregar.
- Las categorías provienen del catálogo; no fijar una lista paralela en la interfaz.
- Mantener visible el precio en COP y no añadir costos de entrega que no estén confirmados.
- Para una categoría vacía o un catálogo sin productos, explicar el estado con tono amable y ofrecer una salida clara.

### Carrito

- Mostrar nombre, cantidad, precio unitario y subtotal por línea.
- En escritorio, separar el resumen del pedido y el formulario; en móvil, apilarlos con el resumen primero.
- Mantener visible el resumen en escritorio sin hacerlo fijo en móvil.
- Permitir aumentar, disminuir o eliminar una línea con controles accesibles.
- Calcular el subtotal con los productos vigentes del catálogo; el servidor vuelve a validar los precios al recibir la solicitud.
- No pedir datos de pago ni mostrar una confirmación que pueda confundirse con un pago realizado.

### Solicitud de pedido

- Solicitar nombre, WhatsApp, fecha, franja horaria, método de entrega y notas opcionales.
- Pedir dirección solo cuando se elige domicilio; ocultarla y no enviarla cuando se elige recoger en Envigado.
- Explicar que el envío se confirma por WhatsApp y que la solicitud no procesa pagos.
- Al confirmar, dar un estado claro. Si el pedido ya quedó registrado pero falla una automatización interna, indicar que no debe reenviarlo.
- Los errores deben explicar cómo continuar, conservar el carrito y evitar limpiar el formulario antes de confirmar el guardado.

## Diseño adaptable y accesibilidad

- Diseñar primero para pantallas estrechas; ampliar las tarjetas en dos o más columnas cuando haya espacio.
- Usar áreas táctiles de al menos **48 × 48 px** en acciones principales, controles de cantidad y navegación.
- Mantener contraste legible: no usar menta como texto sobre crema, ni depender solo del color para indicar selección, error o éxito.
- Todos los controles deben tener etiquetas o nombres accesibles; los controles de cantidad deben anunciar producto y acción.
- Mostrar foco de teclado claramente. El anillo de foco recomendado es de 3 px en cobalto.
- Asociar errores con el campo correspondiente y mover el foco al primer campo inválido.
- Respetar `prefers-reduced-motion`; las animaciones son decorativas y nunca deben ser necesarias para entender un estado.
- No depender de hover para descubrir acciones.

## Voz y contenido

Preferir expresiones como «Elige tus favoritos», «Armemos tu caja», «Te lo llevamos hasta la puerta» y «disfrútalo sin afán». Evitar «cliente», «oferta», «última oportunidad» y mensajes que presionen.

La interfaz puede usar «producto» en datos técnicos internos, pero en el texto visible priorizar «dulzura», «antojo», «cookie», «rollo» o el nombre propio del artículo.

## Administración y datos

La tienda es de consulta y solicitud de pedidos. La administración del catálogo continúa en Google Sheets; no incluir rutas, botones ni controles administrativos en la interfaz pública. Las reglas de diseño no alteran las hojas ni automatizaciones existentes.

## Implementación

- Mantener colores y medidas como variables CSS en `styles.html`.
- Mantener el contenido visible independiente de los nombres internos de columnas de Sheets.
- Usar `Index.html` como plantilla de entrada; `app.html` contiene la interfaz dinámica.
- La hoja `Capacidad_Logística` no tiene reglas configuradas actualmente; no usarla para bloquear pedidos sin definir primero su comportamiento.
- Antes de cambiar el diseño, verificar móvil, teclado, lector de pantalla, catálogo vacío, imágenes ausentes, carrito vacío, errores de red y confirmación de solicitud.
