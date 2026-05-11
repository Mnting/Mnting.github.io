import { createContext, useContext, useState, useEffect, useCallback, type ReactNode, useRef } from 'react'

type CursorState = 'default' | 'hover' | 'click' | 'drag-left' | 'drag-right'

interface CursorContextType {
  cursorState: CursorState
  setCursorState: (state: CursorState) => void
}

const CursorContext = createContext<CursorContextType>({
  cursorState: 'default',
  setCursorState: () => {},
})

export function useCursor() {
  return useContext(CursorContext)
}

export function CursorProvider({ children }: { children: ReactNode }) {
  const [cursorState, setCursorState] = useState<CursorState>('default')
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const cursorRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number>(0)

  useEffect(() => {
    // Detect touch device - don't show custom cursor
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setIsTouchDevice(true)
      return
    }

    const onMouseMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY }
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          if (cursorRef.current) {
            cursorRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`
          }
          rafRef.current = 0
        })
      }
    }

    const onMouseDown = () => setCursorState((s) => (s === 'hover' ? 'click' : s))
    const onMouseUp = () => setCursorState((s) => (s === 'click' ? 'hover' : s))

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Don't render custom cursor on touch devices
  if (isTouchDevice) {
    return <>{children}</>
  }

  const sizeClass = {
    default: 'w-6 h-6',
    hover: 'w-5 h-5',
    click: 'w-4 h-4',
    'drag-left': 'w-10 h-6 rounded-full',
    'drag-right': 'w-10 h-6 rounded-full',
  }[cursorState]

  const bgClass = {
    default: 'bg-lilac/80',
    hover: 'bg-lilac scale-150',
    click: 'bg-lilac-deep scale-75',
    'drag-left': 'bg-lilac/90',
    'drag-right': 'bg-lilac/90',
  }[cursorState]

  const arrowContent = cursorState === 'drag-left' ? '←' : cursorState === 'drag-right' ? '→' : null

  return (
    <CursorContext.Provider value={{ cursorState, setCursorState }}>
      <style>{`
        * { cursor: none !important; }
        a, button, [role="button"], input, select, textarea, [data-cursor-hover] {
          cursor: none !important;
        }
      `}</style>
      <div
        ref={cursorRef}
        className={`custom-cursor fixed top-0 left-0 pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 transition-[width,height,border-radius] duration-200 ease-out ${sizeClass} ${bgClass} ${arrowContent ? 'flex items-center justify-center text-white text-xs font-bold' : ''}`}
        style={{ willChange: 'transform' }}
      >
        {arrowContent}
      </div>
      {children}
    </CursorContext.Provider>
  )
}
