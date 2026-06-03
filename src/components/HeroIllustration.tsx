import { useRef, useEffect, useCallback, useState } from 'react'
import { DevControls } from './DevControls'

// ============================================================
// Parameters
// ============================================================

export interface HeroParams {
  // S-curve shape (two cubic bezier segments)
  trailMidX: number
  trailMidY: number
  trailCp1X: number
  trailCp1Y: number
  trailCp2X: number
  trailCp2Y: number
  trailEndX: number
  trailEndY: number
  trailStartWidth: number
  trailEndWidth: number

  // Color zones
  purpleZoneStart: number   // 0-1, where purple begins
  blendWidth: number         // 0-0.3, width of blend zone
  warmBlobCount: number
  coolBlobCount: number
  blobSize: number
  blobDriftSpeed: number

  // Organic edge
  edgeWobbleAmp: number      // 0-60
  trailLayers: number        // 1-5

  // Global
  trailOpacity: number
  trailGlow: number
  blurAmount: number

  // Plane
  planeX: number
  planeY: number
  planeScale: number
  planeRotation: number
  floatAmplitude: number
  floatSpeed: number
}

export const DEFAULT_PARAMS: HeroParams = {
  trailMidX: 0.55,
  trailMidY: 0.25,
  trailCp1X: 0.92,
  trailCp1Y: 0.05,
  trailCp2X: 0.65,
  trailCp2Y: 0.55,
  trailEndX: 0.02,
  trailEndY: 0.82,
  trailStartWidth: 5,
  trailEndWidth: 220,

  purpleZoneStart: 0.65,
  blendWidth: 0.12,
  warmBlobCount: 5,
  coolBlobCount: 4,
  blobSize: 130,
  blobDriftSpeed: 0.35,

  edgeWobbleAmp: 28,
  trailLayers: 4,

  trailOpacity: 0.38,
  trailGlow: 6,
  blurAmount: 6,

  planeX: 0.82,
  planeY: 0.18,
  planeScale: 1,
  planeRotation: -15,
  floatAmplitude: 6,
  floatSpeed: 5,
}

// ============================================================
// Color palettes (from design.md)
// ============================================================

const WARM_COLORS = [
  { r: 232, g: 64, b: 13 },    // Phoenix Orange
  { r: 225, g: 101, b: 64 },   // LeadGen Red
  { r: 255, g: 215, b: 240 },  // Petal Pink
  { r: 255, g: 180, b: 120 },  // Warm Peach
]

const COOL_COLORS = [
  { r: 226, g: 221, b: 253 },  // Subtle Lavender
  { r: 46, g: 36, b: 96 },     // Midnight Violet
  { r: 16, g: 5, b: 77 },      // Deep Indigo
  { r: 180, g: 150, b: 240 },  // Medium Purple
]

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

// Sample a two-segment cubic bezier S-curve
// Returns array of {x, y, nx, ny, t} where t is overall [0,1]
function sampleSCurve(
  samples: number,
  x0: number, y0: number,
  cp1x: number, cp1y: number,
  midX: number, midY: number,
  cp2x: number, cp2y: number,
  endX: number, endY: number,
) {
  const result: { x: number; y: number; nx: number; ny: number; t: number }[] = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    let x: number, y: number, dx: number, dy: number
    if (t <= 0.5) {
      const localT = t * 2 // [0,1] in first segment
      x = cubicBezier(localT, x0, cp1x, cp1x, midX)
      y = cubicBezier(localT, y0, cp1y, cp1y, midY)
      dx = cubicBezierDerivative(localT, x0, cp1x, cp1x, midX)
      dy = cubicBezierDerivative(localT, y0, cp1y, cp1y, midY)
    } else {
      const localT = (t - 0.5) * 2 // [0,1] in second segment
      x = cubicBezier(localT, midX, cp2x, cp2x, endX)
      y = cubicBezier(localT, midY, cp2y, cp2y, endY)
      dx = cubicBezierDerivative(localT, midX, cp2x, cp2x, endX)
      dy = cubicBezierDerivative(localT, midY, cp2y, cp2y, endY)
    }
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    result.push({ x, y, nx: -dy / len, ny: dx / len, t })
  }
  return result
}

// ============================================================
// Organic edge offset using multi-frequency sine superposition
// ============================================================

const WOBBLE_FREQS = [1.0, 2.4, 5.7, 11.3]
const WOBBLE_PHASES = [0, 1.3, 2.7, 4.1]
const WOBBLE_SPEEDS = [0.25, 0.4, 0.6, 0.85]
const WOBBLE_WEIGHTS = [1.0, 0.55, 0.28, 0.12]

