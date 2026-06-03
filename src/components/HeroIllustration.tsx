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
  purpleZoneStart: number
  blendWidth: number
  warmBlobCount: number
  coolBlobCount: number
  blobSize: number
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
  trailControl1X: 0.78, trailControl1Y: 0.15,
  trailControl2X: 0.45, trailControl2Y: 0.35,
  trailEndX: 0.05, trailEndY: 0.72,
  trailStartWidth: 5, trailEndWidth: 220,
  purpleZoneStart: 0.65, blendWidth: 0.12,
  warmBlobCount: 5, coolBlobCount: 4,
  blobSize: 130,
  edgeWobbleAmp: 28, trailLayers: 4,
  trailOpacity: 0.38, trailGlow: 6, blurAmount: 6,
  planeX: 0.82, planeY: 0.18,
  planeScale: 1, planeRotation: -15,
  floatAmplitude: 6, floatSpeed: 5,
}

const WARM_COLORS = [
  { r: 232, g: 64, b: 13 },
  { r: 225, g: 101, b: 64 },
  { r: 255, g: 215, b: 240 },
  { r: 255, g: 180, b: 120 },
]
const COOL_COLORS = [
  { r: 226, g: 221, b: 253 },
  { r: 46, g: 36, b: 96 },
  { r: 16, g: 5, b: 77 },
  { r: 180, g: 150, b: 240 },
]

function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const u = 1 - t
  return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3
}
function cubicBezierDerivative(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const u = 1 - t
  return 3*u*u*(p1-p0) + 6*u*t*(p2-p1) + 3*t*t*(p3-p2)
}

// Multi-frequency sine superposition for organic edges
const WF = [1.0, 2.4, 5.7, 11.3]
const WP = [0, 1.3, 2.7, 4.1]
const WS = [0.25, 0.4, 0.6, 0.85]
const WW = [1.0, 0.55, 0.28, 0.12]
function edgeOffset(t: number, elapsed: number, seed: number, amp: number): number {
  let v = 0
  for (let i = 0; i < WF.length; i++)
    v += Math.sin(t*WF[i]*Math.PI*2 + WP[i] + elapsed*WS[i] + seed) * WW[i]
  if (t > 0.85) v += Math.sin(t*1.7*Math.PI + elapsed*0.3 + seed*3) * (t-0.85)*6
  return v * amp
}

interface Props { params: HeroParams }

