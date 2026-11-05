#!/usr/bin/env bash
# Slices a source video (the laptop-opening clip) into the two WebP frame sets
# FrameSequenceHero.tsx expects:
#   public/frames/d/f_001.webp ... f_060.webp   (desktop, 1280px wide)
#   public/frames/m/f_001.webp ... f_060.webp   (mobile,    720px wide)
#
# Usage: ./scripts/extract-frames.sh path/to/laptop-reveal.mp4
# Requires ffmpeg (with libwebp) and ffprobe.

set -euo pipefail

INPUT="${1:?Usage: ./scripts/extract-frames.sh <input-video>}"
FRAME_COUNT=60   # must match FRAME_COUNT in FrameSequenceHero.tsx

DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$INPUT")
FPS=$(awk -v c="$FRAME_COUNT" -v d="$DURATION" 'BEGIN { printf "%.6f", c / d }')

for SET in "d:1280:72" "m:720:68"; do
  IFS=: read -r NAME WIDTH QUALITY <<< "$SET"
  OUT="public/frames/$NAME"
  mkdir -p "$OUT"
  rm -f "$OUT"/f_*.webp
  ffmpeg -y -i "$INPUT" \
    -vf "fps=${FPS},scale=${WIDTH}:-1:flags=lanczos" \
    -vframes "$FRAME_COUNT" -c:v libwebp -quality "$QUALITY" -compression_level 6 \
    "$OUT/f_%03d.webp"
done

echo "Done: $(ls public/frames/d | wc -l) desktop + $(ls public/frames/m | wc -l) mobile frames."
