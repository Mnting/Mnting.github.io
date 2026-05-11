import { ArrowDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import LilacPointCloud from '@/components/LilacPointCloud'
import ScrollReveal from '@/components/ScrollReveal'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div>
      {/* Hero Section with Lilac Point Cloud */}
      <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(270,30%,3%)] via-[hsl(280,30%,6%)] to-[hsl(270,25%,8%)]" />
        
        {/* Lilac Point Cloud */}
        <LilacPointCloud />

        {/* Gradient overlays for better text readability */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-[hsl(270,30%,3%)]/60 pointer-events-none" />
        
        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <ScrollReveal>
            <p className="text-sm md:text-base font-medium tracking-widest text-lilac-light/80 mb-6 uppercase">
              Creative Developer &amp; Photographer
            </p>
          </ScrollReveal>
          
          <ScrollReveal delay={100}>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl font-semibold text-white mb-6 leading-tight tracking-tight">
              用代码
              <span className="text-gradient">编织</span>
              光影
            </h1>
          </ScrollReveal>
          
          <ScrollReveal delay={200}>
            <p className="text-base md:text-lg text-white/60 leading-relaxed max-w-xl mx-auto mb-10">
              这里是创意与技术的交汇点。探索作品、阅读日记、欣赏摄影——
              每一帧都是对生活的热爱。
            </p>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="flex items-center justify-center gap-4">
              <Link to="/portfolio">
                <Button variant="lilac" size="lg" className="rounded-full px-8">
                  探索作品
                </Button>
              </Link>
              <Link to="/blog">
                <Button variant="hero" size="lg" className="rounded-full px-8">
                  阅读日记
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-float">
          <ArrowDown className="text-white/30 w-5 h-5" />
        </div>
      </section>

      {/* Featured Section */}
      <section className="section-spacing bg-background">
        <div className="page-container">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
                精选内容
              </h2>
              <p className="text-muted-foreground text-base max-w-md mx-auto">
                最新作品、日记与摄影，发现更多精彩
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Portfolio Card */}
            <ScrollReveal delay={100}>
              <Link to="/portfolio" className="group block">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-lilac-deep/20 to-lilac/10 p-8 h-64 flex flex-col justify-end transition-all duration-500 hover:shadow-glow hover:-translate-y-1">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-lilac/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-2">作品集</h3>
                  <p className="text-sm text-muted-foreground">精选项目与创意作品</p>
                  <span className="text-sm text-primary mt-3 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    浏览全部 →
                  </span>
                </div>
              </Link>
            </ScrollReveal>

            {/* Blog Card */}
            <ScrollReveal delay={200}>
              <Link to="/blog" className="group block">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 p-8 h-64 flex flex-col justify-end transition-all duration-500 hover:shadow-elevated hover:-translate-y-1">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-2">日记</h3>
                  <p className="text-sm text-muted-foreground">思考、记录与生活随笔</p>
                  <span className="text-sm text-primary mt-3 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    阅读更多 →
                  </span>
                </div>
              </Link>
            </ScrollReveal>

            {/* Photography Card */}
            <ScrollReveal delay={300}>
              <Link to="/photography" className="group block">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary to-secondary/50 p-8 h-64 flex flex-col justify-end transition-all duration-500 hover:shadow-elevated hover:-translate-y-1">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-2">摄影</h3>
                  <p className="text-sm text-muted-foreground">用镜头捕捉光影瞬间</p>
                  <span className="text-sm text-primary mt-3 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    查看相册 →
                  </span>
                </div>
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  )
}
