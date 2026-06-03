import matter from 'gray-matter'

// ============================================================
// Shared helpers
// ============================================================

/** Extract slug from filepath: /path/to/foo.md -> foo, /path/to/bar.png -> bar */
function parseSlug(filepath: string): string {
  return filepath.replace(/^.*\//, '').replace(/\.(md|png|jpe?g|webp|gif|avif)$/, '')
}

/** Extract title from H1 heading */
function extractTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : 'Untitled'
}

/** Extract description from first blockquote or non-empty paragraph */
function extractDescription(markdown: string): string {
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
// Portfolio
// ============================================================

const portfolioModules = import.meta.glob('../../content/portfolio/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

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

export const portfolioProjects: PortfolioProject[] = Object.entries(portfolioModules)
  .map(([filepath, content]) => {
    const slug = parseSlug(filepath)
    const { data, content: body } = matter(content)

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
  .sort((a, b) => {
    // Sort by date descending, fallback to slug
    if (a.date && b.date) return b.date.localeCompare(a.date)
    if (a.date) return -1
    if (b.date) return 1
    return a.slug.localeCompare(b.slug)
  })

export const portfolioBySlug: Record<string, PortfolioProject> = {}
for (const project of portfolioProjects) {
  portfolioBySlug[project.slug] = project
}

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

// Auto-discover image files in the same directory, match by filename
const photographyImages = import.meta.glob('../../content/photography/*.{png,jpg,jpeg,webp,gif,avif}', {
  eager: true,
  import: 'default',
}) as Record<string, string>

// Build slug -> image URL map from discovered images
const imageBySlug: Record<string, string> = {}
for (const [filepath, url] of Object.entries(photographyImages)) {
  const slug = parseSlug(filepath)
  imageBySlug[slug] = url
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
    // Auto-match image by slug, fallback to frontmatter `image` field
    const imageSrc = imageBySlug[slug] || data.image || ''

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
