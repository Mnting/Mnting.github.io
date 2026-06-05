#!/bin/bash
set -euo pipefail

# ============================================================
# Upload photography images to a separate image-hosting repo.
# Does NOT delete local images — cleanup happens in deploy.sh
# after the build step.
#
# Image hosting repo: https://github.com/Mnting/images
# Remote URL pattern:
#   https://raw.githubusercontent.com/Mnting/images/main/photography/{slug}.png
# ============================================================

IMAGE_REPO_URL="https://github.com/Mnting/images.git"
LOCAL_IMG_DIR="content/photography"
REMOTE_SUBDIR="photography"

# Supported image extensions (must match markdown.ts glob + .gitignore)
EXTS=("png" "jpg" "jpeg" "webp" "gif" "avif")

# ============================================================
# 1. Discover local image files
# ============================================================
IMAGE_FILES=()
for ext in "${EXTS[@]}"; do
  for f in "$LOCAL_IMG_DIR"/*."$ext"; do
    [ -f "$f" ] && IMAGE_FILES+=("$f")
  done
done

if [ ${#IMAGE_FILES[@]} -eq 0 ]; then
  echo "[upload-images] no local images found, skipping"
  exit 0
fi

echo "[upload-images] found ${#IMAGE_FILES[@]} image(s) to upload"

# ============================================================
# 2. Clone image hosting repo into a temporary directory
# ============================================================
WORK_DIR=$(mktemp -d)
cleanup() {
  echo "[upload-images] cleaning up temp dir"
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

echo "[upload-images] cloning $IMAGE_REPO_URL ..."
if ! git clone --depth 1 "$IMAGE_REPO_URL" "$WORK_DIR" 2>/dev/null; then
  echo "[upload-images] ERROR: failed to clone $IMAGE_REPO_URL"
  echo "  Make sure the repo exists and is public: https://github.com/Mnting/images"
  exit 1
fi

mkdir -p "$WORK_DIR/$REMOTE_SUBDIR"

# ============================================================
# 3. Copy images into the cloned repo
# ============================================================
echo "[upload-images] copying images ..."
cp "${IMAGE_FILES[@]}" "$WORK_DIR/$REMOTE_SUBDIR/"

cd "$WORK_DIR"

# ============================================================
# 4. Commit & push (only if there are changes)
# ============================================================
git add -A

if git diff --cached --quiet && git diff --quiet; then
  echo "[upload-images] image repo is already up to date"
  cd - > /dev/null
  exit 0
fi

echo "[upload-images] committing ..."
git commit -m "upload: photography images $(date +%Y-%m-%d)"

echo "[upload-images] pushing ..."
if ! git push origin main; then
  echo "[upload-images] ERROR: push failed — fix the issue and re-run"
  cd - > /dev/null
  exit 1
fi

echo "[upload-images] push successful — ${#IMAGE_FILES[@]} image(s) uploaded"
cd - > /dev/null
