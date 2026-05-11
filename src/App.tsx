import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { CursorProvider } from '@/components/CustomCursor'
import Home from '@/pages/Home'
import Portfolio from '@/pages/Portfolio'
import Blog from '@/pages/Blog'
import Photography from '@/pages/Photography'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function Layout() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isPhotography = location.pathname === '/photography'

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className={isHome || isPhotography ? '' : 'pt-16 md:pt-20'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/photography" element={<Photography />} />
        </Routes>
      </main>
      {!isHome && !isPhotography && <Footer />}
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <CursorProvider>
        <ScrollToTop />
        <Layout />
      </CursorProvider>
    </HashRouter>
  )
}
