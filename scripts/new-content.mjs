#!/usr/bin/env node
import { writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const USAGE = `
用法: node scripts/new-content.mjs <type> <title>

  type   : product | blog | photography
  title  : 文章标题（用引号包裹）

示例:
  node scripts/new-content.mjs product "GreyRhino 致用户"
  node scripts/new-content.mjs blog "我的新文章"
  node scripts/new-content.mjs photography "日落海滩"
`

const TEMPLATES = {
  product: (title, date, slug) => `---
title: ${title}
date: ${date}
description:
---

# ${title}

`,
  blog: (title, date, slug) => `---
title: ${title}
date: ${date}
excerpt:
category: 未分类
---

# ${title}

`,
  photography: (title, date, slug) => `---
title: ${title}
date: ${date}
location:
image: https://mnting.github.io/assets/${slug}.png
order: 999
---

`,
}

const type = process.argv[2]
const title = process.argv[3]

if (!type || !title) {
  console.log(USAGE)
  process.exit(1)
}

if (!TEMPLATES[type]) {
  console.error(`❌ 未知类型 "${type}"，可选: product | blog | photography`)
  process.exit(1)
}

const today = new Date().toISOString().slice(0, 10)
const slug = title.replace(/[^\w一-鿿]+/g, '-').replace(/^-|-$/g, '')
const filename = `${slug}.md`
const filepath = join(ROOT, 'content', type, filename)

if (existsSync(filepath)) {
  console.error(`❌ 文件已存在: content/${type}/${filename}`)
  process.exit(1)
}

const content = TEMPLATES[type](title, today, slug)
writeFileSync(filepath, content, 'utf-8')

console.log(`✅ 已创建: content/${type}/${filename}`)
console.log(`   标题: ${title}`)
console.log(`   日期: ${today}`)
