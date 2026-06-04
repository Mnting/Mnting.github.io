import { useRef, useEffect, useState } from 'react'
import { DevControls } from './DevControls'

export interface HeroParams {
  trailControl1X: number
  trailControl1Y: number
  trailControl2X: number
  trailControl2Y: number
  trailEndX: number
  trailEndY: number
  trailStartWidth: number
  trailEndWidth: number
  purpleZoneEnd: number
  blendWidth: number
  edgeWobbleAmp: number
  trailLayers: number
  trailOpacity: number
  trailGlow: number
  blurAmount: number
  planeX: number
  planeY: number
  planeScale: number
  planeRotation: number
  floatAmplitude: number
  floatSpeed: number
}

export const DEFAULT_PARAMS: HeroParams = {
  trailControl1X: 0.62, trailControl1Y: 0.32,
  trailControl2X: 0.30, trailControl2Y: 0.48,
  trailEndX: 0.05, trailEndY: 0.58,
  trailStartWidth: 6, trailEndWidth: 280,
  purpleZoneEnd: 0.67, blendWidth: 0.08,
  edgeWobbleAmp: 12, trailLayers: 3,
  trailOpacity: 0.55, trailGlow: 12, blurAmount: 8,
  planeX: 0.82, planeY: 0.28,
  planeScale: 1.0, planeRotation: -15,
  floatAmplitude: 5, floatSpeed: 5,
}

/* ========== Math Utilities ========== */

function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const u = 1 - t
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
}

function cubicBezierDeriv(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const u = 1 - t
  return 3 * u * u * (p1 - p0) + 6 * u * t * (p2 - p1) + 3 * t * t * (p3 - p2)
}

// Soft organic wobble for watercolor edges
function edgeWobble(t: number, elapsed: number, seed: number, amp: number): number {
  const f1 = Math.sin(t * 3.2 * Math.PI + seed * 1.7 + elapsed * 0.3) * 0.5
  const f2 = Math.sin(t * 5.8 * Math.PI + seed * 2.9 + elapsed * 0.2) * 0.3
  const f3 = Math.sin(t * 9.4 * Math.PI + seed * 4.3 + elapsed * 0.15) * 0.15
  const f4 = Math.sin(t * 1.5 * Math.PI + seed * 0.8 + elapsed * 0.4) * 0.05
  return (f1 + f2 + f3 + f4) * amp
}

// Deterministic pseudo-random
function prand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

/* ========== Trail Point Cache ========== */
interface TrailPt {
  x: number; y: number; nx: number; ny: number; t: number
}

/* ========== Noise Texture Cache ========== */
let noisePattern: CanvasPattern | null = null
function getNoisePattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (noisePattern) return noisePattern
  const size = 128
  const offscreen = document.createElement('canvas')
  offscreen.width = size
  offscreen.height = size
  const octx = offscreen.getContext('2d')!
  const imgData = octx.createImageData(size, size)
  for (let i = 0; i < imgData.data.length; i += 4) {
    const v = Math.random() * 255
    imgData.data[i] = v
    imgData.data[i + 1] = v
    imgData.data[i + 2] = v
    imgData.data[i + 3] = 28 // subtle alpha
  }
  octx.putImageData(imgData, 0, 0)
  noisePattern = ctx.createPattern(offscreen, 'repeat')
  return noisePattern
}

/* ========== Component ========== */

interface Props { params: HeroParams }

