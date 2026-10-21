import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { feature } from 'topojson-client'
import type { Topology } from 'topojson-specification'
import landTopo from 'world-atlas/land-110m.json'
import { timeAgo } from '../lib/hazards'
import { KIND_META, type HazardEvent } from '../lib/types'

interface Props {
  events: HazardEvent[]
  reducedMotion: boolean
  onOpen: (e: HazardEvent) => void
  onFail: () => void
}

interface Tip {
  ev: HazardEvent
  x: number
  y: number
  w: number
  pinned: boolean
}

interface Api {
  setEvents: (evs: HazardEvent[]) => void
  requestRender: () => void
}

const R = 1

function toVec(lat: number, lon: number, r = R, out = new THREE.Vector3()) {
  const phi = (lat * Math.PI) / 180
  const lam = (lon * Math.PI) / 180
  return out.set(r * Math.cos(phi) * Math.sin(lam), r * Math.sin(phi), r * Math.cos(phi) * Math.cos(lam))
}

/** Rasterise real land polygons (Natural Earth 110m via world-atlas) into an equirectangular mask. */
function landMask(w = 1440, h = 720) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = '#fff'
  const topo = landTopo as unknown as Topology
  const fc = feature(topo, topo.objects.land) as unknown as GeoJSON.FeatureCollection | GeoJSON.Feature
  const geoms: GeoJSON.Geometry[] =
    fc.type === 'FeatureCollection' ? fc.features.map((f) => f.geometry) : [fc.geometry]
  const ring = (coords: number[][]) => {
    coords.forEach(([lon, lat], i) => {
      const x = ((lon + 180) / 360) * w
      const y = ((90 - lat) / 180) * h
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
  }
  for (const g of geoms) {
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []
    for (const poly of polys) {
      ctx.beginPath()
      poly.forEach((r) => ring(r))
      ctx.fill('evenodd')
    }
  }
  return ctx.getImageData(0, 0, w, h)
}

function buildLandDots(): THREE.BufferGeometry {
  const img = landMask()
  const pos: number[] = []
  const step = 1.35
  const v = new THREE.Vector3()
  for (let lat = -84; lat <= 84; lat += step) {
    const lonStep = step / Math.max(Math.cos((lat * Math.PI) / 180), 0.12)
    for (let lon = -180; lon < 180; lon += lonStep) {
      const x = Math.min(img.width - 1, Math.floor(((lon + 180) / 360) * img.width))
      const y = Math.min(img.height - 1, Math.floor(((90 - lat) / 180) * img.height))
      if (img.data[(y * img.width + x) * 4 + 3] > 128) {
        toVec(lat, lon, R * 1.001, v)
        pos.push(v.x, v.y, v.z)
      }
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  return g
}

function graticule(): THREE.BufferGeometry {
  const pos: number[] = []
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  for (let lat = -60; lat <= 60; lat += 30) {
    for (let lon = -180; lon < 180; lon += 6) {
      toVec(lat, lon, R * 1.0005, a)
      toVec(lat, lon + 6, R * 1.0005, b)
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z)
    }
  }
  for (let lon = -180; lon < 180; lon += 30) {
    for (let lat = -90; lat < 90; lat += 6) {
      toVec(lat, lon, R * 1.0005, a)
      toVec(lat + 6, lon, R * 1.0005, b)
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  return g
}

function ring(radius: number, tiltX: number, tiltZ: number, opacity: number) {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= 160; i++) {
    const t = (i / 160) * Math.PI * 2
    pts.push(new THREE.Vector3(Math.cos(t) * radius, 0, Math.sin(t) * radius))
  }
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0x55e7ff, transparent: true, opacity }),
  )
  line.rotation.set(tiltX, 0, tiltZ)
  return line
}

