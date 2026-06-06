#!/bin/bash
set -e

# 配置代理（解决国内网络连接 GitHub 超时问题）
export https_proxy=http://127.0.0.1:15236
export http_proxy=http://127.0.0.1:15236

echo "🚀 开始部署..."

# 1. 获取最新 GitHub 仓库数据
echo ""
echo "📡 获取 GitHub 仓库信息..."
node scripts/fetch-github-repos.js

# 2. 压缩大文件（图片 >10MB / 视频 >50MB）
echo ""
echo "🗜️  检查并压缩大文件..."
bash scripts/compress-media.sh

# 3. 构建项目
echo ""
echo "🔨 构建项目..."
npm run build

# 4. 复制摄影图片到 dist/assets/（随 gh-pages 一起部署）
echo ""
echo "🖼️  复制图片到 dist/assets/..."
bash scripts/upload-images.sh

# 5. 删除本地图片（已复制到 dist/assets/，随部署上线）
echo ""
echo "🗑️  清理本地图片..."
rm -f content/photography/*.png content/photography/*.jpg content/photography/*.jpeg content/photography/*.webp content/photography/*.gif content/photography/*.avif content/photography/*.mp4 content/photography/*.mov content/photography/*.avi content/photography/*.mkv 2>/dev/null || true

# 6. 提交代码到 main（包含 github-projects.json 更新 + 其他内容变更）
echo ""
echo "📝 提交代码到 main..."
git add -A
if git diff --cached --quiet; then
  echo "⚠️  没有新改动，跳过提交"
else
  git commit -m "chore: update site content"
fi

# 7. 推送 main 分支
echo ""
echo "📤 推送 main 分支..."
git push origin main

# 8. 部署到 GitHub Pages（--add：只增不删，保护远端已有的图片不被覆盖）
echo ""
echo "📦 发布到 GitHub Pages..."
npx gh-pages -d dist --dotfiles --add

# 9. 清理 dist/assets/ 中的临时图片（已部署到 gh-pages，释放本地空间）
echo ""
echo "🧹 清理 dist/assets/ 临时图片..."
rm -f dist/assets/*.png dist/assets/*.PNG dist/assets/*.jpg dist/assets/*.JPG dist/assets/*.jpeg dist/assets/*.JPEG dist/assets/*.webp dist/assets/*.WEBP dist/assets/*.gif dist/assets/*.GIF dist/assets/*.avif dist/assets/*.AVIF dist/assets/*.mp4 dist/assets/*.MP4 dist/assets/*.mov dist/assets/*.MOV dist/assets/*.avi dist/assets/*.AVI dist/assets/*.mkv dist/assets/*.MKV 2>/dev/null || true

echo ""
echo "✅ 完成！访问 https://mnting.github.io 查看"
