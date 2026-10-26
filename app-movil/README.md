# Mi Panel (app Android personal)

App para tu móvil Android con tres pestañas:

- **Estado**: batería exacta (porcentaje, cargando o no, tiempo estimado, temperatura, voltaje,
  consumo, salud y ciclos), cascos y demás dispositivos Bluetooth conectados con su batería,
  WiFi (calidad de la señal, dBm, banda, canal, tipo de WiFi, velocidad del enlace, si hay internet),
  test de velocidad (ping, bajada y subida) y almacenamiento/RAM del móvil.
- **Tareas**: lista de tareas. Si es de estudiar, pones el día del examen y las páginas; vas sumando
  las que estudias (+1, +5, +10 o el número exacto) y te dice cuántas tocan al día y cuántas llevas hoy.
  Cuando llegas al total te avisa al momento con una celebración. Recordatorio diario opcional.
- **Notas**: apuntas notas por asignatura y calcula la media de cada una (un 4 y un 5 → 4,5),
  con una gráfica de todas las asignaturas y la media general.

Todo se guarda solo en el móvil (no hay cuentas ni servidores). Desde el menú ⋮ de Tareas o Notas
puedes guardar una copia de seguridad en un archivo y recuperarla.

## Instalar

1. Desde el móvil, abre la versión publicada en GitHub:
   <https://github.com/AlldesignKarl/Parte-3-frutas/releases/tag/mi-panel>
2. Descarga `MiPanel.apk` y ábrelo. La primera vez Android pedirá permitir instalar apps de esa
   fuente (el navegador o "Archivos").
3. Para actualizar a una versión nueva: primero guarda una copia (menú ⋮ de Tareas o Notas >
   Copia de seguridad > Guardar copia), instala el APK nuevo y, si Android pide desinstalar la
   anterior, recupera la copia después desde el mismo menú.

La primera vez que abras la pestaña Estado, dale a "Dar permiso" en Cascos y Bluetooth
(permiso de "Dispositivos cercanos"). El permiso de ubicación solo se usa para ver el nombre de la WiFi.

### Sobre la batería de los cascos

Android solo sabe la batería de los cascos que se la comunican (la misma que sale en
Ajustes > Bluetooth). Si un modelo no la manda, la app lo indica como "batería no disponible".

## Cómo se compila

GitHub Actions (`.github/workflows/app-movil.yml`) compila el APK en cada cambio de esta carpeta,
pasa los tests, guarda capturas de pantalla de cada pestaña y publica el APK en la versión `mi-panel`.

En local: `./gradlew assembleRelease` (necesita el SDK de Android y JDK 17).

### Firma del APK

La clave de firma no se guarda en el repositorio (es público). Si no hay secretos configurados,
cada compilación usa una clave temporal, y por eso al actualizar puede que Android pida desinstalar
la versión anterior (de ahí la copia de seguridad). Para que las actualizaciones se instalen encima
sin más, se puede crear una clave una vez y guardarla en los secretos del repositorio
(Settings > Secrets and variables > Actions) como `MIPANEL_KEYSTORE_B64` (el archivo .p12 en base64,
con alias `mipanel`) y `MIPANEL_KEYSTORE_PASSWORD`.
