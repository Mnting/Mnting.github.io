import { ArrowDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import ScrollReveal from '@/components/ScrollReveal'
import { Button } from '@/components/ui/button'
import { HeroIllustrationWithControls } from '@/components/HeroIllustration'

export default function Home() {
  return (
    <div>
      {/* Hero Section with Amplemarket dynamic gradients */}
      <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-white">
        {/* Phoenix Orange gradient */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: 'radial-gradient(386.06% 162.79% at -13.19% -17.1%, rgb(232, 64, 13) 0%, rgb(255, 238, 216) 26.16%, rgb(208, 178, 255) 84.15%)',
          }}
        />
        {/* Cyan Glow gradient overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(80.17% 109.2% at 52.12% 62.54%, rgb(208, 178, 255) 0%, rgb(198, 236, 233) 35.28%, rgb(153, 255, 249) 96.56%)',
          }}
        />

        {/* Decorative illustration */}
        <HeroIllustrationWithControls />

        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <ScrollReveal>
            <p className="text-sm md:text-base font-medium tracking-widest text-muted-foreground mb-6 uppercase">
              Creative Developer &amp; Photographer
            </p>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <h1 className="font-sans text-4xl sm:text-5xl md:text-[56px] font-bold text-foreground mb-6 leading-[1.0] tracking-[-0.04em]">
              用代码编织光影
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto mb-10">
              这里是创意与技术的交汇点。探索作品、阅读随笔、欣赏摄影——
              每一帧都是对生活的热爱。
            </p>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="flex items-center justify-center gap-4">
              <Link to="/portfolio">
                <Button variant="primary-dark" size="lg">
                  探索作品
                </Button>
              </Link>
              <Link to="/blog">
                <Button variant="default-light" size="lg">
                  阅读随笔
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-float">
          <ArrowDown className="text-muted-foreground/40 w-5 h-5" />
        </div>
      </section>

      {/* Featured Section */}
      <section className="section-spacing bg-background">
        <div className="page-container">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="font-sans text-[28px] md:text-[36px] font-bold text-foreground mb-4 tracking-[-0.02em]">
                精选内容
              </h2>
              <p className="text-muted-foreground text-base max-w-md mx-auto">
                最新作品、随笔与摄影，发现更多精彩
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Portfolio Card — Subtle Lavender */}
            <ScrollReveal delay={100}>
              <Link to="/portfolio" className="group block">
                <div className="relative overflow-hidden rounded-xl bg-soft-lavender p-8 h-64 flex flex-col justify-end transition-all duration-300 hover:-translate-y-1 shadow-card">
                  <h3 className="font-sans text-xl font-bold text-foreground mb-2">作品集</h3>
                  <p className="text-sm text-muted-foreground">精选项目与创意作品</p>
                  <span className="text-sm text-foreground mt-3 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    浏览全部 →
                  </span>
                </div>
              </Link>
            </ScrollReveal>

            {/* Blog Card — Petal Pink */}
            <ScrollReveal delay={200}>
              <Link to="/blog" className="group block">
                <div className="relative overflow-hidden rounded-xl bg-soft-pink p-8 h-64 flex flex-col justify-end transition-all duration-300 hover:-translate-y-1 shadow-card">
                  <h3 className="font-sans text-xl font-bold text-foreground mb-2">随笔</h3>
                  <p className="text-sm text-muted-foreground">思考、记录与生活随笔</p>
                  <span className="text-sm text-foreground mt-3 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    阅读更多 →
                  </span>
                </div>
              </Link>
            </ScrollReveal>

            {/* Photography Card — Mint Green */}
            <ScrollReveal delay={300}>
              <Link to="/photography" className="group block">
                <div className="relative overflow-hidden rounded-xl bg-soft-mint p-8 h-64 flex flex-col justify-end transition-all duration-300 hover:-translate-y-1 shadow-card">
                  <h3 className="font-sans text-xl font-bold text-foreground mb-2">摄影</h3>
                  <p className="text-sm text-muted-foreground">用镜头捕捉光影瞬间</p>
                  <span className="text-sm text-foreground mt-3 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
