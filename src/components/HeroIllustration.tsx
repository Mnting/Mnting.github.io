import { useRef, useEffect, useCallback, useState } from 'react'
import { DevControls } from './DevControls'

// ============================================================
// Default parameters
// ============================================================

export interface HeroParams {
  trailControl1X: number
  trailControl1Y: number
  trailControl2X: number
  trailControl2Y: number
  trailEndX: number
  trailEndY: number
  trailStartWidth: number
  trailEndWidth: number
  colorHueShift: number
  colorSaturation: number
  trailOpacity: number
  trailGlow: number
  flowSpeed: number
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
// Color palette
// ============================================================

const TRAIL_COLORS = [
  { r: 232, g: 64, b: 13 },
  { r: 255, g: 180, b: 120 },
  { r: 255, g: 238, b: 216 },
  { r: 208, g: 178, b: 255 },
  { r: 153, g: 255, b: 249 },
]

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360 / 360
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h * 12) % 12
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
  }
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

// ============================================================
// Bezier helpers
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
// HeroIllustration
// ============================================================

interface Props {
  params: HeroParams
}

export default function HeroIllustration({ params }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const paramsRef = useRef(params)
  paramsRef.current = params // always latest

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let running = true
    let lastTime = performance.now()
    let elapsed = 0

    const loop = (now: number) => {
      if (!running) return

      const dt = Math.min((now - lastTime) / 1000, 0.1) // cap at 100ms to avoid jumps
      lastTime = now
      elapsed += dt

      const p = paramsRef.current

      // Resize if needed
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

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const flowOffset = (elapsed % p.flowSpeed) / p.flowSpeed

      // Compute positions
      const startX = p.planeX * w
      const startY = p.planeY * h
      const cp1x = p.trailControl1X * w
      const cp1y = p.trailControl1Y * h
      const cp2x = p.trailControl2X * w
      const cp2y = p.trailControl2Y * h
      const endX = p.trailEndX * w
      const endY = p.trailEndY * h

      // ---- Trail ----
      ctx.save()

      const SAMPLES = 80
      const topPts: [number, number][] = []
      const botPts: [number, number][] = []

      for (let i = 0; i <= SAMPLES; i++) {
        const s = i / SAMPLES
        const x = cubicBezier(s, startX, cp1x, cp2x, endX)
        const y = cubicBezier(s, startY, cp1y, cp2y, endY)
        const dx = cubicBezierDerivative(s, startX, cp1x, cp2x, endX)
        const dy = cubicBezierDerivative(s, startY, cp1y, cp2y, endY)
        const len = Math.sqrt(dx * dx + dy * dy) || 1
        const nx = -dy / len
        const ny = dx / len
        const hw = (p.trailStartWidth + (p.trailEndWidth - p.trailStartWidth) * s) / 2
        topPts.push([x + nx * hw, y + ny * hw])
        botPts.push([x - nx * hw, y - ny * hw])
      }

      ctx.beginPath()
      ctx.moveTo(topPts[0][0], topPts[0][1])
      for (let i = 1; i < topPts.length; i++) ctx.lineTo(topPts[i][0], topPts[i][1])
      for (let i = botPts.length - 1; i >= 0; i--) ctx.lineTo(botPts[i][0], botPts[i][1])
      ctx.closePath()

      const gx1 = startX + flowOffset * (endX - startX)
      const gy1 = startY + flowOffset * (endY - startY)
      const gx2 = endX + flowOffset * (endX - startX)
      const gy2 = endY + flowOffset * (endY - startY)
      const grad = ctx.createLinearGradient(gx1, gy1, gx2, gy2)

      for (let i = 0; i < TRAIL_COLORS.length; i++) {
        let pos = (i + flowOffset) / (TRAIL_COLORS.length - 1)
        if (pos > 1) pos -= 1
        const { r, g, b } = TRAIL_COLORS[i]
        const [hr, hg, hb] = hslToRgb(
          (r / 255) * 360 + p.colorHueShift,
          p.colorSaturation / 100,
          0.5 + (b / 255) * 0.3,
        )
        grad.addColorStop(pos, `rgb(${hr},${hg},${hb})`)
      }

      ctx.fillStyle = grad
      ctx.globalAlpha = p.trailOpacity
      if (p.trailGlow > 0) {
        ctx.shadowColor = 'rgba(232, 64, 13, 0.5)'
        ctx.shadowBlur = p.trailGlow
      }
      ctx.fill()
      ctx.restore()

      // ---- Airplane ----
      ctx.save()
      const floatOffset = Math.sin((elapsed / p.floatSpeed) * Math.PI * 2) * p.floatAmplitude
      const px = startX
      const py = startY + floatOffset

      ctx.translate(px, py)
      ctx.rotate((p.planeRotation * Math.PI) / 180)
      ctx.scale(p.planeScale, p.planeScale)

      const bw = 80, bh = 18, br = 9

      // Fuselage
      ctx.beginPath()
      ctx.moveTo(-bw / 2 + br, -bh / 2)
      ctx.lineTo(bw / 2 - br, -bh / 2)
      ctx.arcTo(bw / 2, -bh / 2, bw / 2, -bh / 2 + br, br)
      ctx.lineTo(bw / 2, bh / 2 - br)
      ctx.arcTo(bw / 2, bh / 2, bw / 2 - br, bh / 2, br)
      ctx.lineTo(-bw / 2 + br, bh / 2)
      ctx.arcTo(-bw / 2, bh / 2, -bw / 2, bh / 2 - br, br)
      ctx.lineTo(-bw / 2, -bh / 2 + br)
      ctx.arcTo(-bw / 2, -bh / 2, -bw / 2 + br, -bh / 2, br)
      ctx.closePath()
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.strokeStyle = '#111111'
      ctx.lineWidth = 2
      ctx.stroke()

      // Cockpit
      ctx.beginPath()
      ctx.arc(bw / 2 - 18, 0, 6, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(153, 255, 249, 0.4)'
      ctx.fill()
      ctx.strokeStyle = '#111111'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Upper wing
      ctx.beginPath()
      ctx.moveTo(-12, -bh / 2)
      ctx.lineTo(8, -bh / 2 - 28)
      ctx.lineTo(18, -bh / 2 - 26)
      ctx.lineTo(2, -bh / 2)
      ctx.closePath()
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.strokeStyle = '#111111'
      ctx.lineWidth = 2
      ctx.stroke()

      // Lower wing
      ctx.beginPath()
      ctx.moveTo(-12, bh / 2)
      ctx.lineTo(8, bh / 2 + 28)
      ctx.lineTo(18, bh / 2 + 26)
      ctx.lineTo(2, bh / 2)
      ctx.closePath()
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.strokeStyle = '#111111'
      ctx.lineWidth = 2
      ctx.stroke()

      // Tail fin
      ctx.beginPath()
      ctx.moveTo(-bw / 2 + 5, -bh / 2)
      ctx.lineTo(-bw / 2 - 8, -bh / 2 - 20)
      ctx.lineTo(-bw / 2 + 2, -bh / 2 - 16)
      ctx.closePath()
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.strokeStyle = '#111111'
      ctx.lineWidth = 2
      ctx.stroke()

      // Tail stabilizer
      ctx.beginPath()
      ctx.moveTo(-bw / 2 + 8, -bh / 2 + 2)
      ctx.lineTo(-bw / 2 - 6, -bh / 2 - 4)
      ctx.strokeStyle = '#111111'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(-bw / 2 + 8, bh / 2 - 2)
      ctx.lineTo(-bw / 2 - 6, bh / 2 + 4)
      ctx.stroke()

      // Propeller hub
      ctx.beginPath()
      ctx.arc(bw / 2 + 4, 0, 6, 0, Math.PI * 2)
      ctx.fillStyle = 'hsl(14, 90%, 48%)'
      ctx.fill()
      ctx.strokeStyle = '#111111'
      ctx.lineWidth = 2
      ctx.stroke()

      // Propeller blades
      ctx.save()
      ctx.translate(bw / 2 + 4, 0)
      ctx.rotate(elapsed * 8)
      ctx.beginPath()
      ctx.moveTo(0, -3)
      ctx.lineTo(0, -20)
      ctx.lineTo(3, -18)
      ctx.closePath()
      ctx.fillStyle = '#111111'
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(0, 3)
      ctx.lineTo(0, 20)
      ctx.lineTo(-3, 18)
      ctx.closePath()
      ctx.fill()
      ctx.restore()

      ctx.restore()

      // ---- Character ----
      ctx.save()
      ctx.translate(px, py)
      ctx.rotate((p.planeRotation * Math.PI) / 180)
      ctx.scale(p.planeScale, p.planeScale)

      const cx = 10, cy = -bh / 2 - 6

      // Head
      ctx.beginPath()
      ctx.arc(cx, cy - 10, 10, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.strokeStyle = '#111111'
      ctx.lineWidth = 2
      ctx.stroke()

      // Smile
      ctx.beginPath()
      ctx.arc(cx, cy - 10, 5, 0.2, Math.PI - 0.2)
      ctx.strokeStyle = '#111111'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Eyes
      ctx.beginPath()
      ctx.arc(cx - 3, cy - 13, 1.5, 0, Math.PI * 2)
      ctx.fillStyle = '#111111'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + 3, cy - 13, 1.5, 0, Math.PI * 2)
      ctx.fill()

      // Body
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx, cy + 16)
      ctx.strokeStyle = '#111111'
      ctx.lineWidth = 2
      ctx.stroke()

      // Arms
      ctx.beginPath()
      ctx.moveTo(cx, cy + 4)
      ctx.lineTo(cx - 10, cy + 10)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx, cy + 4)
      ctx.lineTo(cx + 10, cy + 10)
      ctx.stroke()

      // Legs
      ctx.beginPath()
      ctx.moveTo(cx, cy + 16)
      ctx.lineTo(cx - 6, cy + 24)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx, cy + 16)
      ctx.lineTo(cx + 6, cy + 24)
      ctx.stroke()

      ctx.restore()

      requestAnimationFrame(loop)
    }

    requestAnimationFrame(loop)

    const resizeObserver = new ResizeObserver(() => {
      // Resize handled in next frame
    })
    resizeObserver.observe(container)

    return () => {
      running = false
      resizeObserver.disconnect()
    }
  }, []) // effect runs once, params read via ref

  return (
    <div ref={containerRef} className="absolute inset-0 z-10 pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  )
}

// ============================================================
// Main component with dev controls
// ============================================================

export function HeroIllustrationWithControls() {
  const [params, setParams] = useState<HeroParams>(() => {
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