export default function Globe({ events, reducedMotion, onOpen, onFail }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const api = useRef<Api | null>(null)
  const reducedRef = useRef(reducedMotion)
  const evRef = useRef<HazardEvent[]>([])
  const pinnedRef = useRef(false)
  const [tip, setTip] = useState<Tip | null>(null)
  const onFailRef = useRef(onFail)

  useEffect(() => {
    reducedRef.current = reducedMotion
    api.current?.requestRender()
  }, [reducedMotion])

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
      })
    } catch {
      onFailRef.current()
      return
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    renderer.setPixelRatio(dpr)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50)
    camera.position.set(0, 0, 4.5)

    const globe = new THREE.Group()
    scene.add(globe)

    // core sphere
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(R * 0.995, 64, 48),
      new THREE.ShaderMaterial({
        vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `varying vec3 vN; void main(){
          float l = clamp(dot(vN, normalize(vec3(-0.5,0.6,0.8))),0.0,1.0);
          float f = pow(1.0 - clamp(vN.z,0.0,1.0), 2.5);
          vec3 base = mix(vec3(0.02,0.04,0.09), vec3(0.05,0.12,0.22), l);
          gl_FragColor = vec4(base + vec3(0.08,0.55,0.7)*f*0.55, 1.0);
        }`,
      }),
    )
    globe.add(core)

    // graticule
    globe.add(
      new THREE.LineSegments(
        graticule(),
        new THREE.LineBasicMaterial({ color: 0x78bee6, transparent: true, opacity: 0.07 }),
      ),
    )

    // land dots
    const dotMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uSize: { value: 2.4 }, uPR: { value: dpr } },
      vertexShader: `uniform float uSize; uniform float uPR; varying float vF;
        void main(){
          vec3 n = normalize((modelMatrix*vec4(position,0.0)).xyz);
          vF = n.z;
          gl_PointSize = uSize*uPR;
          gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);
        }`,
      fragmentShader: `varying float vF; void main(){
          float d = length(gl_PointCoord-0.5); if(d>0.5) discard;
          float a = smoothstep(0.5,0.18,d);
          float facing = clamp(vF,0.0,1.0);
          float rim = pow(1.0-facing,2.0);
          vec3 col = mix(vec3(0.33,0.78,0.92), vec3(0.26,0.84,0.64), rim);
          gl_FragColor = vec4(col, a*(0.35+0.65*facing));
        }`,
    })
    globe.add(new THREE.Points(buildLandDots(), dotMat))

    // atmosphere (outside rotating group)
    scene.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(R * 1.14, 64, 48),
        new THREE.ShaderMaterial({
          side: THREE.BackSide,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
          fragmentShader: `varying vec3 vN; void main(){
            float t = clamp(-vN.z/0.547, 0.0, 1.0);
            float i = pow(t, 2.6);
            gl_FragColor = vec4(vec3(0.16,0.78,0.95)*i*0.85, i);
          }`,
        }),
      ),
    )

    // orbital lines + satellite
    const orbits = new THREE.Group()
    orbits.add(ring(1.32, 1.25, 0.35, 0.2), ring(1.5, 0.55, -0.6, 0.11))
    scene.add(orbits)
    const sat = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x9ff4ff }),
    )
    orbits.children[0].add(sat)

    // markers
    const markerMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPR: { value: dpr }, uScale: { value: 1 } },
      vertexShader: `attribute float aSize; attribute float aPhase; attribute vec3 aColor;
        uniform float uTime; uniform float uPR; uniform float uScale; varying vec3 vC; varying float vF;
        void main(){
          vC = aColor;
          vec3 n = normalize((modelMatrix*vec4(position,0.0)).xyz);
          vF = n.z;
          float pulse = 1.0 + 0.3*sin(uTime*2.2 + aPhase);
          gl_PointSize = aSize*uScale*uPR*pulse;
          gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);
        }`,
      fragmentShader: `varying vec3 vC; varying float vF; void main(){
          float d = length(gl_PointCoord-0.5); if(d>0.5) discard;
          float core = smoothstep(0.16,0.06,d);
          float glow = smoothstep(0.5,0.0,d);
          vec3 col = mix(vC, vec3(1.0), core*0.8);
          float vis = smoothstep(0.0,0.2,vF);
          gl_FragColor = vec4(col*(glow*0.95), glow*vis);
        }`,
    })
    let markers: THREE.Points | null = null
    let vecs: THREE.Vector3[] = []

    const setEvents = (evs: HazardEvent[]) => {
      evRef.current = evs
      if (markers) {
        globe.remove(markers)
        markers.geometry.dispose()
        markers = null
      }
      vecs = evs.map((e) => toVec(e.lat, e.lon, R * 1.012))
      if (!evs.length) return
      const pos = new Float32Array(evs.length * 3)
      const col = new Float32Array(evs.length * 3)
      const size = new Float32Array(evs.length)
      const phase = new Float32Array(evs.length)
      const c = new THREE.Color()
      evs.forEach((e, i) => {
        pos.set([vecs[i].x, vecs[i].y, vecs[i].z], i * 3)
        c.set(KIND_META[e.kind].color)
        col.set([c.r, c.g, c.b], i * 3)
        size[i] = e.magnitude ? Math.min(28, 9 + (e.magnitude - 2.5) * 3.6) : 15
        phase[i] = (i * 1.7) % (Math.PI * 2)
      })
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      g.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
      g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
      g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
      markers = new THREE.Points(g, markerMat)
      markers.frustumCulled = false
      globe.add(markers)
      dirty = true
    }

    // ---- state ----
    let rotX = 0.32
    let rotY = -0.35 // centred roughly on Africa/Europe
    let vel = 0
    let dragging = false
    let moved = 0
    let lastX = 0
    let lastY = 0
    let hoverIdx = -1
    let visible = true
    let dirty = true
    let width = 1
    let height = 1

    const resize = () => {
      width = Math.max(wrap.clientWidth, 1)
      height = Math.max(wrap.clientHeight, 1)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      const s = Math.max(1.5, (width / 640) * 2.5)
      dotMat.uniforms.uSize.value = s
      markerMat.uniforms.uScale.value = Math.max(0.6, width / 640)
      dirty = true
    }
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    resize()

    const tmp = new THREE.Vector3()
    const pick = (clientX: number, clientY: number, maxPx: number) => {
      const rect = canvas.getBoundingClientRect()
      const px = clientX - rect.left
      const py = clientY - rect.top
      let best = -1
      let bd = maxPx * maxPx
      for (let i = 0; i < vecs.length; i++) {
        tmp.copy(vecs[i]).applyQuaternion(globe.quaternion)
        if (tmp.z < 0.2) continue
        tmp.project(camera)
        const sx = (tmp.x * 0.5 + 0.5) * rect.width
        const sy = (-tmp.y * 0.5 + 0.5) * rect.height
        const d = (sx - px) ** 2 + (sy - py) ** 2
        if (d < bd) {
          bd = d
          best = i
        }
      }
      return best
    }
    const screenOf = (i: number) => {
      tmp.copy(vecs[i]).applyQuaternion(globe.quaternion).project(camera)
      return { x: (tmp.x * 0.5 + 0.5) * width, y: (-tmp.y * 0.5 + 0.5) * height }
    }

    const onDown = (e: PointerEvent) => {
      dragging = true
      moved = 0
      lastX = e.clientX
      lastY = e.clientY
      vel = 0
      canvas.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (dragging) {
        const dx = e.clientX - lastX
        const dy = e.clientY - lastY
        moved += Math.abs(dx) + Math.abs(dy)
        lastX = e.clientX
        lastY = e.clientY
        if (moved > 5) {
          rotY += dx * 0.0055
          rotX = Math.max(-0.7, Math.min(0.9, rotX + dy * 0.004))
          vel = dx * 0.0055
          if (pinnedRef.current) {
            pinnedRef.current = false
            setTip(null)
          }
          dirty = true
        }
        return
      }
      if (e.pointerType === 'touch' || pinnedRef.current) return
      const i = pick(e.clientX, e.clientY, 16)
      if (i !== hoverIdx) {
        hoverIdx = i
        canvas.style.cursor = i >= 0 ? 'pointer' : ''
        if (i >= 0) {
          const s = screenOf(i)
          setTip({ ev: evRef.current[i], x: s.x, y: s.y, w: width, pinned: false })
        } else setTip(null)
      }
    }
    const onUp = (e: PointerEvent) => {
      const wasClick = dragging && moved <= 5
      dragging = false
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId)
      if (!wasClick) return
      const i = pick(e.clientX, e.clientY, e.pointerType === 'touch' ? 26 : 16)
      if (i >= 0) {
        const s = screenOf(i)
        pinnedRef.current = true
        hoverIdx = i
        setTip({ ev: evRef.current[i], x: s.x, y: s.y, w: width, pinned: true })
      } else {
        pinnedRef.current = false
        hoverIdx = -1
        setTip(null)
      }
    }
    const onLeave = () => {
      if (pinnedRef.current || dragging) return
      hoverIdx = -1
      canvas.style.cursor = ''
      setTip(null)
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.addEventListener('pointerleave', onLeave)

    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting
    })
    io.observe(wrap)

    let last = performance.now()
    let raf = 0
    let elapsed = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const now = performance.now()
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (!visible || document.hidden) return
      const reduced = reducedRef.current
      if (!dragging) {
        if (Math.abs(vel) > 0.00005) {
          rotY += vel
          vel *= 0.94
          dirty = true
        } else if (!reduced && hoverIdx < 0 && !pinnedRef.current) {
          rotY += dt * 0.1
          dirty = true
        }
      }
      if (!reduced) {
        elapsed += dt
        markerMat.uniforms.uTime.value = elapsed
        orbits.rotation.y += dt * 0.05
        sat.position.set(Math.cos(elapsed * 0.35) * 1.32, 0, Math.sin(elapsed * 0.35) * 1.32)
        dirty = true
      }
      if (!dirty) return
      dirty = false
      globe.rotation.set(rotX, rotY, 0)
      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(tick)

    api.current = {
      setEvents,
      requestRender: () => {
        dirty = true
      },
    }
    setEvents(evRef.current)

    const onCtxLost = (e: Event) => {
      e.preventDefault()
      onFailRef.current()
    }
    canvas.addEventListener('webglcontextlost', onCtxLost)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('webglcontextlost', onCtxLost)
      api.current = null
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose?.()
        const mat = m.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
        else mat?.dispose?.()
      })
      renderer.dispose()
    }
  }, [])

  useEffect(() => {
    evRef.current = events
    api.current?.setEvents(events)
  }, [events])

  return (
    <div className="globe-stage" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Interactive 3D globe. Drag to rotate. Markers show recent natural events reported by USGS and NASA EONET."
      />
      {tip && (
        <div
          className={`glass globe-tip ${tip.pinned ? 'pinned' : ''}`}
          style={{ left: Math.min(Math.max(tip.x, 135), tip.w - 135), top: Math.max(tip.y, 150) }}
          role="status"
        >
          <span className="badge proto" style={{ color: KIND_META[tip.ev.kind].color }}>
            {KIND_META[tip.ev.kind].label.replace(/s$/, '')}
          </span>
          <b style={{ marginTop: 8 }}>{tip.ev.title}</b>
          <div className="meta num">
            {timeAgo(tip.ev.time)} · {tip.ev.source}
            {tip.ev.magnitude != null && ` · M${tip.ev.magnitude.toFixed(1)}`}
          </div>
          <div className="meta">Source-reported observation</div>
          {tip.pinned && (
            <button
              className="btn btn-primary btn-sm"
              style={{ marginTop: 10, width: '100%' }}
              onClick={() => onOpen(tip.ev)}
            >
              Open in explorer
            </button>
          )}
        </div>
      )}
    </div>
  )
}
