// ============================================================
// Portfolio — 合并 GitHub API 数据 + 手动 markdown 文件
// ============================================================

import { parseSlug, parseFrontmatter, extractTitle, extractDescription } from './markdown'
import githubData from '../data/github-projects.json'

// ============================================================
// 类型定义
// ============================================================

export interface PortfolioProject {
  slug: string
  title: string
  description: string
  date?: string
  tags: string[]
  link?: string
  github?: string
  color: string
  rawContent: string
}

// ============================================================
// 来源 1: GitHub API 自动生成的数据
// ============================================================

function parseGithubProjects(): PortfolioProject[] {
  if (!githubData?.projects || !Array.isArray(githubData.projects)) return []
  return githubData.projects as PortfolioProject[]
}

// ============================================================
// 来源 2: 手动编写的 content/portfolio/*.md 文件
// ============================================================

const manualModules = import.meta.glob('../../content/portfolio/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function parseManualProjects(): PortfolioProject[] {
  return Object.entries(manualModules).map(([filepath, content]) => {
    const slug = parseSlug(filepath)
    const { data, content: body } = parseFrontmatter(content)

    return {
      slug,
      title: data.title || extractTitle(content),
      description: data.description || extractDescription(content),
      date: data.date || undefined,
      tags: data.tags || [],
      link: data.link || undefined,
      github: data.github || undefined,
      color: data.color || 'from-gray-500/10 to-gray-400/10',
      rawContent: body || content,
    }
  })
}

// ============================================================
// 合并: 手动 .md 文件按 slug 覆盖 GitHub 数据
// ============================================================

function mergeProjects(): PortfolioProject[] {
  const github = parseGithubProjects()
  const manual = parseManualProjects()

  const merged: Record<string, PortfolioProject> = {}

  // 先插入 GitHub 项目
  for (const p of github) {
    merged[p.slug] = p
  }

  // 手动条目覆盖同 slug 的 GitHub 数据（或新增）
  for (const p of manual) {
    merged[p.slug] = p
  }

  return Object.values(merged).sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date)
    if (a.date) return -1
    if (b.date) return 1
    return a.slug.localeCompare(b.slug)
  })
}

// ============================================================
// 导出
// ============================================================

export const portfolioProjects: PortfolioProject[] = mergeProjects()

export const portfolioBySlug: Record<string, PortfolioProject> = {}
for (const project of portfolioProjects) {
  portfolioBySlug[project.slug] = project
}
