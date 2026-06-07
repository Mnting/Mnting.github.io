#!/bin/bash
set -euo pipefail

# ============================================================
# Copy photography media files to dist/assets/ for deployment.
# Served via GitHub Pages at:
#   https://mnting.github.io/assets/{filename}
#
# Runs AFTER `npm run build` (build wipes dist/).
# Files > 100MB are skipped (GitHub limit).
# ============================================================

LOCAL_DIR="content/photography"
DIST_DIR="dist/assets"
MAX_SIZE_MB=100

# Supported image extensions (case-insensitive handled in loop)
EXTS=("png" "PNG" "jpg" "JPG" "jpeg" "JPEG" "webp" "WEBP" "gif" "GIF" "avif" "AVIF")

# ============================================================
# 1. Ensure dist/assets/ exists
# ============================================================
if [ ! -d "$DIST_DIR" ]; then
  echo "[copy-media] ERROR: $DIST_DIR not found — run 'npm run build' first"
  exit 1
fi

# ============================================================
# 2. Discover local media files
# ============================================================
FILES=()
SKIPPED=()
for ext in "${EXTS[@]}"; do
  for f in "$LOCAL_DIR"/*."$ext"; do
    [ -f "$f" ] || continue
    size_mb=$(du -m "$f" | cut -f1)
    if [ "$size_mb" -gt "$MAX_SIZE_MB" ]; then
      SKIPPED+=("$(basename "$f") (${size_mb}MB)")
    else
      FILES+=("$f")
    fi
  done
done

if [ ${#FILES[@]} -eq 0 ] && [ ${#SKIPPED[@]} -eq 0 ]; then
  echo "[copy-media] no local media found, skipping"
  exit 0
fi

# ============================================================
# 3. Copy files to dist/assets/ (skip oversized)
# ============================================================
if [ ${#FILES[@]} -gt 0 ]; then
  echo "[copy-media] copying ${#FILES[@]} file(s) to $DIST_DIR ..."
  cp "${FILES[@]}" "$DIST_DIR/"
  echo "[copy-media] done — ${#FILES[@]} file(s) copied"
fi

if [ ${#SKIPPED[@]} -gt 0 ]; then
  echo "[copy-media] ⚠️  ${#SKIPPED[@]} file(s) skipped (exceed ${MAX_SIZE_MB}MB limit):"
  for s in "${SKIPPED[@]}"; do
    echo "   - $s"
  done
  echo "[copy-media] 💡 安装 ffmpeg 可自动压缩视频: brew install ffmpeg"
fi
