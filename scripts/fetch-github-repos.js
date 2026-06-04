/**
 * fetch-github-repos.js
 *
 * 从 GitHub API 获取用户公开仓库信息，生成作品集数据文件。
 * 运行方式: node scripts/fetch-github-repos.js
 *
 * 缓存策略: 若 src/data/github-projects.json 存在且生成时间 < 1 小时，跳过刷新。
 * 错误处理: 网络失败时使用已有缓存数据，不阻塞构建。
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DATA_FILE = resolve(ROOT, 'src/data/github-projects.json')
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 天

// ============================================================
// 配置
// ============================================================

const GITHUB_USER = 'Mnting'

/** 排除这些仓库（精确匹配 name） */
const SKIP_REPOS = new Set([
  'Mnting.github.io', // 作品集本身
])

/** 语言 → Tailwind 渐变色映射 */
const LANGUAGE_COLOR_MAP = {
  TypeScript: 'from-blue-500/10 to-indigo-500/10',
  JavaScript: 'from-yellow-500/10 to-amber-500/10',
  Python: 'from-green-500/10 to-emerald-500/10',
  Rust: 'from-orange-500/10 to-red-500/10',
  Go: 'from-cyan-500/10 to-teal-500/10',
  'C#': 'from-purple-500/10 to-violet-500/10',
  'C++': 'from-pink-500/10 to-rose-500/10',
  CSS: 'from-sky-500/10 to-blue-500/10',
  HTML: 'from-orange-500/10 to-yellow-500/10',
  Java: 'from-red-500/10 to-orange-500/10',
  Kotlin: 'from-purple-500/10 to-pink-500/10',
  Swift: 'from-orange-500/10 to-red-500/10',
  Ruby: 'from-red-500/10 to-pink-500/10',
  PHP: 'from-indigo-500/10 to-purple-500/10',
  Dart: 'from-cyan-500/10 to-blue-500/10',
  Shell: 'from-gray-500/10 to-slate-500/10',
  Vue: 'from-emerald-500/10 to-green-500/10',
  Svelte: 'from-orange-500/10 to-amber-500/10',
  MDX: 'from-gray-500/10 to-slate-400/10',
  SCSS: 'from-pink-500/10 to-rose-400/10',
  Jupyter: 'from-orange-500/10 to-amber-500/10',
  Dockerfile: 'from-blue-500/10 to-cyan-500/10',
}

// ============================================================
// 工具函数
// ============================================================

function getColor(language) {
  return LANGUAGE_COLOR_MAP[language] || 'from-gray-500/10 to-gray-400/10'
}

function slugify(name) {
  return name.toLowerCase()
}

function titleFromRepoName(name) {
  return name
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function readExistingData() {
  try {
    const raw = readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function isCacheFresh(existing) {
  if (!existing?._generated) return false
  const age = Date.now() - new Date(existing._generated).getTime()
  return age < CACHE_TTL_MS
}

function ensureDir(filePath) {
  const dir = dirname(filePath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

// ============================================================
// 主逻辑
// ============================================================

async function main() {
  console.log('📡 获取 GitHub 仓库信息...')

  // 1. 检查缓存
  const existing = readExistingData()
  if (isCacheFresh(existing)) {
    const age = Math.round((Date.now() - new Date(existing._generated).getTime()) / 1000 / 60)
    console.log(`✅ 数据仍然新鲜（${age} 分钟前），跳过刷新`)
    console.log(`   ${existing.projects?.length || 0} 个项目已缓存`)
    return
  }

  // 2. 获取仓库列表
  let repos
  try {
    const headers = { 'User-Agent': 'Mnting-Portfolio/1.0' }
    const token = process.env.GITHUB_TOKEN
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const url = `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&type=owner&sort=updated`
    console.log(`   GET ${url}`)

    const res = await fetch(url, { headers })

    if (!res.ok) {
      throw new Error(`GitHub API 返回 ${res.status}: ${res.statusText}`)
    }

    repos = await res.json()
    console.log(`   获取到 ${repos.length} 个仓库`)
  } catch (err) {
    console.error(`⚠️  获取仓库列表失败: ${err.message}`)
    if (existing?.projects) {
      console.log(`   使用缓存数据（${existing.projects.length} 个项目）`)
    } else {
      console.log('   生成空数据文件')
      writeDataFile([])
    }
    return
  }

  // 3. 过滤
  const filtered = repos.filter((repo) => {
    if (repo.fork) {
      console.log(`   ⏭  跳过 fork: ${repo.name}`)
      return false
    }
    if (SKIP_REPOS.has(repo.name)) {
      console.log(`   ⏭  跳过排除列表: ${repo.name}`)
      return false
    }
    if (!repo.description) {
      console.log(`   ⏭  跳过无描述: ${repo.name}`)
      return false
    }
    return true
  })

  console.log(`   过滤后剩余 ${filtered.length} 个仓库`)

  // 4. 获取每个仓库的 README
  const projects = []
  for (const repo of filtered) {
    console.log(`   📄 ${repo.name} ...`)
    let readmeContent = ''

    try {
      const branch = repo.default_branch || 'main'
      const readmeUrl = `https://raw.githubusercontent.com/${GITHUB_USER}/${repo.name}/${branch}/README.md`

      const res = await fetch(readmeUrl)
      if (res.ok) {
        readmeContent = await res.text()
        console.log(`      ✅ README (${readmeContent.length} 字符)`)
      } else {
        // 尝试小写 readme.md
        const res2 = await fetch(
          `https://raw.githubusercontent.com/${GITHUB_USER}/${repo.name}/${branch}/readme.md`
        )
        if (res2.ok) {
          readmeContent = await res2.text()
          console.log(`      ✅ readme.md (${readmeContent.length} 字符)`)
        } else {
          console.log(`      ⚠️  无 README`)
        }
      }
    } catch (err) {
      console.log(`      ⚠️  获取 README 失败: ${err.message}`)
    }

    projects.push({
      slug: slugify(repo.name),
      title: titleFromRepoName(repo.name),
      description: repo.description || '',
      date: repo.pushed_at?.slice(0, 10) || undefined,
      tags: [...(repo.topics || []), repo.language].filter(Boolean),
      link: repo.homepage || undefined,
      github: repo.html_url,
      language: repo.language || undefined,
      stars: repo.stargazers_count,
      updatedAt: repo.updated_at || undefined,
      color: getColor(repo.language),
      rawContent: readmeContent,
    })
  }

  // 5. 写入数据文件
  writeDataFile(projects)
}

function writeDataFile(projects) {
  const data = {
    _generated: new Date().toISOString(),
    _source: 'github-api',
    projects,
  }

  ensureDir(DATA_FILE)
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2) + '\n', 'utf-8')
  console.log(`\n✅ 已写入 ${DATA_FILE} (${projects.length} 个项目)`)
}

main().catch((err) => {
  console.error('❌ 未预期的错误:', err)
  process.exitCode = 1
})
