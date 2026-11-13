#!/usr/bin/env bash
# Regenerates the trigger thumbnails in static/photos/thumbs (800px on the
# long edge, the size the landing grid tiles render at on a 2x screen).
# Photos come from the original ramka docs (Unsplash license via picsum.photos).
set -euo pipefail
cd "$(dirname "$0")/../static/photos"
mkdir -p thumbs
for f in *.jpg; do
  magick "$f" -resize '800x800>' -strip -quality 82 "thumbs/$f"
done
