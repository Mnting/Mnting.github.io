#!/bin/bash
set -euo pipefail

# ============================================================
# Copy photography images to dist/assets/ for deployment.
# Images are served via GitHub Pages at:
#   https://mnting.github.io/assets/{slug}.png
#
# This script runs AFTER `npm run build` because build wipes
# the dist/ directory.  Local images in content/photography/
# are deleted later by deploy.sh — do NOT delete them here.
# ============================================================

LOCAL_IMG_DIR="content/photography"
DIST_ASSETS_DIR="dist/assets"

# Supported image extensions
EXTS=("png" "jpg" "jpeg" "webp" "gif" "avif")

# ============================================================
# 1. Ensure dist/assets/ exists
# ============================================================
if [ ! -d "$DIST_ASSETS_DIR" ]; then
  echo "[copy-images] ERROR: $DIST_ASSETS_DIR not found — run 'npm run build' first"
  exit 1
fi

# ============================================================
# 2. Discover local image files
# ============================================================
IMAGE_FILES=()
for ext in "${EXTS[@]}"; do
  for f in "$LOCAL_IMG_DIR"/*."$ext"; do
    [ -f "$f" ] && IMAGE_FILES+=("$f")
  done
done

if [ ${#IMAGE_FILES[@]} -eq 0 ]; then
  echo "[copy-images] no local images found, skipping"
  exit 0
fi

echo "[copy-images] found ${#IMAGE_FILES[@]} image(s), copying to $DIST_ASSETS_DIR ..."

# ============================================================
# 3. Copy images into dist/assets/
# ============================================================
cp "${IMAGE_FILES[@]}" "$DIST_ASSETS_DIR/"

echo "[copy-images] done — ${#IMAGE_FILES[@]} image(s) copied to $DIST_ASSETS_DIR"
