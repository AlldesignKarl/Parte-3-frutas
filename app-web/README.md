# Mi Panel (versión web)

La misma app que `app-movil/`, pero como página web, para móviles donde no se pueden instalar APK
(por ejemplo, con Family Link). Pestañas: Estado (batería, el tiempo de tu zona con Open-Meteo, conexión
con ping y test de velocidad medidos, datos reales del móvil), Tareas (horario de clases con la de ahora y
la siguiente, plan de hoy, tu semana con racha, próximos exámenes), Foco (temporizador de estudio que suma
minutos y páginas, con sonido de fondo y la pantalla encendida mientras cuenta, y logros) y Notas (media,
evolución, media por asignatura y "¿qué necesito sacar?").

Samsung Internet aplica su propio modo oscuro aunque la página ya sea oscura: oscurece los degradados y
los fondos de colores vivos. Por eso los números, anillos, barras y gráficas van en colores lisos, y en
Samsung Internet los botones principales van en cristal con borde de color.

- `node build.mjs <salida>` genera dos versiones a partir del mismo código (necesita `esbuild`):
  - `<salida>/web/`: web instalable (PWA) con test de velocidad y Bluetooth, para alojar en cualquier
    hosting estático (GitHub Pages, Vercel…).
  - `<salida>/mi-panel.html`: página para claude.ai, que guarda las tareas y notas en la cuenta de Claude.
  - `<salida>/prueba/`: archivos del test de velocidad de la página de claude.ai (se publican junto a ella).
- `node --test logic.test.mjs` pasa los tests de los cálculos (los mismos que la app Android).

Lo que una web no puede hacer: leer la batería de los cascos, la señal WiFi en dBm, la temperatura o el
consumo de la batería. Eso solo está en la app Android.

## Publicada como app instalable

La carpeta `docs/` (en la raíz del repositorio) es la versión web ya generada. Con GitHub Pages
activado desde esa carpeta se abre en <https://alldesignkarl.github.io/Parte-3-frutas/> y Chrome la
instala como app (menú ⋮ → Instalar aplicación). Para actualizarla: `node build.mjs /tmp/salida` y
copiar `/tmp/salida/web/` en `docs/` (sin `vercel.json`).
