# Mi Panel (versión web)

La misma app que `app-movil/`, pero como página web, para móviles donde no se pueden instalar APK
(por ejemplo, con Family Link). Pestañas: Estado (batería, conexión con ping y test de velocidad medidos,
datos reales del móvil), Tareas (plan de hoy, tu semana con racha, próximos exámenes), Foco (temporizador
de estudio que suma minutos y páginas) y Notas (media, evolución, media por asignatura y "¿qué necesito
sacar?").

- `node build.mjs <salida>` genera dos versiones a partir del mismo código (necesita `esbuild`):
  - `<salida>/web/`: web instalable (PWA) con test de velocidad y Bluetooth, para alojar en cualquier
    hosting estático (GitHub Pages, Vercel…).
  - `<salida>/mi-panel.html`: página para claude.ai, que guarda las tareas y notas en la cuenta de Claude.
  - `<salida>/prueba/`: archivos del test de velocidad de la página de claude.ai (se publican junto a ella).
- `node --test logic.test.mjs` pasa los tests de los cálculos (los mismos que la app Android).

Lo que una web no puede hacer: leer la batería de los cascos, la señal WiFi en dBm, la temperatura o el
consumo de la batería. Eso solo está en la app Android.
