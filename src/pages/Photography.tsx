import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { MapPin, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCursor } from '@/components/CustomCursor'
import ScrollReveal from '@/components/ScrollReveal'
import { photos } from '@/lib/markdown'

export default function Photography() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const { setCursorState } = useCursor()

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null)
  }, [])

  const goPrev = useCallback(() => {
    setLightboxIndex((prev) => {
      if (prev === null) return null
      return prev === 0 ? photos.length - 1 : prev - 1
    })
  }, [])

  const goNext = useCallback(() => {
    setLightboxIndex((prev) => {
      if (prev === null) return null
      return prev === photos.length - 1 ? 0 : prev + 1
    })
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return
      if (e.key === 'Escape') closeLightbox()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxIndex, closeLightbox, goPrev, goNext])

  const currentPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-16">
        <div className="page-container">
          <ScrollReveal>
            <p className="text-sm font-medium tracking-widest text-foreground uppercase mb-4">
              Photography
            </p>
            <h1 className="font-sans text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-6 leading-tight">
              摄影
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              用镜头捕捉生活中的光影瞬间，记录那些值得被定格的画面。
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Photo Grid */}
      <section className="pb-24 md:pb-32">
        <div className="page-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {photos.map((photo, index) => (
              <ScrollReveal key={photo.id} delay={index * 80}>
                <div
                  className="group cursor-pointer"
                  onClick={() => openLightbox(index)}
                  onMouseEnter={() => setCursorState('hover')}
                  onMouseLeave={() => setCursorState('default')}
                >
                  {/* Image */}
                  <div className="relative overflow-hidden rounded-xl aspect-[4/3] mb-4">
                    <img
                      src={photo.src}
                      alt={photo.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Info */}
                  <div className="px-1">
                    <h3 className="font-sans text-lg font-semibold text-foreground mb-1.5 group-hover:text-phoenix-orange transition-colors">
                      {photo.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {photo.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={10} />
                          {photo.location}
                        </span>
                      )}
                      {photo.date && <span>{photo.date}</span>}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {currentPhoto && lightboxIndex !== null && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-white/98 backdrop-blur-2xl flex flex-col items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            className="absolute top-6 right-6 p-3 rounded-full bg-whisper-gray hover:bg-taupe-light text-muted-foreground hover:text-foreground transition-colors z-10"
            onClick={closeLightbox}
            onMouseEnter={() => setCursorState('hover')}
            onMouseLeave={() => setCursorState('default')}
          >
            <X size={22} />
          </button>

          {/* Counter */}
          <div className="absolute top-6 left-6 text-muted-foreground text-xs tracking-[0.3em] z-10">
            <span className="text-phoenix-orange/70">{String(lightboxIndex + 1).padStart(2, '0')}</span>
            <span className="mx-2">/</span>
            <span>{String(photos.length).padStart(2, '0')}</span>
          </div>

          {/* Image area */}
          <div className="flex items-center gap-4 md:gap-8 w-full max-w-[90vw] max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            {/* Prev button */}
            <button
              onClick={goPrev}
              onMouseEnter={() => setCursorState('hover')}
              onMouseLeave={() => setCursorState('default')}
              className="p-2 rounded-full bg-whisper-gray hover:bg-taupe-light text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ChevronLeft size={28} />
            </button>

            {/* Image */}
            <div className="flex-1 flex items-center justify-center">
              <img
                src={currentPhoto.src}
                alt={currentPhoto.title}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            </div>

            {/* Next button */}
            <button
              onClick={goNext}
              onMouseEnter={() => setCursorState('hover')}
              onMouseLeave={() => setCursorState('default')}
              className="p-2 rounded-full bg-whisper-gray hover:bg-taupe-light text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ChevronRight size={28} />
            </button>
          </div>

          {/* Info bar */}
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white/90 to-transparent">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-foreground font-sans text-xl md:text-2xl font-bold">{currentPhoto.title}</h3>
              <div className="flex items-center gap-4 mt-1 text-muted-foreground text-xs tracking-widest">
                {currentPhoto.location && (
                  <span className="flex items-center gap-1"><MapPin size={10} />{currentPhoto.location}</span>
                )}
                {currentPhoto.date && <span>{currentPhoto.date}</span>}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
