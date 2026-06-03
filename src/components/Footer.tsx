import { Link } from 'react-router-dom'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-whisper-gray">
      <div className="page-container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="space-y-3">
            <h3 className="font-sans text-lg font-bold text-foreground">白日梦想家</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              用代码构建世界，用文字记录思考，用镜头捕捉光影。这里是创意与生活的交汇点。
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">导航</h4>
            <div className="flex flex-col gap-2">
              {[
                { label: '作品集', path: '/portfolio' },
                { label: '随笔', path: '/blog' },
                { label: '文档', path: '/product' },
                { label: '摄影', path: '/photography' },
              ].map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 w-fit"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">联系</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              欢迎交流与合作
            </p>
            <a
              href="mailto:taotianhao1048@qq.com"
              className="text-sm text-foreground hover:text-muted-foreground transition-colors duration-200"
            >
              taotianhao1048@qq.com
            </a>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/30">
          <p className="text-xs text-muted-foreground text-center">
            &copy; {currentYear} 白日梦想家. All rights reserved. Built with care.
          </p>
        </div>
      </div>
    </footer>
  )
}