export default function HeroIllustration({ params }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pRef = useRef(params)
  pRef.current = params

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let running = true
    let lastTime = performance.now()
    let elapsed = 0
    let pts: TrailPt[] = []

    const SAMPLES = 160

    const rebuildPoints = (w: number, h: number, p: HeroParams) => {
      const sx = p.planeX * w, sy = p.planeY * h
      const c1x = p.trailControl1X * w, c1y = p.trailControl1Y * h
      const c2x = p.trailControl2X * w, c2y = p.trailControl2Y * h
      const ex = p.trailEndX * w, ey = p.trailEndY * h
      pts = []
      for (let i = 0; i <= SAMPLES; i++) {
        const t = i / SAMPLES
        const x = cubicBezier(t, sx, c1x, c2x, ex)
        const y = cubicBezier(t, sy, c1y, c2y, ey)
        const dx = cubicBezierDeriv(t, sx, c1x, c2x, ex)
        const dy = cubicBezierDeriv(t, sy, c1y, c2y, ey)
        const len = Math.hypot(dx, dy) || 1
        pts.push({ x, y, nx: -dy / len, ny: dx / len, t })
      }
    }

    const loop = (now: number) => {
      if (!running) return
      const dt = Math.min((now - lastTime) / 1000, 0.1)
      elapsed += dt
      lastTime = now

      const p = pRef.current
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const w = rect.width, h = rect.height

      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
        canvas.style.width = `${w}px`
        canvas.style.height = `${h}px`
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      // FIX #1: Always rebuild points each frame so parameter changes take effect
      rebuildPoints(w, h, p)

      const sx = p.planeX * w, sy = p.planeY * h
      const ex = p.trailEndX * w, ey = p.trailEndY * h

      // ===== BUILD TRAIL SHAPE (for clip and glow layers) =====
      const buildShape = (seed: number, ampScale: number, widthScale: number) => {
        const upper: { x: number; y: number }[] = []
        const lower: { x: number; y: number }[] = []
        for (let i = 0; i < pts.length; i++) {
          const pt = pts[i]
          const tW = 1 - Math.pow(1 - pt.t, 2.5)
          const halfW = (p.trailStartWidth + (p.trailEndWidth - p.trailStartWidth) * tW) * 0.5 * widthScale
          const wobbleAtten = Math.min(1, pt.t * 15)
          const wUp = edgeWobble(pt.t, elapsed, seed, p.edgeWobbleAmp * ampScale * wobbleAtten)
          const wDn = edgeWobble(pt.t, elapsed, seed + 5.3, p.edgeWobbleAmp * ampScale * wobbleAtten)
          upper.push({
            x: pt.x + pt.nx * (halfW + wUp),
            y: pt.y + pt.ny * (halfW + wUp),
          })
          lower.push({
            x: pt.x - pt.nx * (halfW + wDn),
            y: pt.y - pt.ny * (halfW + wDn),
          })
        }
        ctx.beginPath()
        ctx.moveTo(upper[0].x, upper[0].y)
        for (let i = 1; i < upper.length; i++) ctx.lineTo(upper[i].x, upper[i].y)
        for (let i = lower.length - 1; i >= 0; i--) ctx.lineTo(lower[i].x, lower[i].y)
        ctx.closePath()
      }

      // Helper: get point position along curve at parameter t (0~1)
      const getPtAt = (t: number) => {
        const idx = Math.min(Math.floor(t * SAMPLES), SAMPLES - 1)
        return pts[idx]
      }

      // Helper: get trail half-width at parameter t
      const getHalfWidthAt = (t: number) => {
        const tW = 1 - Math.pow(1 - t, 2.5)
        return (p.trailStartWidth + (p.trailEndWidth - p.trailStartWidth) * tW) * 0.5
      }

      // ===== LAYER 1: Blurred soft halo (outermost glow) =====
      if (p.blurAmount > 0) {
        ctx.save()
        ctx.filter = `blur(${p.blurAmount}px)`
        ctx.globalAlpha = 0.3 * p.trailOpacity
        buildShape(0.7, 0.8, 1.2)
        const haloGrad = ctx.createLinearGradient(sx, sy, ex, ey)
        haloGrad.addColorStop(0, 'rgba(180, 140, 255, 0.3)')
        haloGrad.addColorStop(0.4, 'rgba(160, 110, 255, 0.3)')
        haloGrad.addColorStop(0.65, 'rgba(255, 230, 170, 0.25)')
        haloGrad.addColorStop(1, 'rgba(230, 80, 60, 0.3)')
        ctx.fillStyle = haloGrad
        ctx.fill()
        ctx.restore()
      }

      // ===== CORE: Single-layer watercolor blending via clip + radial gradients =====
      ctx.save()
      buildShape(1.0, 1.0, 1.0)
      ctx.clip()

      // --- Radial gradient color blobs ---
      const purpleEnd = p.purpleZoneEnd
      const blobRadius = p.blendWidth * 3 + 0.5 // blendWidth controls overlap size

      // Purple blobs — front 2/3 of trail (near plane)
      const purpleBlobPositions = [0.1, 0.25, 0.4, 0.55]
      for (let i = 0; i < purpleBlobPositions.length; i++) {
        const t = purpleBlobPositions[i] * purpleEnd / 0.67 // scale to actual purpleEnd
        if (t > 1) continue
        const pt = getPtAt(Math.min(t, 0.99))
        const hw = getHalfWidthAt(t)
        const radius = hw * (1.2 + blobRadius) * (1.0 + i * 0.1)
        // Slight offset per blob for organic feel
        const ox = prand(i * 3.7 + 1.2) * hw * 0.3 - hw * 0.15
        const oy = prand(i * 5.1 + 2.8) * hw * 0.3 - hw * 0.15
        const grad = ctx.createRadialGradient(
          pt.x + ox, pt.y + oy, 0,
          pt.x + ox, pt.y + oy, radius
        )
        const alpha = p.trailOpacity * (0.7 - i * 0.08)
        grad.addColorStop(0, `rgba(180, 140, 255, ${alpha})`)
        grad.addColorStop(0.4, `rgba(160, 120, 255, ${alpha * 0.7})`)
        grad.addColorStop(0.75, `rgba(150, 100, 255, ${alpha * 0.3})`)
        grad.addColorStop(1, 'rgba(150, 100, 255, 0)')
        ctx.fillStyle = grad
        ctx.fillRect(pt.x + ox - radius, pt.y + oy - radius, radius * 2, radius * 2)
      }

      // Red/orange blobs — back 1/3 (tail end)
      const redBlobPositions = [0.72, 0.85, 0.95]
      for (let i = 0; i < redBlobPositions.length; i++) {
        const actualT = Math.max(purpleEnd, Math.min(redBlobPositions[i], 0.99))
        const pt = getPtAt(actualT)
        const hw = getHalfWidthAt(actualT)
        const radius = hw * (1.3 + blobRadius) * (1.0 + i * 0.05)
        const ox = prand(i * 2.3 + 7.1) * hw * 0.3 - hw * 0.15
        const oy = prand(i * 4.4 + 9.2) * hw * 0.3 - hw * 0.15
        const grad = ctx.createRadialGradient(
          pt.x + ox, pt.y + oy, 0,
          pt.x + ox, pt.y + oy, radius
        )
        const alpha = p.trailOpacity * (0.75 - i * 0.05)
        grad.addColorStop(0, `rgba(230, 80, 60, ${alpha})`)
        grad.addColorStop(0.35, `rgba(220, 70, 55, ${alpha * 0.7})`)
        grad.addColorStop(0.7, `rgba(200, 60, 50, ${alpha * 0.3})`)
        grad.addColorStop(1, 'rgba(200, 60, 50, 0)')
        ctx.fillStyle = grad
        ctx.fillRect(pt.x + ox - radius, pt.y + oy - radius, radius * 2, radius * 2)
      }

      // Yellow-white blobs — transition zone
      const yellowPositions = [purpleEnd - 0.08, purpleEnd, purpleEnd + 0.06]
      for (let i = 0; i < yellowPositions.length; i++) {
        const t = Math.max(0.05, Math.min(yellowPositions[i], 0.95))
        const pt = getPtAt(t)
        const hw = getHalfWidthAt(t)
        const radius = hw * (0.8 + blobRadius * 0.7)
        const ox = prand(i * 6.1 + 3.3) * hw * 0.4 - hw * 0.2
        const oy = prand(i * 8.2 + 5.5) * hw * 0.4 - hw * 0.2
        const grad = ctx.createRadialGradient(
          pt.x + ox, pt.y + oy, 0,
          pt.x + ox, pt.y + oy, radius
        )
        const alpha = p.trailOpacity * (0.6 - i * 0.1)
        grad.addColorStop(0, `rgba(255, 230, 170, ${alpha})`)
        grad.addColorStop(0.3, `rgba(255, 220, 150, ${alpha * 0.6})`)
        grad.addColorStop(0.7, `rgba(255, 210, 130, ${alpha * 0.2})`)
        grad.addColorStop(1, 'rgba(255, 200, 120, 0)')
        ctx.fillStyle = grad
        ctx.fillRect(pt.x + ox - radius, pt.y + oy - radius, radius * 2, radius * 2)
      }

      // --- Sub-blobs for richer texture (controlled by trailLayers) ---
      for (let layer = 1; layer < p.trailLayers; layer++) {
        const seed = layer * 13.7
        // Extra purple sub-blobs
        for (let i = 0; i < 2; i++) {
          const t = prand(seed + i * 3.1) * purpleEnd * 0.9 + 0.05
          const pt = getPtAt(t)
          const hw = getHalfWidthAt(t)
          const radius = hw * (0.6 + prand(seed + i * 7.2) * 0.5)
          const ox = (prand(seed + i * 2.2) - 0.5) * hw * 0.6
          const oy = (prand(seed + i * 4.4) - 0.5) * hw * 0.6
          const grad = ctx.createRadialGradient(
            pt.x + ox, pt.y + oy, 0,
            pt.x + ox, pt.y + oy, radius
          )
          const alpha = p.trailOpacity * 0.35
          grad.addColorStop(0, `rgba(180, 140, 255, ${alpha})`)
          grad.addColorStop(0.6, `rgba(160, 110, 255, ${alpha * 0.4})`)
          grad.addColorStop(1, 'rgba(150, 100, 255, 0)')
          ctx.fillStyle = grad
          ctx.fillRect(pt.x + ox - radius, pt.y + oy - radius, radius * 2, radius * 2)
        }
        // Extra red sub-blobs
        for (let i = 0; i < 2; i++) {
          const t = purpleEnd + prand(seed + i * 5.5 + 20) * (1 - purpleEnd) * 0.85 + 0.05
          const clampedT = Math.min(t, 0.98)
          const pt = getPtAt(clampedT)
          const hw = getHalfWidthAt(clampedT)
          const radius = hw * (0.5 + prand(seed + i * 9.1) * 0.5)
          const ox = (prand(seed + i * 3.3 + 10) - 0.5) * hw * 0.5
          const oy = (prand(seed + i * 6.6 + 10) - 0.5) * hw * 0.5
          const grad = ctx.createRadialGradient(
            pt.x + ox, pt.y + oy, 0,
            pt.x + ox, pt.y + oy, radius
          )
          const alpha = p.trailOpacity * 0.35
          grad.addColorStop(0, `rgba(230, 80, 60, ${alpha})`)
          grad.addColorStop(0.6, `rgba(210, 70, 55, ${alpha * 0.4})`)
          grad.addColorStop(1, 'rgba(200, 60, 50, 0)')
          ctx.fillStyle = grad
          ctx.fillRect(pt.x + ox - radius, pt.y + oy - radius, radius * 2, radius * 2)
        }
      }

      // --- Noise texture overlay for grain ---
      const noise = getNoisePattern(ctx)
      if (noise) {
        ctx.globalCompositeOperation = 'overlay'
        ctx.globalAlpha = 0.15
        ctx.fillStyle = noise
        // Fill the clipped area bounding box
        const bx = Math.min(sx, ex) - p.trailEndWidth
        const by = Math.min(sy, ey) - p.trailEndWidth
        const bw = Math.abs(sx - ex) + p.trailEndWidth * 2
        const bh = Math.abs(sy - ey) + p.trailEndWidth * 2
        ctx.fillRect(bx, by, bw, bh)
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1
      }

      ctx.restore() // End clip

      // ===== LAYER: Enhanced inner glow =====
      if (p.trailGlow > 0) {
        ctx.save()
        ctx.filter = `blur(${p.trailGlow * 1.5}px)`
        ctx.globalAlpha = 0.45 * p.trailOpacity
        buildShape(1.3, 0.6, 1.3) // FIX #2: widthScale 1.3 (expand beyond trail)
        const glowGrad = ctx.createLinearGradient(sx, sy, ex, ey)
        glowGrad.addColorStop(0, 'rgba(180, 140, 255, 0.4)')
        glowGrad.addColorStop(0.35, 'rgba(170, 130, 255, 0.45)')
        glowGrad.addColorStop(0.65, 'rgba(255, 220, 160, 0.3)')
        glowGrad.addColorStop(1, 'rgba(230, 80, 60, 0.35)')
        ctx.fillStyle = glowGrad
        ctx.fill()
        ctx.restore()
      }

      // ===== ROCKET / AIRPLANE =====
      ctx.save()
      const floatOffset = Math.sin((elapsed / p.floatSpeed) * Math.PI * 2) * p.floatAmplitude
      ctx.translate(sx, sy + floatOffset)
      ctx.rotate((p.planeRotation * Math.PI) / 180)
      ctx.scale(p.planeScale, p.planeScale)

      drawRocket(ctx, elapsed)

      ctx.restore()

      // ===== STICK FIGURE ON ROCKET =====
      ctx.save()
      ctx.translate(sx, sy + floatOffset)
      ctx.rotate((p.planeRotation * Math.PI) / 180)
      ctx.scale(p.planeScale, p.planeScale)

      drawStickFigure(ctx)

      ctx.restore()

      requestAnimationFrame(loop)
    }

    requestAnimationFrame(loop)
    const ro = new ResizeObserver(() => { /* will rebuild on next frame anyway */ })
    ro.observe(container)
    return () => { running = false; ro.disconnect() }
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-0 z-10 pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  )
}

