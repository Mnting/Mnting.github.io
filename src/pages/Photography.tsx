import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { MapPin, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCursor } from '@/components/CustomCursor'
import { photos } from '@/lib/markdown'

export default function Photography() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [infoVisible, setInfoVisible] = useState(true)

  const containerRef = useRef<HTMLDivElement>(null)
  const dragStartX = useRef(0)
  const dragStartTime = useRef(0)

  // 使用 ref 作为转场锁，避免 useCallback 闭包过期导致快速点击时状态不同步
  const isTransitioningRef = useRef(false)
  const currentIndexRef = useRef(currentIndex)
  currentIndexRef.current = currentIndex
  const isDraggingRef = useRef(false)

  const { setCursorState } = useCursor()

  const goTo = useCallback((index: number) => {
    if (isTransitioningRef.current) return
    const targetIndex = ((index % photos.length) + photos.length) % photos.length
    if (targetIndex === currentIndexRef.current) return

    isTransitioningRef.current = true
    setIsTransitioning(true)
    setInfoVisible(false)

    setTimeout(() => {
      setCurrentIndex(targetIndex)
      currentIndexRef.current = targetIndex
      setDragOffset(0)
      setTimeout(() => {
        isTransitioningRef.current = false
        setIsTransitioning(false)
        setInfoVisible(true)
      }, 300)
    }, 300)
  }, [photos.length])

  const goNext = useCallback(() => goTo(currentIndexRef.current + 1), [goTo])
  const goPrev = useCallback(() => goTo(currentIndexRef.current - 1), [goTo])

  // Mouse drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (lightboxOpen) return
    dragStartX.current = e.clientX
    dragStartTime.current = Date.now()
    isDraggingRef.current = true
    setIsDragging(true)
    setCursorState('drag-left')
  }, [lightboxOpen, setCursorState])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return
    const dx = e.clientX - dragStartX.current
    setDragOffset(dx)
    if (dx < -20) setCursorState('drag-right')
    else if (dx > 20) setCursorState('drag-left')
  }, [setCursorState])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setIsDragging(false)
    setCursorState('default')

    const dx = e.clientX - dragStartX.current
    const dt = Date.now() - dragStartTime.current
    const velocity = Math.abs(dx) / dt

    if (Math.abs(dx) > 80 || velocity > 0.3) {
      if (dx > 0) goPrev()
      else goNext()
    } else {
      setDragOffset(0)
    }
  }, [goNext, goPrev, setCursorState])

  const handleMouseLeave = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false
      setIsDragging(false)
      setDragOffset(0)
      setCursorState('default')
    }
  }, [setCursorState])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'Escape') setLightboxOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev])

  // Touch handlers
  const touchStartX = useRef(0)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (lightboxOpen) return
    touchStartX.current = e.touches[0].clientX
    isDraggingRef.current = true
    setIsDragging(true)
  }, [lightboxOpen])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current) return
    setDragOffset(e.touches[0].clientX - touchStartX.current)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setIsDragging(false)
    if (Math.abs(dragOffset) > 60) {
      if (dragOffset > 0) goPrev()
      else goNext()
    }
    setDragOffset(0)
  }, [dragOffset, goNext, goPrev])

  const photo = photos[currentIndex]

  const transitionScale = isTransitioning ? 1.08 : 1

  return (
    <div className="fixed inset-0 pt-16 md:pt-20 bg-canvas-white overflow-hidden select-none">
      {/* Drag direction lines */}
      <DragLines visible={isDragging && !lightboxOpen} />

      {/* Main gallery container */}
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background preload images */}
        <div className="absolute inset-0 opacity-0 pointer-events-none">
          {photos.map((p) => (
            <img key={p.id} src={p.src} alt="" />
          ))}
        </div>

        {/* Photo with drag offset */}
        <div
          className="relative will-change-transform"
          style={{
            transform: `translateX(${dragOffset * 0.5}px)`,
            transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)',
          }}
        >
          {/* Photo box with scale transition */}
          <div
            className="relative w-[min(90vw,85vh)] h-[min(60vw,85vh)] overflow-hidden"
            style={{
              transform: `scale(${isTransitioning ? 1.08 : isDragging ? 1 - Math.abs(dragOffset) * 0.0003 : 1})`,
              transition: isDragging ? 'none' : 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Multi-layer border frames */}
            <BorderFrames active={!isTransitioning} />

            {/* The photo */}
            <img
              src={photo.src}
              alt={photo.title}
              draggable={false}
              className="w-full h-full object-cover"
              style={{
                opacity: isTransitioning ? 0.6 : 1,
                transition: 'opacity 0.4s ease',
              }}
            />

            {/* Photo info overlay */}
            <div
              className="absolute bottom-0 left-0 right-0 p-8 md:p-12"
              style={{
                opacity: infoVisible && !isDragging ? 1 : 0,
                transform: infoVisible && !isDragging ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.6s ease, transform 0.6s ease',
              }}
            >
              {/* Title with dramatic typography */}
              <h2 className="mb-3">
                {photo.title.split('').map((char, i) => (
                  <span
                    key={i}
                    className="inline-block font-sans text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground"
                    style={{
                      animation: infoVisible ? `charFadeIn 0.4s ease ${0.05 + i * 0.04}s both` : 'none',
                    }}
                  >
                    {char}
                  </span>
                ))}
              </h2>

              {/* Date with + decorations */}
              <div className="flex items-center gap-3 text-muted-foreground text-sm md:text-base font-light tracking-[0.3em] uppercase">
                <span className="text-phoenix-orange text-lg">+</span>
                <span>{photo.date}</span>
                <span className="text-phoenix-orange text-lg">+</span>
              </div>

              {/* Location */}
              <p className="flex items-center gap-1.5 mt-2 text-muted-foreground/40 text-xs tracking-widest uppercase">
                <MapPin size={10} />
                {photo.location}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation arrows */}
        {!isDragging && !isTransitioning && (
          <>
            <button
              onClick={goPrev}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseEnter={() => setCursorState('hover')}
              onMouseLeave={() => setCursorState('default')}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-whisper-gray hover:bg-taupe-light text-muted-foreground hover:text-foreground border border-border transition-all duration-300 z-10"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={goNext}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseEnter={() => setCursorState('hover')}
              onMouseLeave={() => setCursorState('default')}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-whisper-gray hover:bg-taupe-light text-muted-foreground hover:text-foreground border border-border transition-all duration-300 z-10"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Dots indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              onMouseEnter={() => setCursorState('hover')}
              onMouseLeave={() => setCursorState('default')}
              className="w-2 h-2 rounded-full transition-all duration-500"
              style={{
                backgroundColor: i === currentIndex ? '#111111' : 'rgba(17,17,17,0.15)',
                transform: i === currentIndex ? 'scale(1.5)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        {/* Expand button */}
        <button
          onClick={() => setLightboxOpen(true)}
          onMouseEnter={() => setCursorState('hover')}
          onMouseLeave={() => setCursorState('default')}
          className="absolute top-6 right-6 p-2.5 rounded-full bg-whisper-gray hover:bg-taupe-light text-muted-foreground hover:text-foreground border border-border transition-all duration-300 z-10"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>

        {/* Counter */}
        <div className="absolute top-6 left-6 text-muted-foreground text-xs tracking-[0.3em] font-light z-10">
          <span className="text-phoenix-orange/70">{String(currentIndex + 1).padStart(2, '0')}</span>
          <span className="mx-2">/</span>
          <span>{String(photos.length).padStart(2, '0')}</span>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-white/98 backdrop-blur-2xl flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-6 right-6 p-3 rounded-full bg-whisper-gray hover:bg-taupe-light text-muted-foreground hover:text-foreground transition-colors z-10"
            onClick={() => setLightboxOpen(false)}
          >
            <X size={22} />
          </button>

          <div className="absolute top-6 left-6 text-muted-foreground text-xs tracking-[0.3em] z-10">
            <span className="text-phoenix-orange/70">{String(currentIndex + 1).padStart(2, '0')}</span>
            <span className="mx-2">/</span>
            <span>{String(photos.length).padStart(2, '0')}</span>
          </div>

          <div className="flex items-center gap-4 md:gap-8 w-full max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => { e.stopPropagation(); goPrev() }}
              className="p-2 rounded-full bg-whisper-gray hover:bg-taupe-light text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ChevronLeft size={28} />
            </button>

            <div className="flex-1 flex items-center justify-center">
              <img
                src={photo.src}
                alt={photo.title}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
                style={{
                  transform: `scale(${isTransitioning ? 1.05 : 1})`,
                  transition: 'transform 0.5s ease',
                }}
              />
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); goNext() }}
              className="p-2 rounded-full bg-whisper-gray hover:bg-taupe-light text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ChevronRight size={28} />
            </button>
          </div>

          {/* Info bar */}
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white/90 to-transparent">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <div>
                <h3 className="text-foreground font-sans text-xl md:text-2xl font-bold">{photo.title}</h3>
                <div className="flex items-center gap-4 mt-1 text-muted-foreground text-xs tracking-widest">
                  <span className="flex items-center gap-1"><MapPin size={10} />{photo.location}</span>
                  <span>{photo.date}</span>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Keyframe styles */}
      <style>{`
        @keyframes charFadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

/** Multi-layer border frames (like jiejoe.com) */
function BorderFrames({ active }: { active: boolean }) {
  return (
    <>
      {[1, 0.92, 0.84].map((scale, i) => (
        <div
          key={i}
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            border: '1px solid rgba(17,17,17,0.08)',
            borderRadius: '2vmin',
            transform: `scale(${scale})`,
            opacity: active ? [0.5, 0.3, 0.15][i] : 0,
            transition: 'opacity 0.8s ease',
          }}
        />
      ))}
    </>
  )
}

/** Drag direction indicator lines (like jiejoe.com) */
function DragLines({ visible }: { visible: boolean }) {
  return (
    <>
      {/* Top line */}
      <div
        className="absolute top-0 right-14 left-14 h-14 overflow-hidden pointer-events-none z-0"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'opacity 0.3s ease, transform 0.5s ease',
        }}
      >
        <div className="flex items-center h-full animate-dragline-right">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="flex items-center shrink-0 mx-4">
              <span className="text-muted-foreground/40 text-xs tracking-[0.5em] font-light">DRAG</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--color-muted-ash) / 0.4)" strokeWidth="1.5" className="mx-2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom line */}
      <div
        className="absolute bottom-0 right-14 left-14 h-14 overflow-hidden pointer-events-none z-0"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'opacity 0.3s ease, transform 0.5s ease',
        }}
      >
        <div className="flex items-center h-full animate-dragline-left">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="flex items-center shrink-0 mx-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--color-muted-ash) / 0.4)" strokeWidth="1.5" className="mx-2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span className="text-lilac/40 text-xs tracking-[0.5em] font-light">DRAG</span>
            </div>
          ))}
        </div>
      </div>

      {/* Left line */}
      <div
        className="absolute top-14 bottom-14 left-0 w-14 overflow-hidden pointer-events-none z-0"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'opacity 0.3s ease, transform 0.5s ease',
        }}
      >
        <div className="flex flex-col items-center w-full animate-dragline-down">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center shrink-0 my-3" style={{ writingMode: 'vertical-lr' }}>
              <span className="text-muted-foreground/40 text-xs tracking-[0.5em] font-light">DRAG</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--color-muted-ash) / 0.4)" strokeWidth="1.5" className="my-2" style={{ transform: 'rotate(90deg)' }}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* Right line */}
      <div
        className="absolute top-14 bottom-14 right-0 w-14 overflow-hidden pointer-events-none z-0"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'opacity 0.3s ease, transform 0.5s ease',
        }}
      >
        <div className="flex flex-col items-center w-full animate-dragline-up">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center shrink-0 my-3" style={{ writingMode: 'vertical-lr' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--color-muted-ash) / 0.4)" strokeWidth="1.5" className="my-2" style={{ transform: 'rotate(-90deg)' }}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span className="text-lilac/40 text-xs tracking-[0.5em] font-light">DRAG</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes dragline-right { to { transform: translateX(-50%); } }
        @keyframes dragline-left { to { transform: translateX(50%); } }
        @keyframes dragline-down { to { transform: translateY(-50%); } }
        @keyframes dragline-up { to { transform: translateY(50%); } }
        .animate-dragline-right { animation: dragline-right 20s linear infinite; }
        .animate-dragline-left { animation: dragline-left 20s linear infinite; }
        .animate-dragline-down { animation: dragline-down 20s linear infinite; }
        .animate-dragline-up { animation: dragline-up 20s linear infinite; }
      `}</style>
    </>
  )
}
