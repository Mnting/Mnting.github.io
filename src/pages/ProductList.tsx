import { Link } from 'react-router-dom'
import { FileText, ArrowRight } from 'lucide-react'
import ScrollReveal from '@/components/ScrollReveal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { productDocs } from '@/lib/markdown'

export default function ProductList() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="page-container">
          <ScrollReveal>
            <p className="text-sm font-medium tracking-widest text-primary uppercase mb-4">
              Product
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-6 leading-tight">
              产品
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              产品相关文档与政策文件。透明、清晰、可信赖。
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Document Cards Grid */}
      <section className="pb-24 md:pb-32">
        <div className="page-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {productDocs.map((doc, index) => (
              <ScrollReveal key={doc.slug} delay={index * 100}>
                <Link to={`/product/${doc.slug}`}>
                  <Card className="group h-full flex flex-col hover:border-primary/20 transition-all duration-500 hover:-translate-y-1">
                    <CardHeader>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <FileText size={14} className="text-primary" />
                        <span>文档</span>
                      </div>
                      <CardTitle className="text-lg leading-snug group-hover:text-primary transition-colors duration-300">
                        {doc.title}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed pt-1 line-clamp-2">
                        {doc.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto">
                      <div className="flex items-center justify-end pt-4 border-t border-border/30">
                        <Button variant="ghost" size="sm" className="gap-1 text-xs">
                          阅读
                          <ArrowRight size={12} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
