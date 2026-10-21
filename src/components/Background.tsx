import { useEffect, useMemo, useRef } from 'react'
import { useReducedMotion } from '../lib/motion'

/** Deterministic pseudo-noise so contours are stable between renders. */
function contourPaths(): string[] {
  const paths: string[] = []
  const cx = 600
  const cy = 450
  for (let ring = 0; ring < 26; ring++) {
    const r = 40 + ring * 34
    const pts: string[] = []
    const steps = 90
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2
      const wob =
        1 +
        0.12 * Math.sin(a * 3 + ring * 0.35) +
        0.07 * Math.sin(a * 5 - ring * 0.22) +
        0.04 * Math.cos(a * 9 + ring * 0.5)
      const x = cx + Math.cos(a) * r * wob * 1.5
      const y = cy + Math.sin(a) * r * wob * 0.95
      pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    }
    paths.push(pts.join('') + 'Z')
  }
  return paths
}

export function Background() {
  const reduced = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paths = useMemo(() => contourPaths(), [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let w = 0
    let h = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const count = window.innerWidth < 700 ? 28 : 56
    const parts = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.5 + Math.random() * 1.3,
      vx: (Math.random() - 0.5) * 0.00002,
      vy: -0.00001 - Math.random() * 0.00003,
      a: 0.15 + Math.random() * 0.4,
      tw: Math.random() * Math.PI * 2,
    }))
    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const draw = (t: number, step: boolean) => {
      ctx.clearRect(0, 0, w, h)
      for (const p of parts) {
        if (step) {
          p.x += p.vx * 16
          p.y += p.vy * 16
          if (p.y < -0.02) p.y = 1.02
          if (p.x < -0.02) p.x = 1.02
          if (p.x > 1.02) p.x = -0.02
        }
        const tw = 0.6 + 0.4 * Math.sin(t / 1400 + p.tw)
        ctx.beginPath()
        ctx.fillStyle = `rgba(150,225,245,${p.a * tw})`
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    resize()
    window.addEventListener('resize', resize)
    let raf = 0
    if (reduced) {
      draw(0, false)
    } else {
      const loop = (t: number) => {
        raf = requestAnimationFrame(loop)
        if (document.hidden) return
        draw(t, true)
      }
      raf = requestAnimationFrame(loop)
    }
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [reduced])

  return (
    <div className="field" aria-hidden="true">
      <svg className="contours" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice">
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
      <canvas ref={canvasRef} />
    </div>
  )
}
