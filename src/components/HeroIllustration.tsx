import { useRef, useEffect, useCallback, useState } from 'react'
import { DevControls } from './DevControls'

// ============================================================
// Default parameters
// ============================================================

export interface HeroParams {
  // Trail shape
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

  // Ink wash effects
  trailNoiseAmp: number
  trailNoiseFreq: number
  trailNoiseSpeed: number
  trailLayers: number
  blobCount: number
  blobSize: number
  blobDriftSpeed: number
  blurAmount: number

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
  trailStartWidth: 6,
  trailEndWidth: 200,

  colorHueShift: 0,
  colorSaturation: 100,
  trailOpacity: 0.4,
  trailGlow: 8,
  flowSpeed: 15,

  trailNoiseAmp: 30,
  trailNoiseFreq: 0.05,
  trailNoiseSpeed: 0.6,
  trailLayers: 4,
  blobCount: 5,
  blobSize: 140,
  blobDriftSpeed: 0.4,
  blurAmount: 8,

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
  { r: 232, g: 64, b: 13 },   // phoenix orange
  { r: 255, g: 170, b: 110 }, // warm peach
  { r: 255, g: 235, b: 210 }, // light peach
  { r: 208, g: 178, b: 255 }, // lavender
  { r: 153, g: 255, b: 249 }, // cyan glow
]

// ============================================================
// Noise function (value noise)
// ============================================================

function hash(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 17.31) * 43758.5453
  return n - Math.floor(n)
}

