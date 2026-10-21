import { lazy, Suspense, useState } from 'react'
import { SearchBox } from '../components/SearchBox'
import { IconArrow } from '../components/icons'
import type { Place } from '../lib/geocode'
import type { HazardsState } from '../lib/hazards'
import { useReducedMotion, webglAvailable } from '../lib/motion'
import { KIND_META, type HazardEvent, type HazardKind } from '../lib/types'

const Globe = lazy(() => import('../components/Globe'))

function Fallback({ text }: { text: string }) {
  return (
    <div className="globe-stage" aria-live="polite">
      <div className="globe-fallback">{text}</div>
    </div>
  )
}

interface Props {
  hz: HazardsState
  onPlace: (p: Place) => void
  onEvent: (e: HazardEvent) => void
}

export function Hero({ hz, onPlace, onEvent }: Props) {
  const reduced = useReducedMotion()
  const [gl, setGl] = useState(() => webglAvailable())
  const kinds = (Object.keys(KIND_META) as HazardKind[]).filter((k) =>
    hz.events.some((e) => e.kind === k),
  )
  const allFailed = hz.feeds.every((f) => f.state === 'error')

  return (
    <header className="hero" id="top">
      <div className="container hero-grid">
        <div className="hero-in">
          <span className="eyebrow">Environmental intelligence</span>
          <h1>
            Understand the <span className="grad-text">signals</span> shaping our planet.
          </h1>
          <p className="sub">
            SignalBridge connects environmental observations, hazard information, and local
            monitoring into location-specific intelligence and practical next steps.
          </p>
          <SearchBox onPick={onPlace} />
          <div className="hero-ctas">
            <a className="btn btn-primary" href="#explorer">
              Explore Global Intelligence <IconArrow />
            </a>
            <a className="btn" href="#how">
              See How It Works
            </a>
          </div>
          <p className="hero-trust">
            Environmental evidence<i>·</i>Geospatial intelligence<i>·</i>Actionable insights
          </p>
        </div>

        <div style={{ position: 'relative', paddingBottom: 18 }}>
          {gl ? (
            <Suspense fallback={<Fallback text="Loading globe…" />}>
              <Globe
                events={hz.events}
                reducedMotion={reduced}
                onOpen={(e) => {
                  onEvent(e)
                }}
                onFail={() => setGl(false)}
              />
            </Suspense>
          ) : (
            <Fallback text="The 3D globe needs WebGL, which isn’t available here. The map below works the same way and the page is fully usable." />
          )}
          <div className="globe-caption" role="status">
            {hz.loading && <span>Loading live events…</span>}
            {!hz.loading && allFailed && <span>Live event feeds unavailable</span>}
            {!hz.loading &&
              !allFailed &&
              kinds.map((k) => (
                <span key={k}>
                  <span className="dot" style={{ background: KIND_META[k].color }} />
                  {KIND_META[k].label}
                </span>
              ))}
          </div>
        </div>
      </div>
    </header>
  )
}
