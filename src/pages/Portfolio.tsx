import { Link } from 'react-router-dom'
import { ExternalLink, Github, ArrowRight } from 'lucide-react'
import ScrollReveal from '@/components/ScrollReveal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { portfolioProjects } from '@/lib/markdown'

export default function Portfolio() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="page-container">
          <ScrollReveal>
            <p className="text-sm font-medium tracking-widest text-foreground uppercase mb-4">
              Portfolio
            </p>
            <h1 className="font-sans text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-6 leading-tight">
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
            {portfolioProjects.map((project, index) => (
              <ScrollReveal key={project.slug} delay={index * 100}>
                <Card className={`group relative overflow-hidden border-transparent bg-gradient-to-br ${project.color} hover:border-border transition-all duration-500`}>
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
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-whisper-gray text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-3">
                      <Link to={`/portfolio/${project.slug}`}>
                        <Button variant="ghost" size="sm" className="gap-1.5">
                          详情
                          <ArrowRight size={14} />
                        </Button>
                      </Link>
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