function noise2D(x: number, y: number, seed: number): number {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  const n00 = hash(ix, iy, seed)
  const n10 = hash(ix + 1, iy, seed)
  const n01 = hash(ix, iy + 1, seed)
  const n11 = hash(ix + 1, iy + 1, seed)
  const nx0 = n00 + (n10 - n00) * sx
  const nx1 = n01 + (n11 - n01) * sx
  return (nx0 + (nx1 - nx0) * sy) * 2 - 1
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
  paramsRef.current = params

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let running = true
    let lastTime = performance.now()
    let elapsed = 0

    // Pre-compute bezier centerline samples (shape doesn't change with time)
    // We cache per canvas size to avoid recomputing
    let cachedW = 0, cachedH = 0
    let cachedCenterline: { x: number; y: number; nx: number; ny: number }[] = []

    const loop = (now: number) => {
      if (!running) return

      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now
      elapsed += dt

      const p = paramsRef.current

      // Resize
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const w = rect.width
      const h = rect.height
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
        canvas.style.width = `${w}px`
        canvas.style.height = `${h}px`
        cachedW = 0 // invalidate cache
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      // Compute bezier points
      const startX = p.planeX * w
      const startY = p.planeY * h
      const cp1x = p.trailControl1X * w
      const cp1y = p.trailControl1Y * h
      const cp2x = p.trailControl2X * w
      const cp2y = p.trailControl2Y * h
      const endX = p.trailEndX * w
      const endY = p.trailEndY * h

      // Cache centerline
      if (cachedW !== w || cachedH !== h) {
        cachedW = w; cachedH = h
        cachedCenterline = []
        const SAMPLES = 100
        for (let i = 0; i <= SAMPLES; i++) {
          const t = i / SAMPLES
          const x = cubicBezier(t, startX, cp1x, cp2x, endX)
          const y = cubicBezier(t, startY, cp1y, cp2y, endY)
          const dx = cubicBezierDerivative(t, startX, cp1x, cp2x, endX)
          const dy = cubicBezierDerivative(t, startY, cp1y, cp2y, endY)
          const len = Math.sqrt(dx * dx + dy * dy) || 1
          cachedCenterline.push({ x, y, nx: -dy / len, ny: dx / len })
        }
      }

      // ---- Draw trail: multi-layer with noise ----
      for (let layer = 0; layer < p.trailLayers; layer++) {
        const seed = layer * 7 + 3
        const layerAlpha = p.trailOpacity * (0.3 + 0.7 * (1 - layer / p.trailLayers))
        const layerWidthMul = 1 + layer * 0.25 // each layer slightly wider

        ctx.save()
        ctx.globalAlpha = layerAlpha

        // Build noisy path
        ctx.beginPath()
        let first = true
        for (let i = 0; i < cachedCenterline.length; i++) {
          const pt = cachedCenterline[i]
          const t = i / (cachedCenterline.length - 1)
          const baseHW = (p.trailStartWidth + (p.trailEndWidth - p.trailStartWidth) * t) / 2 * layerWidthMul

          // Noise along the edge
          const sampleX = i * p.trailNoiseFreq * 100
          const sampleY = elapsed * p.trailNoiseSpeed * 3
          const noiseVal = noise2D(sampleX, sampleY + seed, seed) * p.trailNoiseAmp

          const hw = Math.max(0, baseHW + noiseVal)
          const ex = pt.x + pt.nx * hw
          const ey = pt.y + pt.ny * hw

          if (first) { ctx.moveTo(ex, ey); first = false }
          else ctx.lineTo(ex, ey)
        }
        // Bottom edge (reverse, with different noise)
        for (let i = cachedCenterline.length - 1; i >= 0; i--) {
          const pt = cachedCenterline[i]
          const t = i / (cachedCenterline.length - 1)
          const baseHW = (p.trailStartWidth + (p.trailEndWidth - p.trailStartWidth) * t) / 2 * layerWidthMul

          const sampleX = i * p.trailNoiseFreq * 100 + 50 // offset for different noise
          const sampleY = elapsed * p.trailNoiseSpeed * 3
          const noiseVal = noise2D(sampleX, sampleY + seed + 1, seed + 1) * p.trailNoiseAmp

          const hw = Math.max(0, baseHW + noiseVal)
          const ex = pt.x - pt.nx * hw
          const ey = pt.y - pt.ny * hw
          ctx.lineTo(ex, ey)
        }
        ctx.closePath()

        // Base fill with soft gradient
        const grad = ctx.createLinearGradient(startX, startY, endX, endY)
        for (let i = 0; i < TRAIL_COLORS.length; i++) {
          const pos = i / (TRAIL_COLORS.length - 1)
          const idx = Math.floor(pos * (TRAIL_COLORS.length - 1))
          const { r, g, b } = TRAIL_COLORS[idx]
          grad.addColorStop(pos, `rgba(${r},${g},${b},0.5)`)
        }
        ctx.fillStyle = grad
        ctx.fill()

        ctx.restore()
      }

      // ---- Color blobs (ink bleeding) ----
      // Use trail shape as clip
      ctx.save()
      // Build rough clip path from first layer's data
      const cl = cachedCenterline
      ctx.beginPath()
      ctx.moveTo(cl[0].x, cl[0].y)
      for (let i = 1; i < cl.length; i++) ctx.lineTo(cl[i].x, cl[i].y)
      const avgHW = (p.trailStartWidth + p.trailEndWidth) / 2 + p.trailNoiseAmp * 2
      for (let i = cl.length - 1; i >= 0; i--) {
        ctx.lineTo(cl[i].x - cl[i].nx * avgHW * (0.5 + i / cl.length * 0.5),
                  cl[i].y - cl[i].ny * avgHW * (0.5 + i / cl.length * 0.5))
      }
      ctx.closePath()
      ctx.clip()

      // Draw color blobs
      for (let b = 0; b < p.blobCount; b++) {
        // Each blob drifts along the trail at its own speed
        const tBase = (b / p.blobCount + 0.5 / p.blobCount) // evenly spaced
        const tOffset = Math.sin(elapsed * p.blobDriftSpeed * (0.7 + b * 0.3) + b * 2.1) * 0.15
        let t = tBase + tOffset
        t = ((t % 1) + 1) % 1 // wrap [0, 1]

        // Position on centerline
        const idx = Math.floor(t * (cl.length - 1))
        const pt = cl[Math.min(idx, cl.length - 1)]
        const blobX = pt.x + (Math.random() - 0.5) * 30 // slight random offset
        const blobY = pt.y + (Math.random() - 0.5) * 30

        // Color from palette
        const colorIdx = b % TRAIL_COLORS.length
        const { r, g, b: bl } = TRAIL_COLORS[colorIdx]

        // Radial gradient blob
        const blobGrad = ctx.createRadialGradient(blobX, blobY, 0, blobX, blobY, p.blobSize * (0.6 + 0.4 * Math.sin(elapsed + b)))
        blobGrad.addColorStop(0, `rgba(${r},${g},${bl},0.35)`)
        blobGrad.addColorStop(0.5, `rgba(${r},${g},${bl},0.12)`)
        blobGrad.addColorStop(1, `rgba(${r},${g},${bl},0)`)

        ctx.fillStyle = blobGrad
        ctx.fillRect(blobX - p.blobSize, blobY - p.blobSize, p.blobSize * 2, p.blobSize * 2)
      }

      ctx.restore()

      // ---- Final blur overlay for watercolor diffusion ----
      if (p.blurAmount > 0) {
        ctx.save()
        ctx.filter = `blur(${p.blurAmount}px)`
        ctx.globalAlpha = 0.3
        // Redraw a simplified trail shape blurred
        ctx.beginPath()
        ctx.moveTo(cl[0].x, cl[0].y)
        for (let i = 1; i < cl.length; i++) ctx.lineTo(cl[i].x, cl[i].y)
        for (let i = cl.length - 1; i >= 0; i--) {
          const t = i / (cl.length - 1)
          const hw = (p.trailStartWidth + (p.trailEndWidth - p.trailStartWidth) * t) / 2 + p.trailNoiseAmp
          ctx.lineTo(cl[i].x - cl[i].nx * hw, cl[i].y - cl[i].ny * hw)
        }
        ctx.closePath()
        ctx.fillStyle = `rgba(208,178,255,0.15)`
        ctx.fill()
        ctx.restore()
      }

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

      // Wings
      for (const sign of [-1, 1]) {
        ctx.beginPath()
        ctx.moveTo(-12, sign * bh / 2)
        ctx.lineTo(8, sign * (bh / 2 + 28))
        ctx.lineTo(18, sign * (bh / 2 + 26))
        ctx.lineTo(2, sign * bh / 2)
        ctx.closePath()
        ctx.fillStyle = '#ffffff'
        ctx.fill()
        ctx.strokeStyle = '#111111'
        ctx.lineWidth = 2
        ctx.stroke()
      }

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

      // Propeller
      ctx.beginPath()
      ctx.arc(bw / 2 + 4, 0, 6, 0, Math.PI * 2)
      ctx.fillStyle = 'hsl(14, 90%, 48%)'
      ctx.fill()
      ctx.strokeStyle = '#111111'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.save()
      ctx.translate(bw / 2 + 4, 0)
      ctx.rotate(elapsed * 8)
      ctx.beginPath()
      ctx.moveTo(0, -3); ctx.lineTo(0, -20); ctx.lineTo(3, -18); ctx.closePath()
      ctx.fillStyle = '#111111'; ctx.fill()
      ctx.beginPath()
      ctx.moveTo(0, 3); ctx.lineTo(0, 20); ctx.lineTo(-3, 18); ctx.closePath()
      ctx.fill()
      ctx.restore()

      ctx.restore()

      // ---- Character ----
      ctx.save()
      ctx.translate(px, py)
      ctx.rotate((p.planeRotation * Math.PI) / 180)
      ctx.scale(p.planeScale, p.planeScale)

      const cx = 10, cy = -bh / 2 - 6

      ctx.beginPath()
      ctx.arc(cx, cy - 10, 10, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'; ctx.fill()
      ctx.strokeStyle = '#111111'; ctx.lineWidth = 2; ctx.stroke()

      ctx.beginPath()
      ctx.arc(cx, cy - 10, 5, 0.2, Math.PI - 0.2)
      ctx.strokeStyle = '#111111'; ctx.lineWidth = 1.5; ctx.stroke()

      ctx.beginPath(); ctx.arc(cx - 3, cy - 13, 1.5, 0, Math.PI * 2); ctx.fillStyle = '#111111'; ctx.fill()
      ctx.beginPath(); ctx.arc(cx + 3, cy - 13, 1.5, 0, Math.PI * 2); ctx.fill()

      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + 16)
      ctx.strokeStyle = '#111111'; ctx.lineWidth = 2; ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx, cy + 4); ctx.lineTo(cx - 10, cy + 10); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx, cy + 4); ctx.lineTo(cx + 10, cy + 10); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx, cy + 16); ctx.lineTo(cx - 6, cy + 24); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx, cy + 16); ctx.lineTo(cx + 6, cy + 24); ctx.stroke()

      ctx.restore()

      requestAnimationFrame(loop)
    }

    requestAnimationFrame(loop)

    const resizeObserver = new ResizeObserver(() => {})
    resizeObserver.observe(container)

    return () => {
      running = false
      resizeObserver.disconnect()
    }
  }, [])

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
