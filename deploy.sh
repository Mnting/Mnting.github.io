#!/bin/bash
set -e

echo "🚀 开始部署..."

# 1. 提交代码
echo ""
echo "📝 提交代码到 main..."
git add -A
git commit -m "chore: update site content" || echo "⚠️  没有新改动，跳过提交"

# 2. 推送 main
echo ""
echo "📤 推送 main 分支..."
git push origin main

# 3. 构建 + 部署到 gh-pages
echo ""
echo "🔨 构建并发布到 GitHub Pages..."
npm run deploy

echo ""
echo "✅ 完成！访问 https://mnting.github.io 查看"