export default function HeroIllustration({ params }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pRef = useRef(params); pRef.current = params

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let running = true
    let lastTime = performance.now()
    let elapsed = 0
    let cw = 0, ch = 0
    let pts: { x: number; y: number; nx: number; ny: number; t: number }[] = []

    const loop = (now: number) => {
      if (!running) return
      elapsed += Math.min((now - lastTime)/1000, 0.1)
      lastTime = now

      const p = pRef.current
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const w = rect.width, h = rect.height
      if (canvas.width !== w*dpr || canvas.height !== h*dpr) {
        canvas.width = w*dpr; canvas.height = h*dpr
        canvas.style.width = `${w}px`; canvas.style.height = `${h}px`
        cw = 0
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const sx = p.planeX*w, sy = p.planeY*h
      const c1x = p.trailControl1X*w, c1y = p.trailControl1Y*h
      const c2x = p.trailControl2X*w, c2y = p.trailControl2Y*h
      const ex = p.trailEndX*w, ey = p.trailEndY*h

      // Cache centerline samples
      if (cw !== w || ch !== h) {
        cw = w; ch = h; pts = []
        for (let i = 0; i <= 120; i++) {
          const t = i/120
          const x = cubicBezier(t, sx, c1x, c2x, ex)
          const y = cubicBezier(t, sy, c1y, c2y, ey)
          const dx = cubicBezierDerivative(t, sx, c1x, c2x, ex)
          const dy = cubicBezierDerivative(t, sy, c1y, c2y, ey)
          const len = Math.sqrt(dx*dx+dy*dy) || 1
          pts.push({ x, y, nx: -dy/len, ny: dx/len, t })
        }
      }

      // ---- Trail layers with organic edges ----
      for (let layer = 0; layer < p.trailLayers; layer++) {
        const seed = layer*7.3 + 2
        const alpha = p.trailOpacity*(0.25 + 0.75*(1 - layer/p.trailLayers))
        ctx.save(); ctx.globalAlpha = alpha
        ctx.beginPath()
        for (let i = 0; i < pts.length; i++) {
          const pt = pts[i]
          const hw = Math.max(1, (p.trailStartWidth+(p.trailEndWidth-p.trailStartWidth)*pt.t)/2 + edgeOffset(pt.t, elapsed, seed, p.edgeWobbleAmp))
          const x = pt.x+pt.nx*hw, y = pt.y+pt.ny*hw
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        for (let i = pts.length-1; i >= 0; i--) {
          const pt = pts[i]
          const hw = Math.max(1, (p.trailStartWidth+(p.trailEndWidth-p.trailStartWidth)*pt.t)/2 + edgeOffset(pt.t, elapsed, seed+1.5, p.edgeWobbleAmp))
          ctx.lineTo(pt.x-pt.nx*hw, pt.y-pt.ny*hw)
        }
        ctx.closePath()
        ctx.fillStyle = 'rgba(255,240,230,0.25)'; ctx.fill()
        ctx.restore()
      }

      // ---- Color blobs (static, no drift) ----
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
      const clipHW = (p.trailStartWidth+p.trailEndWidth)/2 + p.edgeWobbleAmp*2
      for (let i = pts.length-1; i >= 0; i--) ctx.lineTo(pts[i].x-pts[i].nx*clipHW, pts[i].y-pts[i].ny*clipHW)
      ctx.closePath(); ctx.clip()

      // Warm blobs
      for (let b = 0; b < p.warmBlobCount; b++) {
        const t = (b/p.warmBlobCount)*(p.purpleZoneStart + p.blendWidth)
        const idx = Math.floor(t*(pts.length-1))
        const pt = pts[Math.min(idx, pts.length-1)]
        const c = WARM_COLORS[b % WARM_COLORS.length]
        const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, p.blobSize)
        grad.addColorStop(0, `rgba(${c.r},${c.g},${c.b},0.4)`)
        grad.addColorStop(0.5, `rgba(${c.r},${c.g},${c.b},0.15)`)
        grad.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`)
        ctx.fillStyle = grad; ctx.fillRect(pt.x-p.blobSize, pt.y-p.blobSize, p.blobSize*2, p.blobSize*2)
      }
      // Cool blobs
      const coolStart = Math.max(0, p.purpleZoneStart - p.blendWidth)
      for (let b = 0; b < p.coolBlobCount; b++) {
        const t = coolStart + (b/p.coolBlobCount)*(1-coolStart)
        const idx = Math.floor(t*(pts.length-1))
        const pt = pts[Math.min(idx, pts.length-1)]
        const c = COOL_COLORS[b % COOL_COLORS.length]
        const mul = t > p.purpleZoneStart ? 1.4 : 0.9
        const size = p.blobSize*mul
        const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, size)
        grad.addColorStop(0, `rgba(${c.r},${c.g},${c.b},0.45)`)
        grad.addColorStop(0.5, `rgba(${c.r},${c.g},${c.b},0.18)`)
        grad.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`)
        ctx.fillStyle = grad; ctx.fillRect(pt.x-size, pt.y-size, size*2, size*2)
      }
      // Blend zone
      const bzS = p.purpleZoneStart - p.blendWidth*0.5, bzE = p.purpleZoneStart + p.blendWidth*0.5
      for (let b = 0; b < 3; b++) {
        const t = bzS + (b/2)*(bzE-bzS)
        const idx = Math.floor(t*(pts.length-1))
        const pt = pts[Math.min(idx, pts.length-1)]
        for (const c of [WARM_COLORS[b%WARM_COLORS.length], COOL_COLORS[b%COOL_COLORS.length]]) {
          const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, p.blobSize*0.8)
          grad.addColorStop(0, `rgba(${c.r},${c.g},${c.b},0.3)`)
          grad.addColorStop(0.6, `rgba(${c.r},${c.g},${c.b},0.08)`)
          grad.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`)
          ctx.fillStyle = grad; ctx.fillRect(pt.x-p.blobSize, pt.y-p.blobSize, p.blobSize*2, p.blobSize*2)
        }
      }
      ctx.restore()

      // ---- Global blur ----
      if (p.blurAmount > 0) {
        ctx.save(); ctx.filter = `blur(${p.blurAmount}px)`; ctx.globalAlpha = 0.25
        ctx.beginPath()
        ctx.moveTo(pts[0].x, pts[0].y)
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
        for (let i = pts.length-1; i >= 0; i--) {
          const pt = pts[i]
          const hw = (p.trailStartWidth+(p.trailEndWidth-p.trailStartWidth)*pt.t)/2 + p.edgeWobbleAmp
          ctx.lineTo(pt.x-pt.nx*hw, pt.y-pt.ny*hw)
        }
        ctx.closePath()
        ctx.fillStyle = 'rgba(180,150,220,0.15)'; ctx.fill()
        ctx.restore()
      }

      // ---- Airplane ----
      ctx.save()
      const fo = Math.sin((elapsed/p.floatSpeed)*Math.PI*2)*p.floatAmplitude
      ctx.translate(sx, sy+fo)
      ctx.rotate((p.planeRotation*Math.PI)/180)
      ctx.scale(p.planeScale, p.planeScale)

      const bw=80, bh=18, br=9
      ctx.beginPath()
      ctx.moveTo(-bw/2+br,-bh/2); ctx.lineTo(bw/2-br,-bh/2)
      ctx.arcTo(bw/2,-bh/2,bw/2,-bh/2+br,br); ctx.lineTo(bw/2,bh/2-br)
      ctx.arcTo(bw/2,bh/2,bw/2-br,bh/2,br); ctx.lineTo(-bw/2+br,bh/2)
      ctx.arcTo(-bw/2,bh/2,-bw/2,bh/2-br,br); ctx.lineTo(-bw/2,-bh/2+br)
      ctx.arcTo(-bw/2,-bh/2,-bw/2+br,-bh/2,br); ctx.closePath()
      ctx.fillStyle='#fff'; ctx.fill(); ctx.strokeStyle='#111'; ctx.lineWidth=2; ctx.stroke()

      ctx.beginPath(); ctx.arc(bw/2-18,0,6,0,Math.PI*2)
      ctx.fillStyle='rgba(153,255,249,0.4)'; ctx.fill()
      ctx.strokeStyle='#111'; ctx.lineWidth=1.5; ctx.stroke()

      for (const s of [-1,1]){ctx.beginPath();ctx.moveTo(-12,s*bh/2);ctx.lineTo(8,s*(bh/2+28));ctx.lineTo(18,s*(bh/2+26));ctx.lineTo(2,s*bh/2);ctx.closePath();ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#111';ctx.lineWidth=2;ctx.stroke()}

      ctx.beginPath();ctx.moveTo(-bw/2+5,-bh/2);ctx.lineTo(-bw/2-8,-bh/2-20);ctx.lineTo(-bw/2+2,-bh/2-16);ctx.closePath();ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#111';ctx.lineWidth=2;ctx.stroke()
      ctx.beginPath();ctx.moveTo(-bw/2+8,-bh/2+2);ctx.lineTo(-bw/2-6,-bh/2-4);ctx.strokeStyle='#111';ctx.lineWidth=2;ctx.stroke()
      ctx.beginPath();ctx.moveTo(-bw/2+8,bh/2-2);ctx.lineTo(-bw/2-6,bh/2+4);ctx.stroke()

      ctx.beginPath();ctx.arc(bw/2+4,0,6,0,Math.PI*2);ctx.fillStyle='hsl(14,90%,48%)';ctx.fill();ctx.strokeStyle='#111';ctx.lineWidth=2;ctx.stroke()
      ctx.save();ctx.translate(bw/2+4,0);ctx.rotate(elapsed*8)
      ctx.beginPath();ctx.moveTo(0,-3);ctx.lineTo(0,-20);ctx.lineTo(3,-18);ctx.closePath();ctx.fillStyle='#111';ctx.fill()
      ctx.beginPath();ctx.moveTo(0,3);ctx.lineTo(0,20);ctx.lineTo(-3,18);ctx.closePath();ctx.fill();ctx.restore();ctx.restore()

      // ---- Character ----
      ctx.save();ctx.translate(sx,sy+fo);ctx.rotate((p.planeRotation*Math.PI)/180);ctx.scale(p.planeScale,p.planeScale)
      const cx=10,cy=-bh/2-6
      ctx.beginPath();ctx.arc(cx,cy-10,10,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#111';ctx.lineWidth=2;ctx.stroke()
      ctx.beginPath();ctx.arc(cx,cy-10,5,0.2,Math.PI-0.2);ctx.strokeStyle='#111';ctx.lineWidth=1.5;ctx.stroke()
      ctx.beginPath();ctx.arc(cx-3,cy-13,1.5,0,Math.PI*2);ctx.fillStyle='#111';ctx.fill();ctx.beginPath();ctx.arc(cx+3,cy-13,1.5,0,Math.PI*2);ctx.fill()
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx,cy+16);ctx.strokeStyle='#111';ctx.lineWidth=2;ctx.stroke()
      ctx.beginPath();ctx.moveTo(cx,cy+4);ctx.lineTo(cx-10,cy+10);ctx.stroke();ctx.beginPath();ctx.moveTo(cx,cy+4);ctx.lineTo(cx+10,cy+10);ctx.stroke()
      ctx.beginPath();ctx.moveTo(cx,cy+16);ctx.lineTo(cx-6,cy+24);ctx.stroke();ctx.beginPath();ctx.moveTo(cx,cy+16);ctx.lineTo(cx+6,cy+24);ctx.stroke();ctx.restore()

      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
    const ro = new ResizeObserver(()=>{}); ro.observe(container)
    return () => { running = false; ro.disconnect() }
  }, [])

  return <div ref={containerRef} className="absolute inset-0 z-10 pointer-events-none"><canvas ref={canvasRef} className="absolute inset-0 w-full h-full"/></div>
}

export function HeroIllustrationWithControls() {
  const [params, setParams] = useState<HeroParams>(() => {
    try { const s = localStorage.getItem('hero-illustration-params'); if (s) return {...DEFAULT_PARAMS, ...JSON.parse(s)} } catch {}
    return {...DEFAULT_PARAMS}
  })
  return <>
    <HeroIllustration params={params}/>
    {import.meta.env.DEV && <DevControls params={params} onChange={setParams} onReset={()=>{setParams({...DEFAULT_PARAMS});localStorage.removeItem('hero-illustration-params')}}/>}
  </>
}
