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

/**
 * 从 README 内容中提取描述
 * 取第一个非标题、非图片、非代码块的有效段落，最长 150 字
 */
function extractDescriptionFromReadme(readme) {
  if (!readme) return ''
  const lines = readme.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('#')) continue
    if (trimmed.startsWith('>')) return trimmed.replace(/^>\s*/, '')
    if (trimmed.startsWith('![')) continue
    if (trimmed.startsWith('```')) continue
    if (trimmed.length > 10) return trimmed.length > 150 ? trimmed.slice(0, 150) + '...' : trimmed
  }
  return ''
}

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

/**
 * 获取仓库 README 内容
 * 1. 先尝试 raw 直链（公开仓库，无需认证）
 * 2. 失败后用 GitHub API（私有仓库需要认证，返回 base64）
 */
const FETCH_TIMEOUT = 10_000 // 10 秒超时

async function fetchReadme(repoName, branch, token) {
  // 尝试 raw 直链
  const rawUrl = `https://raw.githubusercontent.com/${GITHUB_USER}/${repoName}/${branch}/README.md`
  try {
    let res = await fetch(rawUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT) })
    if (res.ok) return await res.text()
  } catch {}

  // 尝试小写
  try {
    let res = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${repoName}/${branch}/readme.md`, { signal: AbortSignal.timeout(FETCH_TIMEOUT) })
    if (res.ok) return await res.text()
  } catch {}

  // 通过 API 获取（支持私有仓库）
  if (!token) return null

  try {
    const apiHeaders = {
      'User-Agent': 'Mnting-Portfolio/1.0',
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    }
    const apiRes = await fetch(
      `https://api.github.com/repos/${GITHUB_USER}/${repoName}/readme`,
      { headers: apiHeaders, signal: AbortSignal.timeout(FETCH_TIMEOUT) }
    )
    if (apiRes.ok) {
      const data = await apiRes.json()
      if (data.encoding === 'base64' && data.content) {
        return Buffer.from(data.content, 'base64').toString('utf-8')
      }
    }
  } catch {}

  return null
}

// ============================================================
// 主逻辑
// ============================================================

async function main() {
  console.log('📡 获取 GitHub 仓库信息...')

  const token = process.env.GITHUB_TOKEN

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
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
      console.log('   🔐 已检测到 GITHUB_TOKEN，将获取私有仓库')
    } else {
      console.log('   💡 提示：设置 GITHUB_TOKEN 环境变量可获取私有仓库')
      console.log('      1. 创建 token: https://github.com/settings/tokens (勾选 repo 权限)')
      console.log('      2. export GITHUB_TOKEN=ghp_xxxx')
    }

    // /user/repos 返回认证用户的所有仓库（含私有），/users/:user/repos 只返回公开
    const url = token
      ? `https://api.github.com/user/repos?per_page=100&type=owner&sort=updated`
      : `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&type=owner&sort=updated`
    console.log(`   GET ${url}`)

    const res = await fetch(url, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT) })

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
      readmeContent = await fetchReadme(repo.name, branch, token)
      if (readmeContent) {
        console.log(`      ✅ README (${readmeContent.length} 字符)`)
      } else {
        console.log(`      ⚠️  无 README`)
      }
    } catch (err) {
      console.log(`      ⚠️  获取 README 失败: ${err.message}`)
    }

    projects.push({
      slug: slugify(repo.name),
      title: titleFromRepoName(repo.name),
      description: repo.description || extractDescriptionFromReadme(readmeContent),
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