/* ========== Rocket Drawing ========== */

function drawRocket(ctx: CanvasRenderingContext2D, elapsed: number) {
  // Body - rocket fuselage
  const bodyW = 85, bodyH = 22

  // Main fuselage (rounded rectangle with pointed nose)
  ctx.beginPath()
  ctx.moveTo(-bodyW / 2, -bodyH / 2)
  // Top edge
  ctx.lineTo(bodyW / 2 - 15, -bodyH / 2)
  // Nose cone (pointed)
  ctx.lineTo(bodyW / 2 + 10, 0)
  // Bottom of nose back to body
  ctx.lineTo(bodyW / 2 - 15, bodyH / 2)
  // Bottom edge
  ctx.lineTo(-bodyW / 2, bodyH / 2)
  // Tail end (slightly tapered)
  ctx.lineTo(-bodyW / 2 - 5, 0)
  ctx.closePath()
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = '#111111'
  ctx.lineWidth = 2.2
  ctx.stroke()

  // Body details - horizontal lines
  ctx.beginPath()
  ctx.moveTo(-bodyW / 2 + 10, -bodyH / 2 + 4)
  ctx.lineTo(bodyW / 2 - 20, -bodyH / 2 + 4)
  ctx.strokeStyle = '#111'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(-bodyW / 2 + 10, bodyH / 2 - 4)
  ctx.lineTo(bodyW / 2 - 20, bodyH / 2 - 4)
  ctx.stroke()

  // Window / porthole
  ctx.beginPath()
  ctx.arc(bodyW / 2 - 25, 0, 5.5, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(180, 220, 255, 0.5)'
  ctx.fill()
  ctx.strokeStyle = '#111'
  ctx.lineWidth = 1.8
  ctx.stroke()

  // Second window
  ctx.beginPath()
  ctx.arc(bodyW / 2 - 40, 0, 4, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(180, 220, 255, 0.4)'
  ctx.fill()
  ctx.strokeStyle = '#111'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Wings (top and bottom)
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(-5, side * bodyH / 2)
    ctx.lineTo(10, side * (bodyH / 2 + 30))
    ctx.lineTo(22, side * (bodyH / 2 + 28))
    ctx.lineTo(8, side * bodyH / 2)
    ctx.closePath()
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#111'
    ctx.lineWidth = 2
    ctx.stroke()

    // Wing detail line
    ctx.beginPath()
    ctx.moveTo(0, side * (bodyH / 2 + 2))
    ctx.lineTo(14, side * (bodyH / 2 + 22))
    ctx.strokeStyle = '#111'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // Tail fin (vertical)
  ctx.beginPath()
  ctx.moveTo(-bodyW / 2 + 5, -bodyH / 2)
  ctx.lineTo(-bodyW / 2 - 10, -bodyH / 2 - 22)
  ctx.lineTo(-bodyW / 2 + 8, -bodyH / 2 - 14)
  ctx.lineTo(-bodyW / 2 + 12, -bodyH / 2)
  ctx.closePath()
  ctx.fillStyle = '#fff'
  ctx.fill()
  ctx.strokeStyle = '#111'
  ctx.lineWidth = 2
  ctx.stroke()

  // Tail fin bottom
  ctx.beginPath()
  ctx.moveTo(-bodyW / 2 + 5, bodyH / 2)
  ctx.lineTo(-bodyW / 2 - 8, bodyH / 2 + 14)
  ctx.lineTo(-bodyW / 2 + 8, bodyH / 2 + 8)
  ctx.lineTo(-bodyW / 2 + 10, bodyH / 2)
  ctx.closePath()
  ctx.fillStyle = '#fff'
  ctx.fill()
  ctx.strokeStyle = '#111'
  ctx.lineWidth = 2
  ctx.stroke()

  // Propeller hub
  ctx.beginPath()
  ctx.arc(bodyW / 2 + 10, 0, 5, 0, Math.PI * 2)
  ctx.fillStyle = '#333'
  ctx.fill()
  ctx.strokeStyle = '#111'
  ctx.lineWidth = 2
  ctx.stroke()

  // Spinning propeller blades
  ctx.save()
  ctx.translate(bodyW / 2 + 10, 0)
  const propAngle = elapsed * 10
  ctx.rotate(propAngle)

  for (let i = 0; i < 3; i++) {
    ctx.save()
    ctx.rotate((i * Math.PI * 2) / 3)
    ctx.beginPath()
    ctx.moveTo(0, -2)
    ctx.lineTo(2, -18)
    ctx.lineTo(-1, -17)
    ctx.lineTo(-2, -2)
    ctx.closePath()
    ctx.fillStyle = '#222'
    ctx.fill()
    ctx.restore()
  }
  ctx.restore()

  // Small exhaust marks behind tail
  ctx.save()
  ctx.globalAlpha = 0.3
  for (let i = 0; i < 3; i++) {
    const ex = -bodyW / 2 - 15 - i * 8
    const ey = Math.sin(elapsed * 3 + i) * 3
    ctx.beginPath()
    ctx.arc(ex, ey, 2 - i * 0.5, 0, Math.PI * 2)
    ctx.fillStyle = '#666'
    ctx.fill()
  }
  ctx.restore()
}

/* ========== Stick Figure Drawing ========== */

function drawStickFigure(ctx: CanvasRenderingContext2D) {
  const cx = 5, cy = -11 - 8  // Position above the rocket body

  // Head
  ctx.beginPath()
  ctx.arc(cx, cy - 10, 8, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = '#111'
  ctx.lineWidth = 2
  ctx.stroke()

  // Eyes (dots)
  ctx.beginPath()
  ctx.arc(cx - 3, cy - 12, 1.5, 0, Math.PI * 2)
  ctx.fillStyle = '#111'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + 3, cy - 12, 1.5, 0, Math.PI * 2)
  ctx.fillStyle = '#111'
  ctx.fill()

  // Smile
  ctx.beginPath()
  ctx.arc(cx, cy - 8, 4, 0.2, Math.PI - 0.2)
  ctx.strokeStyle = '#111'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Body (torso)
  ctx.beginPath()
  ctx.moveTo(cx, cy - 2)
  ctx.lineTo(cx, cy + 12)
  ctx.strokeStyle = '#111'
  ctx.lineWidth = 2
  ctx.stroke()

  // Arms - raised up in excitement
  ctx.beginPath()
  ctx.moveTo(cx, cy + 2)
  ctx.lineTo(cx - 10, cy - 8)
  ctx.strokeStyle = '#111'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(cx, cy + 2)
  ctx.lineTo(cx + 10, cy - 8)
  ctx.strokeStyle = '#111'
  ctx.lineWidth = 2
  ctx.stroke()

  // Hands (small circles)
  ctx.beginPath()
  ctx.arc(cx - 10, cy - 8, 2, 0, Math.PI * 2)
  ctx.fillStyle = '#111'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + 10, cy - 8, 2, 0, Math.PI * 2)
  ctx.fillStyle = '#111'
  ctx.fill()

  // Legs - straddling the rocket
  ctx.beginPath()
  ctx.moveTo(cx, cy + 12)
  ctx.lineTo(cx - 7, cy + 22)
  ctx.strokeStyle = '#111'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(cx, cy + 12)
  ctx.lineTo(cx + 7, cy + 22)
  ctx.strokeStyle = '#111'
  ctx.lineWidth = 2
  ctx.stroke()
}

/* ========== Wrapper with DevControls ========== */

export function HeroIllustrationWithControls() {
  const [params, setParams] = useState<HeroParams>(() => {
    try {
      const s = localStorage.getItem('hero-illustration-params')
      if (s) return { ...DEFAULT_PARAMS, ...JSON.parse(s) }
    } catch { /* ignore */ }
    return { ...DEFAULT_PARAMS }
  })

  return (
    <>
      <HeroIllustration params={params} />
      {import.meta.env.DEV && (
        <DevControls
          params={params}
          onChange={setParams}
          onReset={() => {
            setParams({ ...DEFAULT_PARAMS })
            localStorage.removeItem('hero-illustration-params')
          }}
        />
      )}
    </>
  )
}
