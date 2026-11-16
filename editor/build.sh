#!/usr/bin/env bash
# Regenera ../apuntes-con-claude.mp4 a partir de la grabación.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p .cache/frames
ffmpeg -v error -y -i fuente/grabacion.mp4 -vf fps=30 -q:v 2 .cache/frames/f_%04d.jpg
python3 music.py .cache/musica.wav
rm -rf .cache/out && node render.cjs --workers 4
ffmpeg -v error -y -framerate 30 -i .cache/out/f_%05d.jpg -i .cache/musica.wav -filter:a "volume=-2.5dB" \
  -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -profile:v high -c:a aac -b:a 192k -shortest \
  -movflags +faststart ../apuntes-con-claude.mp4
echo "Listo: apuntes-con-claude.mp4"