function edgeOffset(t: number, elapsed: number, seed: number, amp: number): number {
  let v = 0
  for (let i = 0; i < WOBBLE_FREQS.length; i++) {
    v += Math.sin(t * WOBBLE_FREQS[i] * Math.PI * 2 + WOBBLE_PHASES[i] + elapsed * WOBBLE_SPEEDS[i] + seed) * WOBBLE_WEIGHTS[i]
  }
  // Add occasional larger perturbation at tail end
  if (t > 0.85) {
    v += Math.sin(t * 1.7 * Math.PI + elapsed * 0.3 + seed * 3) * (t - 0.85) * 6
  }
  return v * amp
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

    // Cache centerline
    let cachedW = 0, cachedH = 0
    let cachedPoints: { x: number; y: number; nx: number; ny: number; t: number }[] = []

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
        cachedW = 0
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      // S-curve points
      const sx = p.planeX * w, sy = p.planeY * h
      const cp1x = p.trailCp1X * w, cp1y = p.trailCp1Y * h
      const mx = p.trailMidX * w, my = p.trailMidY * h
      const cp2x = p.trailCp2X * w, cp2y = p.trailCp2Y * h
      const ex = p.trailEndX * w, ey = p.trailEndY * h

      if (cachedW !== w || cachedH !== h) {
        cachedW = w; cachedH = h
        cachedPoints = sampleSCurve(120, sx, sy, cp1x, cp1y, mx, my, cp2x, cp2y, ex, ey)
      }

      const pts = cachedPoints

      // ---- Draw trail layers with organic edges ----
      for (let layer = 0; layer < p.trailLayers; layer++) {
        const seed = layer * 7.3 + 2
        const alpha = p.trailOpacity * (0.25 + 0.75 * (1 - layer / p.trailLayers))

        ctx.save()
        ctx.globalAlpha = alpha

        ctx.beginPath()
        // Top edge
        for (let i = 0; i < pts.length; i++) {
          const pt = pts[i]
          const baseHW = (p.trailStartWidth + (p.trailEndWidth - p.trailStartWidth) * pt.t) / 2
          const off = edgeOffset(pt.t, elapsed, seed, p.edgeWobbleAmp)
          const hw = Math.max(1, baseHW + off)
          const ex = pt.x + pt.nx * hw, ey = pt.y + pt.ny * hw
          i === 0 ? ctx.moveTo(ex, ey) : ctx.lineTo(ex, ey)
        }
        // Bottom edge
        for (let i = pts.length - 1; i >= 0; i--) {
          const pt = pts[i]
          const baseHW = (p.trailStartWidth + (p.trailEndWidth - p.trailStartWidth) * pt.t) / 2
          const off = edgeOffset(pt.t, elapsed, seed + 1.5, p.edgeWobbleAmp)
          const hw = Math.max(1, baseHW + off)
          const ex = pt.x - pt.nx * hw, ey = pt.y - pt.ny * hw
          ctx.lineTo(ex, ey)
        }
        ctx.closePath()

        // Soft fill
        ctx.fillStyle = 'rgba(255,240,230,0.25)'
        ctx.fill()
        ctx.restore()
      }

      // ---- Color blobs (segmented: warm → purple) ----
      ctx.save()
      // Clip to trail shape
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
      const clipHW = (p.trailStartWidth + p.trailEndWidth) / 2 + p.edgeWobbleAmp * 2
      for (let i = pts.length - 1; i >= 0; i--) {
        const pt = pts[i]
        ctx.lineTo(pt.x - pt.nx * clipHW, pt.y - pt.ny * clipHW)
      }
      ctx.closePath()
      ctx.clip()

      // Warm blobs (before purple zone + blend width)
      for (let b = 0; b < p.warmBlobCount; b++) {
        const tBase = (b / p.warmBlobCount) * (p.purpleZoneStart + p.blendWidth)
        const tOff = Math.sin(elapsed * p.blobDriftSpeed * (0.8 + b * 0.25) + b * 1.7) * 0.08
        const t = Math.max(0, Math.min(1, tBase + tOff))
        const idx = Math.floor(t * (pts.length - 1))
        const pt = pts[Math.min(idx, pts.length - 1)]
        const color = WARM_COLORS[b % WARM_COLORS.length]
        const size = p.blobSize * (0.7 + 0.3 * Math.sin(elapsed * 0.5 + b))

        const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, size)
        grad.addColorStop(0, `rgba(${color.r},${color.g},${color.b},0.4)`)
        grad.addColorStop(0.5, `rgba(${color.r},${color.g},${color.b},0.15)`)
        grad.addColorStop(1, `rgba(${color.r},${color.g},${color.b},0)`)
        ctx.fillStyle = grad
        ctx.fillRect(pt.x - size, pt.y - size, size * 2, size * 2)
      }

      // Cool blobs (after purple zone - blend width)
      const coolStart = Math.max(0, p.purpleZoneStart - p.blendWidth)
      for (let b = 0; b < p.coolBlobCount; b++) {
        const tBase = coolStart + (b / p.coolBlobCount) * (1 - coolStart)
        const tOff = Math.sin(elapsed * p.blobDriftSpeed * (0.7 + b * 0.3) + b * 2.3) * 0.1
        const t = Math.max(0, Math.min(1, tBase + tOff))
        const idx = Math.floor(t * (pts.length - 1))
        const pt = pts[Math.min(idx, pts.length - 1)]
        const color = COOL_COLORS[b % COOL_COLORS.length]
        // Larger blobs in purple zone
        const sizeMul = t > p.purpleZoneStart ? 1.4 : 0.9
        const size = p.blobSize * sizeMul * (0.8 + 0.2 * Math.sin(elapsed * 0.4 + b))

        const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, size)
        grad.addColorStop(0, `rgba(${color.r},${color.g},${color.b},0.45)`)
        grad.addColorStop(0.5, `rgba(${color.r},${color.g},${color.b},0.18)`)
        grad.addColorStop(1, `rgba(${color.r},${color.g},${color.b},0)`)
        ctx.fillStyle = grad
        ctx.fillRect(pt.x - size, pt.y - size, size * 2, size * 2)
      }

      // Blend zone: extra interleaved blobs at intersection
      const bzStart = p.purpleZoneStart - p.blendWidth * 0.5
      const bzEnd = p.purpleZoneStart + p.blendWidth * 0.5
      for (let b = 0; b < 3; b++) {
        const tBase = bzStart + (b / 2) * (bzEnd - bzStart)
        const tOff = Math.sin(elapsed * 0.6 + b * 3.1) * p.blendWidth * 0.3
        const t = Math.max(0, Math.min(1, tBase + tOff))
        const idx = Math.floor(t * (pts.length - 1))
        const pt = pts[Math.min(idx, pts.length - 1)]
        // Alternate warm and cool colors
        const warmColor = WARM_COLORS[b % WARM_COLORS.length]
        const coolColor = COOL_COLORS[b % COOL_COLORS.length]

        for (const color of [warmColor, coolColor]) {
          const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, p.blobSize * 0.8)
          grad.addColorStop(0, `rgba(${color.r},${color.g},${color.b},0.3)`)
          grad.addColorStop(0.6, `rgba(${color.r},${color.g},${color.b},0.08)`)
          grad.addColorStop(1, `rgba(${color.r},${color.g},${color.b},0)`)
          ctx.fillStyle = grad
          ctx.fillRect(pt.x - p.blobSize, pt.y - p.blobSize, p.blobSize * 2, p.blobSize * 2)
        }
      }

      ctx.restore()

      // ---- Global blur diffusion ----
      if (p.blurAmount > 0) {
        ctx.save()
        ctx.filter = `blur(${p.blurAmount}px)`
        ctx.globalAlpha = 0.25
        ctx.beginPath()
        ctx.moveTo(pts[0].x, pts[0].y)
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
        for (let i = pts.length - 1; i >= 0; i--) {
          const pt = pts[i]
          const hw = (p.trailStartWidth + (p.trailEndWidth - p.trailStartWidth) * pt.t) / 2 + p.edgeWobbleAmp
          ctx.lineTo(pt.x - pt.nx * hw, pt.y - pt.ny * hw)
        }
        ctx.closePath()
        ctx.fillStyle = 'rgba(180,150,220,0.15)'
        ctx.fill()
        ctx.restore()
      }

      // ---- Airplane ----
      ctx.save()
      const floatOff = Math.sin((elapsed / p.floatSpeed) * Math.PI * 2) * p.floatAmplitude
      ctx.translate(sx, sy + floatOff)
      ctx.rotate((p.planeRotation * Math.PI) / 180)
      ctx.scale(p.planeScale, p.planeScale)

      const bw = 80, bh = 18, br = 9

      ctx.beginPath()
      ctx.moveTo(-bw/2+br, -bh/2); ctx.lineTo(bw/2-br, -bh/2)
      ctx.arcTo(bw/2, -bh/2, bw/2, -bh/2+br, br); ctx.lineTo(bw/2, bh/2-br)
      ctx.arcTo(bw/2, bh/2, bw/2-br, bh/2, br); ctx.lineTo(-bw/2+br, bh/2)
      ctx.arcTo(-bw/2, bh/2, -bw/2, bh/2-br, br); ctx.lineTo(-bw/2, -bh/2+br)
      ctx.arcTo(-bw/2, -bh/2, -bw/2+br, -bh/2, br)
      ctx.closePath()
      ctx.fillStyle = '#fff'; ctx.fill()
      ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.stroke()

      ctx.beginPath(); ctx.arc(bw/2-18, 0, 6, 0, Math.PI*2)
      ctx.fillStyle = 'rgba(153,255,249,0.4)'; ctx.fill()
      ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5; ctx.stroke()

      for (const s of [-1, 1]) {
        ctx.beginPath()
        ctx.moveTo(-12, s*bh/2); ctx.lineTo(8, s*(bh/2+28))
        ctx.lineTo(18, s*(bh/2+26)); ctx.lineTo(2, s*bh/2)
        ctx.closePath()
        ctx.fillStyle = '#fff'; ctx.fill()
        ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.stroke()
      }

      ctx.beginPath()
      ctx.moveTo(-bw/2+5, -bh/2); ctx.lineTo(-bw/2-8, -bh/2-20)
      ctx.lineTo(-bw/2+2, -bh/2-16); ctx.closePath()
      ctx.fillStyle = '#fff'; ctx.fill()
      ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.stroke()

      ctx.beginPath(); ctx.moveTo(-bw/2+8, -bh/2+2); ctx.lineTo(-bw/2-6, -bh/2-4)
      ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.stroke()
      ctx.beginPath(); ctx.moveTo(-bw/2+8, bh/2-2); ctx.lineTo(-bw/2-6, bh/2+4); ctx.stroke()

      ctx.beginPath(); ctx.arc(bw/2+4, 0, 6, 0, Math.PI*2)
      ctx.fillStyle = 'hsl(14,90%,48%)'; ctx.fill()
      ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.stroke()

      ctx.save(); ctx.translate(bw/2+4, 0); ctx.rotate(elapsed*8)
      ctx.beginPath(); ctx.moveTo(0,-3); ctx.lineTo(0,-20); ctx.lineTo(3,-18); ctx.closePath()
      ctx.fillStyle = '#111'; ctx.fill()
      ctx.beginPath(); ctx.moveTo(0,3); ctx.lineTo(0,20); ctx.lineTo(-3,18); ctx.closePath(); ctx.fill()
      ctx.restore()

      ctx.restore()

      // ---- Character ----
      ctx.save()
      ctx.translate(sx, sy + floatOff)
      ctx.rotate((p.planeRotation * Math.PI) / 180)
      ctx.scale(p.planeScale, p.planeScale)

      const cx = 10, cy = -bh/2 - 6
      ctx.beginPath(); ctx.arc(cx, cy-10, 10, 0, Math.PI*2)
      ctx.fillStyle = '#fff'; ctx.fill()
      ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.stroke()
      ctx.beginPath(); ctx.arc(cx, cy-10, 5, 0.2, Math.PI-0.2)
      ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5; ctx.stroke()
      ctx.beginPath(); ctx.arc(cx-3, cy-13, 1.5, 0, Math.PI*2); ctx.fillStyle = '#111'; ctx.fill()
      ctx.beginPath(); ctx.arc(cx+3, cy-13, 1.5, 0, Math.PI*2); ctx.fill()
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy+16)
      ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx, cy+4); ctx.lineTo(cx-10, cy+10); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx, cy+4); ctx.lineTo(cx+10, cy+10); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx, cy+16); ctx.lineTo(cx-6, cy+24); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx, cy+16); ctx.lineTo(cx+6, cy+24); ctx.stroke()
      ctx.restore()

      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)

    const ro = new ResizeObserver(() => {})
    ro.observe(container)
    return () => { running = false; ro.disconnect() }
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-0 z-10 pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  )
}

// ============================================================
// With dev controls
// ============================================================

export function HeroIllustrationWithControls() {
  const [params, setParams] = useState<HeroParams>(() => {
    try {
      const saved = localStorage.getItem('hero-illustration-params')
      if (saved) return { ...DEFAULT_PARAMS, ...JSON.parse(saved) }
    } catch { /* */ }
    return { ...DEFAULT_PARAMS }
  })

  return (
    <>
      <HeroIllustration params={params} />
      {import.meta.env.DEV && (
        <DevControls params={params} onChange={setParams} onReset={() => {
          setParams({ ...DEFAULT_PARAMS })
          localStorage.removeItem('hero-illustration-params')
        }} />
      )}
    </>
  )
}
