import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import ScrollReveal from '@/components/ScrollReveal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { blogPosts } from '@/lib/markdown'

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState('全部')

  const categories = useMemo(() => {
    const cats = ['全部', ...new Set(blogPosts.map(p => p.category))]
    return cats
  }, [])

  const filteredPosts = activeCategory === '全部'
    ? blogPosts
    : blogPosts.filter(p => p.category === activeCategory)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="page-container">
          <ScrollReveal>
            <p className="text-sm font-medium tracking-widest text-foreground uppercase mb-4">
              Journal
            </p>
            <h1 className="font-sans text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-6 leading-tight">
              随笔
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              记录技术探索、创作思考与生活感悟。每一篇文字都是成长的足迹。
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Category Filter */}
      <section className="pb-8">
        <div className="page-container">
          <ScrollReveal>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 text-sm font-medium rounded-md border transition-all duration-200 ${
                    cat === activeCategory
                      ? 'border-foreground text-foreground bg-whisper-gray'
                      : 'border-border text-muted-foreground hover:text-foreground hover:bg-whisper-gray'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Posts List */}
      <section className="pb-24 md:pb-32">
        <div className="page-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPosts.map((post, index) => (
              <ScrollReveal key={post.slug} delay={index * 100}>
                <Card className="group h-full flex flex-col hover:border-border transition-all duration-500 hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span className="px-2.5 py-0.5 rounded-md bg-whisper-gray text-foreground text-xs font-medium">
                        {post.category}
                      </span>
                    </div>
                    <CardTitle className="text-lg leading-snug group-hover:text-foreground transition-colors duration-300">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed pt-1 line-clamp-3">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <div className="flex items-center justify-between pt-4 border-t border-border/30">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {post.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {post.readTime}
                        </span>
                      </div>
                      <Link to={`/blog/${post.slug}`}>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs">
                          阅读
                          <ArrowRight size={12} />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
