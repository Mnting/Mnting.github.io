import { Calendar, Clock, ArrowRight } from 'lucide-react'
import ScrollReveal from '@/components/ScrollReveal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface BlogPost {
  title: string
  excerpt: string
  date: string
  readTime: string
  category: string
  slug: string
}

const posts: BlogPost[] = [
  {
    title: '从零构建 TouchDesigner 粒子系统',
    excerpt: '探索如何使用 GLSL 和 TOP 节点在 TouchDesigner 中创建令人惊叹的实时粒子效果。从基础粒子运动到复杂力场模拟，一步步揭开创意编程的面纱。',
    date: '2026-05-08',
    readTime: '8 分钟',
    category: '创意编程',
    slug: 'touchdesigner-particle-system',
  },
  {
    title: 'WCS 系统架构设计实践',
    excerpt: '深入探讨仓库控制系统的架构设计：从设备抽象层到任务调度引擎，分享在大型仓储项目中积累的架构经验与设计模式。',
    date: '2026-04-25',
    readTime: '12 分钟',
    category: '系统架构',
    slug: 'wcs-architecture-design',
  },
  {
    title: 'React 性能优化实战指南',
    excerpt: '从虚拟列表到懒加载，从 memo 优化到状态管理策略，总结在实际项目中验证过的 React 性能优化技巧与最佳实践。',
    date: '2026-04-12',
    readTime: '6 分钟',
    category: '前端开发',
    slug: 'react-performance-optimization',
  },
  {
    title: '摄影与代码：数字美学的两种表达',
    excerpt: '作为一名同时热爱编程和摄影的创作者，思考两种媒介在构图、色彩与节奏上的共通之处，以及它们如何互相滋养创意。',
    date: '2026-03-28',
    readTime: '5 分钟',
    category: '思考',
    slug: 'photography-and-code',
  },
  {
    title: '用 Three.js 创建交互式 3D 场景',
    excerpt: '从场景搭建到着色器编程，完整记录如何使用 Three.js 创建引人入胜的 Web 3D 体验，包括点云、粒子与后期处理效果。',
    date: '2026-03-15',
    readTime: '10 分钟',
    category: '前端开发',
    slug: 'threejs-interactive-scene',
  },
  {
    title: '2026 我的技术栈选择',
    excerpt: '回顾今年使用的技术工具栈：从 .NET 到 React，从 TouchDesigner 到 Three.js，分享背后的选择逻辑与学习心得。',
    date: '2026-03-01',
    readTime: '7 分钟',
    category: '思考',
    slug: 'tech-stack-2026',
  },
]

const categories = ['全部', '创意编程', '系统架构', '前端开发', '思考']

export default function Blog() {
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
                  className="px-4 py-2 text-sm font-medium rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-whisper-gray transition-all duration-200"
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
            {posts.map((post, index) => (
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
                      <Button variant="ghost" size="sm" className="gap-1 text-xs">
                        阅读
                        <ArrowRight size={12} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>

          {/* Load More */}
          <ScrollReveal delay={600}>
            <div className="text-center mt-12">
              <Button variant="default-light" size="lg">
                加载更多
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
