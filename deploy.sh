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

# 2. 构建项目
echo ""
echo "🔨 构建项目..."
npm run build

# 3. 提交代码到 main（包含 github-projects.json 更新 + 其他内容变更）
echo ""
echo "📝 提交代码到 main..."
git add -A
if git diff --cached --quiet; then
  echo "⚠️  没有新改动，跳过提交"
else
  git commit -m "chore: update site content"
fi

# 4. 推送 main 分支
echo ""
echo "📤 推送 main 分支..."
git push origin main

# 5. 部署到 GitHub Pages（直接调用 gh-pages，避免 npm predeploy 重复构建）
echo ""
echo "📦 发布到 GitHub Pages..."
npx gh-pages -d dist --dotfiles

echo ""
echo "✅ 完成！访问 https://mnting.github.io 查看"
