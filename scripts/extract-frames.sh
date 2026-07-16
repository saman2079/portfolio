#!/usr/bin/env bash
# Slices a source video (the rendered/AI-generated laptop-opening clip) into
# the numbered WebP frame sequence FrameSequenceHero.tsx expects.
#
# Usage:
#   ./scripts/extract-frames.sh path/to/laptop-reveal.mp4
#
# Requires ffmpeg: https://ffmpeg.org/download.html

set -euo pipefail

INPUT="${1:?Usage: ./scripts/extract-frames.sh <input-video>}"
OUT_DIR="public/frames"
FRAME_COUNT=120     # must match FRAME_COUNT in FrameSequenceHero.tsx
WIDTH=1600           # downscale for web delivery; raise for a sharper hero

mkdir -p "$OUT_DIR"
rm -f "$OUT_DIR"/frame_*.webp

# Read the source clip's duration and compute the fps needed to land exactly
# FRAME_COUNT frames, so frame_0001..frame_0120 always exist regardless of
# the source clip's length or original frame rate.
DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$INPUT")
FPS=$(awk -v c="$FRAME_COUNT" -v d="$DURATION" 'BEGIN { printf "%.6f", c / d }')

ffmpeg -y -i "$INPUT" \
  -vf "fps=${FPS},scale=${WIDTH}:-1:flags=lanczos" \
  -vframes "$FRAME_COUNT" \
  -q:v 80 \
  "$OUT_DIR/frame_%04d.webp"

echo "Done. $(ls "$OUT_DIR"/frame_*.webp | wc -l) frames written to $OUT_DIR/"
