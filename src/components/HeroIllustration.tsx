import { useRef, useEffect, useCallback, useState } from 'react'
import { DevControls } from './DevControls'

// ============================================================
// Default parameters (tuned from the slider panel)
// ============================================================

export interface HeroParams {
  // Trail shape (all in canvas coordinate space, pre-scaling)
  trailControl1X: number
  trailControl1Y: number
  trailControl2X: number
  trailControl2Y: number
  trailEndX: number
  trailEndY: number
  trailStartWidth: number
  trailEndWidth: number

  // Color & effects
  colorHueShift: number
  colorSaturation: number
  trailOpacity: number
  trailGlow: number
  flowSpeed: number

  // Plane & character
  planeX: number
  planeY: number
  planeScale: number
  planeRotation: number
  floatAmplitude: number
  floatSpeed: number
}

export const DEFAULT_PARAMS: HeroParams = {
  trailControl1X: 0.78,
  trailControl1Y: 0.15,
  trailControl2X: 0.45,
  trailControl2Y: 0.35,
  trailEndX: 0.05,
  trailEndY: 0.72,
  trailStartWidth: 8,
  trailEndWidth: 180,

  colorHueShift: 0,
  colorSaturation: 100,
  trailOpacity: 0.35,
  trailGlow: 12,
  flowSpeed: 12,

  planeX: 0.82,
  planeY: 0.18,
  planeScale: 1,
  planeRotation: -15,
  floatAmplitude: 6,
  floatSpeed: 5,
}

// ============================================================
// Color palette (matches hero background gradients)
// ============================================================

const TRAIL_COLORS = [
  { r: 232, g: 64, b: 13 },   // phoenix orange
  { r: 255, g: 180, b: 120 }, // warm peach
  { r: 255, g: 238, b: 216 }, // light peach
  { r: 208, g: 178, b: 255 }, // lavender
  { r: 153, g: 255, b: 249 }, // cyan glow
]

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h * 12) % 12
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
  }
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

// ============================================================
// Bezier math helpers
// ============================================================

function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const u = 1 - t
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
}

function cubicBezierDerivative(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const u = 1 - t
  return 3 * u * u * (p1 - p0) + 6 * u * t * (p2 - p1) + 3 * t * t * (p3 - p2)
}

// ============================================================
// HeroIllustration Component
// ============================================================

interface Props {
  params: HeroParams
}

