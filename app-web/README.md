# Mi Panel (versión web)

La misma app que `app-movil/`, pero como página web, para móviles donde no se pueden instalar APK
(por ejemplo, con Family Link). Es un panel de control con cinco pestañas:

- **Inicio**: baldosas en vivo (batería, el tiempo con Open-Meteo, conexión, dinero, la clase de ahora,
  estudio de hoy, foco, media y la próxima cuenta atrás), herramientas (linterna, lector de QR,
  cronómetro, dados y test de velocidad) y "Mi móvil" con el detalle de batería, cascos y conexión.
- **Tareas**: horario de clases, plan de hoy, tu semana con racha y próximos exámenes.
- **Foco**: temporizador de estudio con sonido de fondo, pantalla encendida y logros.
- **Notas**: media, evolución, media por asignatura y "¿qué necesito sacar?".
- **Dinero**: lo que tienes, gastos por categoría y por día, límite al mes, huchas y extractos de
  Revolut (Excel o CSV, elegidos o compartidos desde Revolut con Mi Panel; se leen en el móvil).

Samsung Internet aplica su propio modo oscuro aunque la página ya sea oscura: oscurece los degradados y
los fondos de colores vivos. Por eso los números, anillos, barras y gráficas van en colores lisos, y en
Samsung Internet los botones principales van en cristal con borde de color.

- `node build.mjs <salida>` genera dos versiones a partir del mismo código (necesita `esbuild`):
  - `<salida>/web/`: web instalable (PWA) con test de velocidad y Bluetooth, para alojar en cualquier
    hosting estático (GitHub Pages, Vercel…).
  - `<salida>/mi-panel.html`: página para claude.ai, que guarda las tareas y notas en la cuenta de Claude.
  - `<salida>/prueba/`: archivos del test de velocidad de la página de claude.ai (se publican junto a ella).
- `node --test logic.test.mjs` pasa los tests de los cálculos y de la lectura de extractos (`test-data/`).

Lo que una web no puede hacer: leer la batería de los cascos, la señal WiFi en dBm, la temperatura o el
consumo de la batería. Eso solo está en la app Android.

## Publicada como app instalable

La carpeta `docs/` (en la raíz del repositorio) es la versión web ya generada. Con GitHub Pages
activado desde esa carpeta se abre en <https://alldesignkarl.github.io/Parte-3-frutas/> y Chrome la
instala como app (menú ⋮ → Instalar aplicación). Para actualizarla: `node build.mjs /tmp/salida` y
copiar `/tmp/salida/web/` en `docs/` (sin `vercel.json`).

La app instalada abre desde su copia guardada (al momento y sin internet). Cada build lleva su propia
versión en `sw.js`: al publicar, el móvil baja la nueva entera en segundo plano y se pone sola.
