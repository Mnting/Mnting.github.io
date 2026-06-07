#!/bin/bash
set -euo pipefail

# ============================================================
# Compress large images in content/photography/ before deploy.
# Uses sips (macOS built-in) — resize if > 10MB
# ============================================================

LOCAL_DIR="content/photography"
SIZE_THRESHOLD_MB=10
MAX_DIMENSION=2560 # max width/height

echo "[compress] checking image sizes (threshold: ${SIZE_THRESHOLD_MB}MB) ..."
for ext in png PNG jpg JPG jpeg JPEG; do
  for f in "$LOCAL_DIR"/*."$ext"; do
    [ -f "$f" ] || continue
    size_mb=$(du -m "$f" | cut -f1)
    if [ "$size_mb" -gt "$SIZE_THRESHOLD_MB" ]; then
      echo "   🖼️  压缩图片: $(basename "$f") (${size_mb}MB)"
      sips -Z "$MAX_DIMENSION" "$f" > /dev/null 2>&1
      new_size=$(du -m "$f" | cut -f1)
      echo "      → ${new_size}MB"
    fi
  done
done

echo "[compress] done"
