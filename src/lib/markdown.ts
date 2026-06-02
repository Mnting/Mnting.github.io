// Product markdown document types
export interface ProductDoc {
  slug: string
  title: string
  description: string
  rawContent: string
}

// Eagerly import all .md files from /product/ at build time.
// Path is relative to this file: src/lib/ -> ../../product/*.md
const rawDocs = import.meta.glob('../../product/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

// Extract H1 title from markdown string
function extractTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : 'Untitled'
}

// Extract a short description from markdown:
// 1. Try the first blockquote line (these docs use blockquotes for dates)
// 2. Fall back to the first non-empty, non-heading paragraph
function extractDescription(markdown: string): string {
  const lines = markdown.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('#')) continue
    if (trimmed.startsWith('>')) {
      // Blockquote: strip '>' markers and return
      return trimmed.replace(/^>\s*/, '')
    }
    // First regular paragraph
    if (trimmed.length > 10) {
      return trimmed.length > 150 ? trimmed.slice(0, 150) + '...' : trimmed
    }
  }
  return ''
}

// Build the full product document list
export const productDocs: ProductDoc[] = Object.entries(rawDocs).map(([filepath, content]) => {
  const slug = filepath.replace(/^.*\//, '').replace(/\.md$/, '')
  return {
    slug,
    title: extractTitle(content),
    description: extractDescription(content),
    rawContent: content,
  }
})

// Lookup map for detail page
export const productDocsBySlug: Record<string, ProductDoc> = {}
for (const doc of productDocs) {
  productDocsBySlug[doc.slug] = doc
}
