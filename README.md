# Apuntes con Claude — vídeo explicativo

**[`apuntes-con-claude.mp4`](apuntes-con-claude.mp4)** · vertical 1080×1920 · 67 s · sin voz, solo texto animado y música suave.

Cuenta cómo al pedirle a Claude unos apuntes de la Unidad 1 me hizo una app para estudiar, y cómo funciona:

| Tiempo | Escena |
|---|---|
| 0:00 | Gancho: «Le pedí a Claude unos apuntes… y me hizo ESTO» |
| 0:04 | El mensaje que le pedí y la app que devolvió |
| 0:11 | Las 3 partes: Apuntes, Tarjetas, Juego |
| 0:15 | 📖 Apuntes: cada página resumida, colores, esquemas |
| 0:24 | 🃏 Tarjetas: pregunta → la tocas y se gira → «Me la sé» o «Repasar» |
| 0:35 | 🎮 Juego: 31 preguntas tipo test, te explica los fallos |
| 0:43 | ¿Cómo es posible? Claude escribe el código de la app |
| 0:51 | Lo que pasa por dentro, en 4 pasos |
| 0:57 | Por qué funciona para estudiar (recuerdo activo) |
| 1:02 | Cierre: «Pide una app para estudiar» + prompt para copiar |

## Cómo está hecho (`editor/`)

- `video.html`: todas las escenas y animaciones, controladas por tiempo.
- `render.cjs`: lo graba fotograma a fotograma con Chromium (Playwright).
- `music.py`: genera la música y los efectos por código (sin samples).
- `fuente/grabacion.mp4`: la grabación de pantalla original.
- `build.sh`: regenera el vídeo completo (`bash editor/build.sh`; necesita ffmpeg, node con playwright y python3 con numpy).
