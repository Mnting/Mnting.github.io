import { ExternalLink, Github } from 'lucide-react'
import ScrollReveal from '@/components/ScrollReveal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Project {
  title: string
  description: string
  tags: string[]
  link?: string
  github?: string
  color: string
}

const projects: Project[] = [
  {
    title: '智能仓储管理系统 WCS',
    description: '基于 .NET 和 WPF 构建的仓库控制系统，实现自动化设备调度、任务分配与实时监控，显著提升仓储运营效率。',
    tags: ['C#', 'WPF', '.NET', 'WCS', '自动化'],
    color: 'from-blue-500/10 to-indigo-500/10',
  },
  {
    title: 'TouchDesigner 视觉生成器',
    description: '使用 TouchDesigner 构建的实时视觉生成系统，融合粒子系统、噪声算法与音频反应，打造沉浸式数字艺术体验。',
    tags: ['TouchDesigner', 'GLSL', '创意编程', '实时渲染'],
    color: 'from-purple-500/10 to-pink-500/10',
  },
  {
    title: '个人博客系统',
    description: '使用 React + Three.js 构建的个人博客，集成点云动画、响应式设计与内容管理，兼具美学与性能。',
    tags: ['React', 'TypeScript', 'Three.js', 'Tailwind CSS'],
    link: '#',
    color: 'from-emerald-500/10 to-teal-500/10',
  },
  {
    title: '数据可视化仪表盘',
    description: '面向企业级应用的数据可视化平台，支持多种图表类型、实时数据流与自定义主题，帮助团队快速洞察数据。',
    tags: ['React', 'D3.js', 'WebSocket', 'Dashboard'],
    color: 'from-orange-500/10 to-amber-500/10',
  },
]

export default function Portfolio() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="page-container">
          <ScrollReveal>
            <p className="text-sm font-medium tracking-widest text-primary uppercase mb-4">
              Portfolio
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-6 leading-tight">
              作品集
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              这里汇集了我在软件开发、创意编程与视觉设计领域的精选作品。
              每一个项目都承载着对技术与美学的探索。
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="pb-24 md:pb-32">
        <div className="page-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project, index) => (
              <ScrollReveal key={project.title} delay={index * 100}>
                <Card className={`group relative overflow-hidden border-transparent bg-gradient-to-br ${project.color} hover:border-primary/20 transition-all duration-500`}>
                  <CardHeader>
                    <CardTitle className="text-xl">{project.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed pt-1">
                      {project.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 text-xs font-medium rounded-full bg-foreground/5 text-muted-foreground border border-border/50"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    {/* Links */}
                    {(project.link || project.github) && (
                      <div className="flex items-center gap-3">
                        {project.link && (
                          <a href={project.link} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="gap-1.5">
                              <ExternalLink size={14} />
                              预览
                            </Button>
                          </a>
                        )}
                        {project.github && (
                          <a href={project.github} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="gap-1.5">
                              <Github size={14} />
                              源码
                            </Button>
                          </a>
                        )}
                      </div>
                    )}
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
