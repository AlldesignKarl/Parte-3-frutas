# Mi Panel (app Android)

La app Android es la misma Mi Panel que se instala desde el navegador (carpeta `docs/`, servida en
raw.githack.com): la muestra en una vista web, así que se actualiza sola, y le añade lo que una web no
puede hacer:

- **Mensajes y llamadas perdidas**: con «Acceso a notificaciones», lee los avisos de WhatsApp,
  Discord, Telegram, Instagram, Snapchat y Mensajes (SMS), y las llamadas perdidas (del teléfono y de
  WhatsApp). Se guardan solo en el móvil (`mensajes/`), los 300 últimos. Al tocar uno se abre la
  conversación.
- **Linterna** con el flash (sigue encendida aunque salgas de la app).
- **Batería de los cascos** Bluetooth (la que sale en Ajustes > Bluetooth).
- Pantalla encendida con el temporizador, copia de seguridad en Descargas y compartir un extracto
  de Revolut con Mi Panel.

La página llama a `window.MiPanelAndroid` (`WebBridge.kt`), que solo responde si lo que se muestra es
Mi Panel (https, raw.githack.com y la carpeta `docs/` de esta rama). Cualquier otro enlace se abre en el
navegador.

## Compilar

GitHub Actions (`.github/workflows/app-movil.yml`) compila el APK, pasa los tests (Robolectric) y lo
publica en la versión `mi-panel` del repositorio. En local: `./gradlew assembleRelease testDebugUnitTest`.

La firma sale de los secretos `MIPANEL_KEYSTORE_B64` y `MIPANEL_KEYSTORE_PASSWORD`. Sin ellos se usa una
clave temporal en cada compilación: entonces, para pasar a una versión nueva del APK hay que desinstalar
la anterior (guarda antes una copia de seguridad desde la app).

## Instalar en un móvil con Family Link

1. Quien gestiona Family Link permite **apps de fuentes desconocidas** para ese móvil (app Family Link →
   el perfil → el dispositivo → ajustes).
2. Descargar `MiPanel.apk` de la versión `mi-panel` y abrirlo.
3. En Mi Panel → Inicio → **Mensajes** → «Dar acceso». Si Android dice «Ajuste restringido»: Ajustes →
   Aplicaciones → Mi Panel → ⋮ → **Permitir ajustes restringidos**, y volver a darle acceso.
