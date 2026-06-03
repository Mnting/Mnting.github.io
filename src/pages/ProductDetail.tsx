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
              返回文档
            </Button>
          </Link>
        </ScrollReveal>

        {/* Article header */}
        <ScrollReveal delay={50}>
          <div className="mb-12">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <FileText size={14} className="text-foreground" />
              <span>文档</span>
            </div>
            <h1 className="font-sans text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground leading-tight">
              {doc.title}
            </h1>
          </div>
        </ScrollReveal>

        {/* Markdown content */}
        <article className="text-foreground leading-relaxed space-y-4
          [&_h1]:font-sans [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:mt-8 [&_h1]:mb-4
          [&_h2]:font-sans [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-4
          [&_h3]:font-sans [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-8 [&_h3]:mb-3
          [&_p]:leading-relaxed [&_p]:my-3
          [&_a]:text-foreground [&_a]:no-underline hover:[&_a]:underline
          [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:bg-whisper-gray [&_blockquote]:py-2 [&_blockquote]:px-4 [&_blockquote]:rounded-r-lg [&_blockquote]:my-4
          [&_code]:bg-secondary [&_code]:text-foreground [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3
          [&_li]:my-1
          [&_hr]:border-border [&_hr]:my-8
          [&_strong]:font-semibold
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {doc.rawContent}
          </ReactMarkdown>
        </article>

        {/* Bottom back link */}
        <ScrollReveal delay={200}>
          <div className="mt-16 pt-8 border-t border-border/40">
            <Link to="/product">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft size={14} />
                返回文档列表
              </Button>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  )
}
