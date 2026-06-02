import { useParams, Link, Navigate } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ScrollReveal from '@/components/ScrollReveal'
import { Button } from '@/components/ui/button'
import { productDocsBySlug } from '@/lib/markdown'

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()

  const doc = slug ? productDocsBySlug[slug] : undefined

  // 404: slug not found
  if (!doc) {
    return <Navigate to="/product" replace />
  }

  return (
    <div className="min-h-screen">
      <div className="page-container py-24 md:py-32">
        {/* Back navigation */}
        <ScrollReveal>
          <Link to="/product">
            <Button variant="ghost" size="sm" className="gap-2 mb-8 -ml-3">
              <ArrowLeft size={14} />
              返回产品文档
            </Button>
          </Link>
        </ScrollReveal>

        {/* Article header */}
        <ScrollReveal delay={50}>
          <div className="mb-12">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <FileText size={14} className="text-primary" />
              <span>产品文档</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground leading-tight">
              {doc.title}
            </h1>
          </div>
        </ScrollReveal>

        {/* Markdown content */}
        <ScrollReveal delay={100}>
          <article className="prose prose-lg max-w-none
            prose-headings:font-serif
            prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
            prose-p:leading-relaxed
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-l-primary/50 prose-blockquote:bg-secondary/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
            prose-code:bg-secondary prose-code:text-foreground prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-hr:border-border
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {doc.rawContent}
            </ReactMarkdown>
          </article>
        </ScrollReveal>

        {/* Bottom back link */}
        <ScrollReveal delay={200}>
          <div className="mt-16 pt-8 border-t border-border/40">
            <Link to="/product">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft size={14} />
                返回产品文档列表
              </Button>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  )
}