export default function HeroIllustration({ params }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef(0)
  const timeRef = useRef(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const w = rect.width
    const h = rect.height

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const t = timeRef.current
    const flowOffset = (t % params.flowSpeed) / params.flowSpeed

    // --- Compute positions in pixel space ---
    const startX = params.planeX * w
    const startY = params.planeY * h
    const cp1x = params.trailControl1X * w
    const cp1y = params.trailControl1Y * h
    const cp2x = params.trailControl2X * w
    const cp2y = params.trailControl2Y * h
    const endX = params.trailEndX * w
    const endY = params.trailEndY * h

    // --- Draw trail ---
    ctx.save()

    const NUM_SAMPLES = 80
    const topPoints: [number, number][] = []
    const bottomPoints: [number, number][] = []

    for (let i = 0; i <= NUM_SAMPLES; i++) {
      const s = i / NUM_SAMPLES
      const x = cubicBezier(s, startX, cp1x, cp2x, endX)
      const y = cubicBezier(s, startY, cp1y, cp2y, endY)
      const dx = cubicBezierDerivative(s, startX, cp1x, cp2x, endX)
      const dy = cubicBezierDerivative(s, startY, cp1y, cp2y, endY)
      const len = Math.sqrt(dx * dx + dy * dy) || 1
      const nx = -dy / len
      const ny = dx / len

      const halfW = (params.trailStartWidth + (params.trailEndWidth - params.trailStartWidth) * s) / 2
      topPoints.push([x + nx * halfW, y + ny * halfW])
      bottomPoints.push([x - nx * halfW, y - ny * halfW])
    }

    // Build trail path
    ctx.beginPath()
    ctx.moveTo(topPoints[0][0], topPoints[0][1])
    for (let i = 1; i < topPoints.length; i++) {
      ctx.lineTo(topPoints[i][0], topPoints[i][1])
    }
    for (let i = bottomPoints.length - 1; i >= 0; i--) {
      ctx.lineTo(bottomPoints[i][0], bottomPoints[i][1])
    }
    ctx.closePath()

    // Gradient fill with flowing animation
    const gradStartX = startX + flowOffset * (endX - startX)
    const gradStartY = startY + flowOffset * (endY - startY)
    const gradEndX = endX + flowOffset * (endX - startX)
    const gradEndY = endY + flowOffset * (endY - startY)
    const gradient = ctx.createLinearGradient(gradStartX, gradStartY, gradEndX, gradEndY)

    for (let i = 0; i < TRAIL_COLORS.length; i++) {
      const pos = (i + flowOffset) / (TRAIL_COLORS.length - 1)
      const wrappedPos = pos % 1
      const { r, g, b } = TRAIL_COLORS[i]
      const [hr, hg, hb] = hslToRgb(
        ((r / 255) * 360 + params.colorHueShift) % 360,
        params.colorSaturation / 100,
        0.5 + (b / 255) * 0.3,
      )
      gradient.addColorStop(wrappedPos, `rgb(${hr},${hg},${hb})`)
    }

    ctx.fillStyle = gradient
    ctx.globalAlpha = params.trailOpacity

    if (params.trailGlow > 0) {
      ctx.shadowColor = `rgba(232, 64, 13, 0.5)`
      ctx.shadowBlur = params.trailGlow
    }

    ctx.fill()

    ctx.restore()

    // --- Draw airplane ---
    ctx.save()

    const floatOffset = Math.sin((t / params.floatSpeed) * Math.PI * 2) * params.floatAmplitude
    const planePx = startX
    const planePy = startY + floatOffset

    ctx.translate(planePx, planePy)
    ctx.rotate((params.planeRotation * Math.PI) / 180)
    ctx.scale(params.planeScale, params.planeScale)

    // Coordinate system: plane faces left (-x direction)
    // Center of drawing is at (0, 0) — the middle of the fuselage
    const bodyW = 80
    const bodyH = 18
    const bodyR = 9

    // Fuselage
    ctx.beginPath()
    ctx.moveTo(-bodyW / 2 + bodyR, -bodyH / 2)
    ctx.lineTo(bodyW / 2 - bodyR, -bodyH / 2)
    ctx.arcTo(bodyW / 2, -bodyH / 2, bodyW / 2, -bodyH / 2 + bodyR, bodyR)
    ctx.lineTo(bodyW / 2, bodyH / 2 - bodyR)
    ctx.arcTo(bodyW / 2, bodyH / 2, bodyW / 2 - bodyR, bodyH / 2, bodyR)
    ctx.lineTo(-bodyW / 2 + bodyR, bodyH / 2)
    ctx.arcTo(-bodyW / 2, bodyH / 2, -bodyW / 2, bodyH / 2 - bodyR, bodyR)
    ctx.lineTo(-bodyW / 2, -bodyH / 2 + bodyR)
    ctx.arcTo(-bodyW / 2, -bodyH / 2, -bodyW / 2 + bodyR, -bodyH / 2, bodyR)
    ctx.closePath()
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#111111'
    ctx.lineWidth = 2
    ctx.stroke()

    // Cockpit window
    ctx.beginPath()
    ctx.arc(bodyW / 2 - 18, 0, 6, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(153, 255, 249, 0.4)'
    ctx.fill()
    ctx.strokeStyle = '#111111'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Main wing (upper)
    ctx.beginPath()
    ctx.moveTo(-12, -bodyH / 2)
    ctx.lineTo(8, -bodyH / 2 - 28)
    ctx.lineTo(18, -bodyH / 2 - 26)
    ctx.lineTo(2, -bodyH / 2)
    ctx.closePath()
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#111111'
    ctx.lineWidth = 2
    ctx.stroke()

    // Main wing (lower)
    ctx.beginPath()
    ctx.moveTo(-12, bodyH / 2)
    ctx.lineTo(8, bodyH / 2 + 28)
    ctx.lineTo(18, bodyH / 2 + 26)
    ctx.lineTo(2, bodyH / 2)
    ctx.closePath()
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#111111'
    ctx.lineWidth = 2
    ctx.stroke()

    // Tail fin (vertical stabilizer)
    ctx.beginPath()
    ctx.moveTo(-bodyW / 2 + 5, -bodyH / 2)
    ctx.lineTo(-bodyW / 2 - 8, -bodyH / 2 - 20)
    ctx.lineTo(-bodyW / 2 + 2, -bodyH / 2 - 16)
    ctx.closePath()
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#111111'
    ctx.lineWidth = 2
    ctx.stroke()

    // Tail horizontal stabilizer
    ctx.beginPath()
    ctx.moveTo(-bodyW / 2 + 8, -bodyH / 2 + 2)
    ctx.lineTo(-bodyW / 2 - 6, -bodyH / 2 - 4)
    ctx.strokeStyle = '#111111'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(-bodyW / 2 + 8, bodyH / 2 - 2)
    ctx.lineTo(-bodyW / 2 - 6, bodyH / 2 + 4)
    ctx.stroke()

    // Propeller hub
    ctx.beginPath()
    ctx.arc(bodyW / 2 + 4, 0, 6, 0, Math.PI * 2)
    ctx.fillStyle = 'hsl(14, 90%, 48%)'
    ctx.fill()
    ctx.strokeStyle = '#111111'
    ctx.lineWidth = 2
    ctx.stroke()

    // Propeller blades
    const bladeAngle = (t * 8) % (Math.PI * 2)
    ctx.save()
    ctx.translate(bodyW / 2 + 4, 0)
    ctx.rotate(bladeAngle)
    ctx.beginPath()
    ctx.moveTo(0, -3)
    ctx.lineTo(0, -20)
    ctx.lineTo(3, -18)
    ctx.lineTo(0, -3)
    ctx.closePath()
    ctx.fillStyle = '#111111'
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(0, 3)
    ctx.lineTo(0, 20)
    ctx.lineTo(-3, 18)
    ctx.lineTo(0, 3)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    ctx.restore()

    // --- Draw character ---
    ctx.save()
    ctx.translate(planePx, planePy)
    ctx.rotate((params.planeRotation * Math.PI) / 180)
    ctx.scale(params.planeScale, params.planeScale)

    const charX = 10
    const charY = -bodyH / 2 - 6

    // Head
    ctx.beginPath()
    ctx.arc(charX, charY - 10, 10, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#111111'
    ctx.lineWidth = 2
    ctx.stroke()

    // Smile
    ctx.beginPath()
    ctx.arc(charX, charY - 10, 5, 0.2, Math.PI - 0.2)
    ctx.strokeStyle = '#111111'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Eyes
    ctx.beginPath()
    ctx.arc(charX - 3, charY - 13, 1.5, 0, Math.PI * 2)
    ctx.fillStyle = '#111111'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(charX + 3, charY - 13, 1.5, 0, Math.PI * 2)
    ctx.fill()

    // Body
    ctx.beginPath()
    ctx.moveTo(charX, charY)
    ctx.lineTo(charX, charY + 16)
    ctx.strokeStyle = '#111111'
    ctx.lineWidth = 2
    ctx.stroke()

    // Arms
    ctx.beginPath()
    ctx.moveTo(charX, charY + 4)
    ctx.lineTo(charX - 10, charY + 10)
    ctx.strokeStyle = '#111111'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(charX, charY + 4)
    ctx.lineTo(charX + 10, charY + 10)
    ctx.stroke()

    // Legs
    ctx.beginPath()
    ctx.moveTo(charX, charY + 16)
    ctx.lineTo(charX - 6, charY + 24)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(charX, charY + 16)
    ctx.lineTo(charX + 6, charY + 24)
    ctx.stroke()

    ctx.restore()

    animRef.current = requestAnimationFrame(draw)
  }, [params])

  useEffect(() => {
    let lastTime = performance.now()
    let frameId: number

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000
      lastTime = now
      timeRef.current += dt
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)

    // Resize observer
    const container = containerRef.current
    let resizeObserver: ResizeObserver | null = null
    if (container) {
      resizeObserver = new ResizeObserver(() => {
        // Trigger redraw on resize
      })
      resizeObserver.observe(container)
    }

    // Start drawing loop
    animRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frameId)
      cancelAnimationFrame(animRef.current)
      resizeObserver?.disconnect()
    }
  }, [draw])

  return (
    <>
      <div ref={containerRef} className="absolute inset-0 z-10 pointer-events-none">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>
    </>
  )
}

// ============================================================
// Main component with dev controls
// ============================================================

export function HeroIllustrationWithControls() {
  const [params, setParams] = useState<HeroParams>(() => {
    // Try to load saved params from localStorage
    try {
      const saved = localStorage.getItem('hero-illustration-params')
      if (saved) return { ...DEFAULT_PARAMS, ...JSON.parse(saved) }
    } catch { /* ignore */ }
    return { ...DEFAULT_PARAMS }
  })

  const handleParamsChange = useCallback((newParams: HeroParams) => {
    setParams(newParams)
  }, [])

  const handleReset = useCallback(() => {
    setParams({ ...DEFAULT_PARAMS })
    localStorage.removeItem('hero-illustration-params')
  }, [])

  return (
    <>
      <HeroIllustration params={params} />
      {import.meta.env.DEV && (
        <DevControls
          params={params}
          onChange={handleParamsChange}
          onReset={handleReset}
        />
      )}
    </>
  )
}
