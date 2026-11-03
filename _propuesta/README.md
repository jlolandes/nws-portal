# Formato estándar «Propuesta NWS» (`_propuesta/`)

Aprobado el 03-11-2026. Basado en los estudios de Proposify (State of Proposals 2026) y Qwilr: 7 secciones fijas, inversión interactiva y aceptación en la misma página.

Cada proyecto es una carpeta `<slug>/` con `index.html` que define `window.PROPUESTA` y carga `../_propuesta/propuesta.css` y `../_propuesta/propuesta.js` (copiar `sinthesi-cctv/index.html` o `transjym-microsoft-365/index.html`), más `logo.png` y los PDF.

Secciones: portada · resumen · solución · plan · inversión · por qué NWS · aceptación. Barra fija con el total y «Aceptar propuesta».

## Campos de `window.PROPUESTA`

| Campo | Qué es |
|---|---|
| `numero`, `erp`, `fecha`, `validez`, `cliente`, `contacto_cliente`, `linea` | Ficha de la portada |
| `titulo`, `bajada` | Frase de beneficio para el cliente y una línea de contexto |
| `resumen` | 3 × `{ t, d }`: lo que necesita, lo que proponemos, lo que obtiene |
| `solucion` | `{ titulo, bajada, bloques: [{ nombre, sub, cifra, unidad, incluye: [] }] }` (sedes, componentes, etc.) |
| `plan_titulo`, `plan` | `[{ t, d, estado: 'hecho' \| 'ahora' \| '' }]` |
| `inversion` | `{ titulo, bajada, grupos, descuento?, nota_unico?, nota_mensual? }` |
| `inversion.grupos` | `{ id, nombre, detalle, pago: 'unico' \| 'mensual', opcional?, marcado?, cantidad?: { etiqueta, valor, min, item }, items: [[descripción, cant, valor_unitario_neto]] }` (valor 0 = «incluido») |
| `inversion.descuento` | `{ monto, requiere: [ids de grupos], texto }` |
| `porque`, `condiciones`, `documentos` | Cifras de NWS, `[[título, texto]]`, `[{ nombre, url }]` |
| `aceptar_texto`, `nws` | Texto de aceptación y contacto NWS `{ nombre, cargo, email, fono, wa }` |

Montos netos EXACTOS de la cotización del ERP; el IVA (19 %) lo calcula el motor.
