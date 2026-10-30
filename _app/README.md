# Motor del portal NWS (`_app/`)

Cada proyecto es una carpeta `<slug>/` con:

- `index.html`: define `window.NWS = {...}` y carga `../_app/portal.css` y `../_app/portal.js` (copiar `kdm-santiago-centro/index.html` como plantilla).
- `logo.png`, los PDF de cotización y, si existen, `plano/`, `presentacion/`, video y miniaturas.

## Campos de `window.NWS`

| Campo | Qué es |
|---|---|
| `demo` | `true` muestra la etiqueta DEMO |
| `titulo`, `cliente`, `sitio`, `direccion`, `codigo`, `linea`, `fecha`, `fecha_visita`, `validez` | Textos de la cabecera |
| `imagen` | Imagen base del levantamiento (satelital o plano). Las posiciones `x`,`y` de los puntos son píxeles de esta imagen |
| `atribucion` | Nota bajo el plano (fuente de la imagen, escala) |
| `kpis` | Hasta 3: `{ v: 18 \| '785 m', l: 'Cámaras IP' }` |
| `puntos` | `{ t, n, x, y, s, d, c, to, m, mod, e }`: tipo (camara, detector, sirena, punto_red, ap, bocina, telefono, consola, central, nodo, otro), número, posición, sector, descripción, conexión, nodo de destino (descripción del nodo), metros, modelo, etiqueta opcional |
| `alcance` | Lista de frases de "Qué incluye" |
| `etapas` | Opcional: `{ t, d, estado: 'ok' \| 'now' \| '' }` (por defecto: visita ✓, propuesta en curso, aprobación, instalación, entrega) |
| `cotizaciones` | `{ nombre, numero, neto, iva, total, pdf, mensual?, nota? }`; la primera es la principal. Montos EXACTOS del ERP |
| `documentos` | `{ nombre, detalle, url, tipo: 'pdf' \| 'slides' \| '3d' \| 'web' \| 'video', thumb? }` |
| `video`, `video_poster` | Video de la propuesta (opcional) |
| `contacto` | `{ nombre, cargo, email? }`; con `email` aparece el botón "Aceptar la propuesta" |

No poner precios unitarios del catálogo: solo los montos de la cotización.
