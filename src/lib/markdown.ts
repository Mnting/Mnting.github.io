// ============================================================
// Simple browser-compatible frontmatter parser
// (replaces gray-matter to avoid Node.js Buffer dependency)
// ============================================================

interface FrontmatterResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
  content: string
}

export function parseFrontmatter(raw: string): FrontmatterResult {
  if (!raw.startsWith('---\n') && !raw.startsWith('---\r\n')) {
    return { data: {}, content: raw }
  }

  const endMatch = raw.match(/\n---\s*\n/)
  if (!endMatch) {
    return { data: {}, content: raw }
  }

  const endIndex = endMatch.index!
  const fmBlock = raw.slice(4, endIndex) // skip opening "---\n"
  const body = raw.slice(endIndex + endMatch[0].length)

  const data: Record<string, unknown> = {}
  const lines = fmBlock.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const match = line.match(/^(\w[\w-]*):\s*(.*)/)
    if (match) {
      const key = match[1]
      const value = match[2].trim()
      // Check if next lines are indented list items
      if (i + 1 < lines.length && /^\s{2,}-\s/.test(lines[i + 1])) {
        const arr: string[] = []
        if (value) arr.push(value)
        i++
        while (i < lines.length && /^\s{2,}-\s/.test(lines[i])) {
          arr.push(lines[i].replace(/^\s{2,}-\s*/, ''))
          i++
        }
        data[key] = arr
        continue
      }
      // Inline array: [a, b, c]
      if (value.startsWith('[') && value.endsWith(']')) {
        data[key] = value.slice(1, -1).split(',').map((s) => s.trim())
      } else if (value === 'true' || value === 'false') {
        data[key] = value === 'true'
      } else if (/^-?\d+(\.\d+)?$/.test(value)) {
        data[key] = parseFloat(value)
      } else {
        data[key] = value
      }
    }
    i++
  }

  return { data, content: body }
}

// Type compatible with what gray-matter returned
const matter = (input: string): FrontmatterResult => parseFrontmatter(input)

// ============================================================
// Shared helpers
// ============================================================

/** Extract slug from filepath: /path/to/foo.md -> foo, /path/to/bar.png -> bar */
export function parseSlug(filepath: string): string {
  return filepath.replace(/^.*\//, '').replace(/\.(md|png|jpe?g|webp|gif|avif)$/, '')
}

/** Extract title from H1 heading */
export function extractTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : 'Untitled'
}

/** Extract description from first blockquote or non-empty paragraph */
export function extractDescription(markdown: string): string {
  const lines = markdown.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('#')) continue
    if (trimmed.startsWith('>')) {
      return trimmed.replace(/^>\s*/, '')
    }
    if (trimmed.length > 10) {
      return trimmed.length > 150 ? trimmed.slice(0, 150) + '...' : trimmed
    }
  }
  return ''
}

/** Compute read time from markdown content */
function computeReadTime(text: string): string {
  // Count Chinese characters (roughly 300/min) and English words (roughly 200/min)
  const chineseChars = (text.match(/[一-鿿]/g) || []).length
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
  const minutes = Math.ceil(chineseChars / 300 + englishWords / 200)
  return minutes > 0 ? `${minutes} 分钟` : '1 分钟'
}

// ============================================================
// Portfolio (re-exported from portfolio.ts)
// ============================================================

export { portfolioProjects, portfolioBySlug } from './portfolio'
export type { PortfolioProject } from './portfolio'

// ============================================================
// Blog
// ============================================================

const blogModules = import.meta.glob('../../content/blog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  date?: string
  category: string
  readTime: string
  rawContent: string
}

export const blogPosts: BlogPost[] = Object.entries(blogModules)
  .map(([filepath, content]) => {
    const slug = parseSlug(filepath)
    const { data, content: body } = matter(content)
    const fullContent = body || content

    return {
      slug,
      title: data.title || extractTitle(content),
      excerpt: data.excerpt || extractDescription(content),
      date: data.date || undefined,
      category: data.category || '未分类',
      readTime: computeReadTime(fullContent),
      rawContent: fullContent,
    }
  })
  .sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date)
    if (a.date) return -1
    if (b.date) return 1
    return a.slug.localeCompare(b.slug)
  })

export const blogBySlug: Record<string, BlogPost> = {}
for (const post of blogPosts) {
  blogBySlug[post.slug] = post
}

// ============================================================
// Product (Docs)
// ============================================================

const productModules = import.meta.glob('../../content/product/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export interface ProductDoc {
  slug: string
  title: string
  description: string
  date?: string
  rawContent: string
}

export const productDocs: ProductDoc[] = Object.entries(productModules)
  .map(([filepath, content]) => {
    const slug = parseSlug(filepath)
    const { data, content: body } = matter(content)

    return {
      slug,
      title: data.title || extractTitle(content),
      description: data.description || extractDescription(content),
      date: data.date || undefined,
      rawContent: body || content,
    }
  })
  .sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date)
    if (a.date) return -1
    if (b.date) return 1
    return a.slug.localeCompare(b.slug)
  })

export const productDocsBySlug: Record<string, ProductDoc> = {}
for (const doc of productDocs) {
  productDocsBySlug[doc.slug] = doc
}

// ============================================================
// Photography
// ============================================================

const photographyModules = import.meta.glob('../../content/photography/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** Base URL for photography images deployed via GitHub Pages */
const IMAGE_HOST = 'https://mnting.github.io/assets'

/** Resolve photo src with two-tier fallback:
 *  1. Explicit `image` field in frontmatter (production URL)
 *  2. Constructed remote URL (assumes .png; use frontmatter for other formats) */
function resolvePhotoSrc(slug: string, frontmatterImage?: string): string {
  if (frontmatterImage) return frontmatterImage
  return `${IMAGE_HOST}/${slug}.png`
}

export interface Photo {
  id: string
  src: string
  title: string
  location: string
  date: string
  description?: string
}

type PhotoWithOrder = Photo & { order: number }

export const photos: Photo[] = (Object.entries(photographyModules)
  .map(([filepath, content]) => {
    const slug = parseSlug(filepath)
    const { data, content: body } = matter(content)
    const imageSrc = resolvePhotoSrc(slug, data.image)

    return {
      id: slug,
      src: imageSrc,
      title: data.title || slug,
      location: data.location || '',
      date: data.date ? data.date.replace(/-/g, '.') : '',
      description: data.description || undefined,
      order: typeof data.order === 'number' ? data.order : 999,
    }
  }) as PhotoWithOrder[])
  .sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    if (a.date && b.date) return a.date.localeCompare(b.date)
    return a.id.localeCompare(b.id)
  })
  .map(({ order: _order, ...photo }) => photo)
