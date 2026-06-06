#!/bin/bash
set -euo pipefail

# ============================================================
# Compress large media files in content/photography/ before deploy.
# Images: use sips (macOS built-in) — resize if > 10MB
# Videos: use ffmpeg if available — compress if > 50MB
# ============================================================

LOCAL_DIR="content/photography"
IMAGE_SIZE_THRESHOLD_MB=10
VIDEO_SIZE_THRESHOLD_MB=50
MAX_DIMENSION=2560 # max width/height for images

# ============================================================
# 1. Compress large images (sips — always available on macOS)
# ============================================================
echo "[compress] checking image sizes (threshold: ${IMAGE_SIZE_THRESHOLD_MB}MB) ..."
for ext in png PNG jpg JPG jpeg JPEG; do
  for f in "$LOCAL_DIR"/*."$ext"; do
    [ -f "$f" ] || continue
    size_mb=$(du -m "$f" | cut -f1)
    if [ "$size_mb" -gt "$IMAGE_SIZE_THRESHOLD_MB" ]; then
      echo "   🖼️  压缩图片: $(basename "$f") (${size_mb}MB)"
      sips -Z "$MAX_DIMENSION" "$f" > /dev/null 2>&1
      new_size=$(du -m "$f" | cut -f1)
      echo "      → ${new_size}MB"
    fi
  done
done

# ============================================================
# 2. Compress large videos (ffmpeg required)
# ============================================================
echo "[compress] checking video sizes (threshold: ${VIDEO_SIZE_THRESHOLD_MB}MB) ..."
if command -v ffmpeg &> /dev/null; then
  for ext in mp4 MP4 mov MOV avi AVI mkv MKV; do
    for f in "$LOCAL_DIR"/*."$ext"; do
      [ -f "$f" ] || continue
      size_mb=$(du -m "$f" | cut -f1)
      if [ "$size_mb" -gt "$VIDEO_SIZE_THRESHOLD_MB" ]; then
        echo "   🎬 压缩视频: $(basename "$f") (${size_mb}MB)"
        tmp="${f}.tmp.${ext}"
        ffmpeg -i "$f" -vcodec h264 -crf 28 -preset fast -an "$tmp" -y > /dev/null 2>&1
        mv "$tmp" "$f"
        new_size=$(du -m "$f" | cut -f1)
        echo "      → ${new_size}MB"
      fi
    done
  done
else
  # Check for large videos and warn
  for ext in mp4 MP4 mov MOV avi AVI mkv MKV; do
    for f in "$LOCAL_DIR"/*."$ext"; do
      [ -f "$f" ] || continue
      size_mb=$(du -m "$f" | cut -f1)
      if [ "$size_mb" -gt "$VIDEO_SIZE_THRESHOLD_MB" ]; then
        echo "   ⚠️  $(basename "$f") ${size_mb}MB 超过 GitHub 100MB 限制"
        echo "      安装 ffmpeg 可自动压缩: brew install ffmpeg"
      fi
    done
  done
fi

echo "[compress] done"
