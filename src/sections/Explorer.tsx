import { lazy, Suspense, useRef, useState } from 'react'
import { Reveal } from '../components/Reveal'
import { SearchBox } from '../components/SearchBox'
import { IconExpand, IconReset } from '../components/icons'
import { nearbyEvents, timeAgo, type HazardsState } from '../lib/hazards'
import type { Place } from '../lib/geocode'
import { useInView, useReducedMotion, webglAvailable } from '../lib/motion'
import { KIND_META, type FocusTarget, type HazardEvent, type HazardKind } from '../lib/types'

const HazardMap = lazy(() => import('../components/HazardMap'))
const ALL = Object.keys(KIND_META) as HazardKind[]
const NEARBY_KM = 500

interface Props {
  hz: HazardsState
  focus: FocusTarget | null
  onPlace: (p: Place) => void
  onEvent: (e: HazardEvent) => void
  onClear: () => void
}

export function Explorer({ hz, focus, onPlace, onEvent, onClear }: Props) {
  const reduced = useReducedMotion()
  const shell = useRef<HTMLDivElement>(null)
  const [wrapRef, near] = useInView<HTMLDivElement>('300px 0px')
  const [active, setActive] = useState<HazardKind[]>(ALL)
  const [resetNonce, setResetNonce] = useState(0)
  const [tileError, setTileError] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [gl] = useState(() => webglAvailable())

  const present = ALL.filter((k) => hz.events.some((e) => e.kind === k))
  const allFailed = hz.feeds.every((f) => f.state === 'error')
  const nearby =
    focus?.kind === 'place' ? nearbyEvents(hz.events, focus, NEARBY_KM) : []
  const selEvent = focus?.kind === 'event' ? hz.events.find((e) => e.id === focus.eventId) : undefined
  const recent = [...hz.events].sort((a, b) => +new Date(b.time) - +new Date(a.time)).slice(0, 8)

  const toggle = (k: HazardKind) =>
    setActive((a) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]))

  const fullscreen = () => {
    const s = shell.current
    if (!s) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else void s.requestFullscreen?.()
  }

  return (
    <section className="section" id="explorer" style={{ paddingTop: 'clamp(56px, 8vw, 110px)' }}>
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">Global intelligence explorer</span>
          <h2 className="h2">One planet. A clearer picture of environmental risk.</h2>
          <p className="lead">
            Explore supported observations in one geographic workspace. Markers are real,
            source-reported events from USGS and NASA EONET, fetched live in your browser — no
            account needed.
          </p>
        </Reveal>

        <div className="explorer" id="explorer-map" ref={wrapRef}>
          <div className="map-shell" ref={shell}>
            {near && gl && (
              <Suspense fallback={null}>
                <HazardMap
                  events={hz.events}
                  active={active}
                  focus={focus}
                  resetNonce={resetNonce}
                  reducedMotion={reduced}
                  onSelect={onEvent}
                  onStatus={(s) => {
                    if (s.ready) setMapReady(true)
                    if (s.tileError !== undefined) setTileError(s.tileError)
                  }}
                />
              </Suspense>
            )}

            <div className="map-toolbar">
              <SearchBox onPick={onPlace} placeholder="Search a location…" />
              <button className="chip" onClick={() => setResetNonce((n) => n + 1)} aria-label="Reset to global view">
                <IconReset /> Global view
              </button>
              <button className="chip" onClick={fullscreen} aria-label="Toggle fullscreen">
                <IconExpand /> Fullscreen
              </button>
              {present.map((k) => (
                <button
                  key={k}
                  className="chip"
                  aria-pressed={active.includes(k)}
                  onClick={() => toggle(k)}
                >
                  <span className="dot" style={{ background: KIND_META[k].color }} />
                  {KIND_META[k].label}
                  <span className="num" style={{ color: 'var(--muted)' }}>
                    {hz.events.filter((e) => e.kind === k).length}
                  </span>
                </button>
              ))}
            </div>

            <div className="glass map-legend">
              Marker colour = event type · size = earthquake magnitude · these are{' '}
              <b>source-reported observations</b>, not SignalBridge assessments or official warnings.
            </div>

            {!gl && (
              <div className="map-status">
                <div className="box">
                  <b>The interactive map needs WebGL.</b>
                  <p style={{ marginTop: 6 }}>
                    WebGL isn’t available in this browser, so the map can’t render. The event list
                    in the panel still works.
                  </p>
                </div>
              </div>
            )}
            {gl && near && !mapReady && (
              <div className="map-status">
                <div className="box">Loading map…</div>
              </div>
            )}
            {gl && mapReady && (hz.loading || allFailed || tileError) && (
              <div className="map-status clear">
                <div className="box" role="status">
                  {allFailed && !hz.loading
                    ? 'Live event feeds are unavailable right now (network or provider issue).'
                    : hz.loading
                      ? 'Loading live event feeds…'
                      : 'Some basemap tiles failed to load. Event markers are still shown.'}
                </div>
              </div>
            )}
          </div>

          <aside className="glass side" aria-label="Selected location evidence" aria-live="polite">
            {!focus && (
              <>
                <div>
                  <span className="badge live">Live feeds</span>
                  <h3 style={{ marginTop: 12 }}>Select a marker or search a place</h3>
                  <p className="lead" style={{ fontSize: 14, marginTop: 8 }}>
                    Evidence, timestamps and sources appear here. Most recent events:
                  </p>
                </div>
                {hz.loading && <div className="note">Loading events…</div>}
                {!hz.loading && recent.length === 0 && (
                  <div className="note amber">
                    No events could be loaded from the public feeds. This is a connectivity or
                    provider issue — not evidence that nothing is happening.{' '}
                    <button className="text-link" style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0 }} onClick={hz.refresh}>
                      Retry
                    </button>
                  </div>
                )}
                <div>
                  {recent.map((e) => (
                    <button key={e.id} className="ev-row" onClick={() => onEvent(e)}>
                      <span className="dot" style={{ background: KIND_META[e.kind].color }} />
                      <span>
                        <strong>{e.title}</strong>
                        <small>{e.source}</small>
                      </span>
                      <span className="m num">{timeAgo(e.time)}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {selEvent && (
              <>
                <div>
                  <span className="badge" style={{ color: KIND_META[selEvent.kind].color }}>
                    {KIND_META[selEvent.kind].label.replace(/s$/, '')}
                  </span>
                  <h3 style={{ marginTop: 12 }}>{selEvent.title}</h3>
                </div>
                <dl className="kv">
                  <dt>Class</dt>
                  <dd>Observation reported by {selEvent.source}</dd>
                  <dt>Observed</dt>
                  <dd className="num">
                    {new Date(selEvent.time).toUTCString().replace('GMT', 'UTC')} ({timeAgo(selEvent.time)})
                  </dd>
                  {selEvent.magnitude != null && (
                    <>
                      <dt>Magnitude</dt>
                      <dd className="num">M{selEvent.magnitude.toFixed(1)}</dd>
                    </>
                  )}
                  {selEvent.status && (
                    <>
                      <dt>Status</dt>
                      <dd>{selEvent.status}</dd>
                    </>
                  )}
                  <dt>Position</dt>
                  <dd className="num">
                    {selEvent.lat.toFixed(3)}, {selEvent.lon.toFixed(3)}
                  </dd>
                  <dt>Source</dt>
                  <dd>
                    <a className="text-link" href={selEvent.sourceUrl} target="_blank" rel="noreferrer">
                      {selEvent.source} record ↗
                    </a>
                  </dd>
                </dl>
                <div className="note">
                  Event positions are as reported by the source; EONET events use the latest reported
                  point. This is not a SignalBridge assessment or an official warning.
                </div>
                <a className="btn btn-primary btn-sm" href="#briefing">See evidence briefing</a>
                <button className="btn btn-sm" onClick={onClear}>Clear selection</button>
              </>
            )}

            {focus?.kind === 'place' && (
              <>
                <div>
                  <span className="badge proto">Searched place</span>
                  <h3 style={{ marginTop: 12 }}>{focus.label}</h3>
                  <p className="num" style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
                    {focus.lat.toFixed(3)}, {focus.lon.toFixed(3)}
                  </p>
                </div>
                <div className="note">
                  The geocoder confirmed this place exists. That is <b>not</b> the same as having
                  environmental data for it.
                </div>
                {hz.loading && <div className="note">Loading events…</div>}
                {!hz.loading && nearby.length > 0 && (
                  <div>
                    <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>
                      {nearby.length} source-reported event{nearby.length > 1 ? 's' : ''} within {NEARBY_KM} km:
                    </p>
                    {nearby.slice(0, 8).map(({ e, d }) => (
                      <button key={e.id} className="ev-row" onClick={() => onEvent(e)}>
                        <span className="dot" style={{ background: KIND_META[e.kind].color }} />
                        <span>
                          <strong>{e.title}</strong>
                          <small>
                            {e.source} · {timeAgo(e.time)}
                          </small>
                        </span>
                        <span className="m num">{Math.round(d)} km</span>
                      </button>
                    ))}
                  </div>
                )}
                {!hz.loading && nearby.length === 0 && (
                  <div className="note amber">
                    {allFailed
                      ? 'The live feeds could not be loaded, so nothing can be said about this place.'
                      : `No events in the loaded feeds within ${NEARBY_KM} km. This does not mean there is no hazard: the feeds only cover M2.5+ earthquakes and NASA-tracked natural events.`}
                  </div>
                )}
                <a className="btn btn-primary btn-sm" href="#briefing">See evidence briefing</a>
                <button className="btn btn-sm" onClick={onClear}>Clear selection</button>
              </>
            )}
          </aside>
        </div>
      </div>
    </section>
  )
}
