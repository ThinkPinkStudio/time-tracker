#!/usr/bin/env bash
set -euo pipefail

ASSETS="$(cd "$(dirname "$0")/../assets" && pwd)"
ICONSET="$(mktemp -d)/logo.iconset"
mkdir -p "$ICONSET"

for size in 16 32 128 256 512; do
  sips -z $size $size "$ASSETS/logo.png" --out "$ICONSET/icon_${size}x${size}.png"        >/dev/null
  dbl=$((size * 2))
  sips -z $dbl $dbl "$ASSETS/logo.png"  --out "$ICONSET/icon_${size}x${size}@2x.png"     >/dev/null
done

iconutil -c icns "$ICONSET" -o "$ASSETS/logo.icns"
echo "✓ assets/logo.icns"
rm -rf "$(dirname "$ICONSET")"
