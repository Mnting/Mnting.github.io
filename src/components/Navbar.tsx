import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { path: '/', label: '首页' },
  { path: '/portfolio', label: '作品' },
  { path: '/blog', label: '日记' },
  { path: '/photography', label: '摄影' },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isPhotography = location.pathname === '/photography'

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        isHome && !scrolled
          ? 'bg-transparent'
          : isPhotography
            ? 'bg-gradient-to-b from-black/60 to-transparent backdrop-blur-sm'
            : 'bg-background/80 backdrop-blur-xl border-b border-border/40',
        scrolled && !isPhotography && 'shadow-sm'
      )}
    >
      <div className="page-container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            to="/"
            className={cn(
              'font-serif text-xl font-semibold tracking-tight transition-colors duration-300',
              isHome && !scrolled
                ? 'text-white/90'
                : isPhotography
                  ? 'text-white/90'
                  : 'text-foreground'
            )}
          >
            MyInfo
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300',
                  isHome && !scrolled
                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                    : isPhotography
                      ? 'text-white/70 hover:text-white hover:bg-white/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                  location.pathname === link.path && (
                    isHome && !scrolled
                      ? 'text-white bg-white/15'
                      : isPhotography
                        ? 'text-white bg-white/15'
                        : 'text-primary bg-primary/8'
                  )
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'md:hidden p-2 rounded-lg transition-colors',
              isHome && !scrolled
                ? 'text-white/80 hover:text-white hover:bg-white/10'
                : isPhotography
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-foreground hover:bg-secondary'
            )}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-border/20 py-4 animate-fade-in">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    'px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                    location.pathname === link.path
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
