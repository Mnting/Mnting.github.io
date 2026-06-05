npm run ship
即可一键配置

---
  方式一：命令行（推荐，一键创建文件）
  
  npm run new:product "GreyRhino 致用户"   # 创建产品文档
  npm run new:blog "我的新文章"             # 创建博客文章
  npm run new:photo "日落海滩"              # 创建摄影条目

  脚本会自动生成文件名（中文转拼音slug）、填好当天的日期和完整
  frontmatter：

  content/product/GreyRhino致用户.md
  ---
  title: GreyRhino 致用户
  date: 2026-06-05
  description:
  ---

  # GreyRhino 致用户

  方式二：VS Code 代码片段（文件内手动触发）

  在任意 .md 文件中输入以下前缀，然后按 Tab 即可展开：

  ┌──────┬──────┐
  │  前缀   │     用途     │
  ├─────────┼──────────────┤
  │ product │ 产品文档模板 │
  ├─────────┼──────────────┤
  │ blog    │ 博客文章模板 │
  ├─────────┼─────────────────────┤
  │ photo   │ 摄影条目模板        │
  ├─────────┼─────────────────────┤
  │ fm      │ 通用 frontmatter 块 │
  └─────────┴─────────────────────┘

  ---

  ▎ 💡 两种方式会自动填入当天日期，你只需修改标题和描述即可。之后
  ▎ 再也不用担心忘记写 frontmatter 了。