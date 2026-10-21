import { useRef, useState, type KeyboardEvent } from 'react'
import { Reveal } from '../components/Reveal'
import { timeAgo, type HazardsState } from '../lib/hazards'

type S = 'live' | 'proto' | 'planned'
const lab: Record<S, string> = { live: 'Live', proto: 'Prototype', planned: 'Planned' }

const tabs = [
  'Global Overview',
  'Location Intelligence',
  'Live Monitoring',
  'Alerts & Incidents',
  'Organization Intelligence',
  'System & Data Health',
] as const

interface Cfg {
  status: S
  title: string
  body: string
  done: string[]
  next: string[]
}
const cfg: Record<(typeof tabs)[number], Cfg> = {
  'Global Overview': {
    status: 'live',
    title: 'A real map of real, source-reported events',
    body: 'The explorer above is the global overview: a MapLibre map with live USGS and NASA EONET events, type filters and an evidence panel.',
    done: ['Interactive map with real basemap tiles', 'Earthquake, wildfire, volcano, storm and flood event layers (as reported)', 'Per-event source link and timestamp'],
    next: ['Rainfall, temperature and flood-assessment layers', 'Community-report layer'],
  },
  'Location Intelligence': {
    status: 'proto',
    title: 'From a searched place to an evidence briefing',
    body: 'Search a place, see nearby source-reported events with distances, and read a deterministic briefing with citations and stated uncertainty.',
    done: ['Place search via Open-Meteo geocoding', 'Nearby-event evidence list', 'Rule-based briefing with four audience framings'],
    next: ['Language-model explanations grounded in the same evidence', 'Hazard-specific risk assessments with documented methods'],
  },
  'Live Monitoring': {
    status: 'planned',
    title: 'Physical sensor to live dashboard',
    body: 'Designed for an ESP32 + ultrasonic water-level station. No hardware is connected to this site, so no readings are shown.',
    done: [],
    next: ['Backend ingestion and validation endpoint', 'Water-depth chart, last-received time, device health', 'Stale / offline / sensor-fault states'],
  },
  'Alerts & Incidents': {
    status: 'planned',
    title: 'Incidents with verification status',
    body: 'A feed that separates official warnings, platform advisories, observations and unverified reports. Requires a backend and moderation workflow that do not exist yet.',
    done: [],
    next: ['Incident feed and filters', 'Verification and duplicate handling', 'Expiry and correction states'],
  },
  'Organization Intelligence': {
    status: 'planned',
    title: 'Many locations, one picture',
    body: 'Monitored-location lists, exposure context and reporting for teams. Needs authentication and per-organization storage, which are not built.',
    done: [],
    next: ['Authenticated organization workspaces', 'Saved locations and reports', 'Role-based access enforced by the backend'],
  },
  'System & Data Health': {
    status: 'live',
    title: 'What the data layer is doing right now',
    body: 'Below are the actual statuses of the two public feeds this page loaded, measured in your browser just now.',
    done: ['Per-feed state, count and fetch time (shown live)'],
    next: ['Server-side ingestion logs', 'Sensor availability and AI-service status'],
  },
}

export function Capabilities({ hz }: { hz: HazardsState }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>('Global Overview')
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const c = cfg[tab]
  const idx = tabs.indexOf(tab)

  const onKey = (e: KeyboardEvent) => {
    let n: number
    if (e.key === 'ArrowRight') n = (idx + 1) % tabs.length
    else if (e.key === 'ArrowLeft') n = (idx + tabs.length - 1) % tabs.length
    else if (e.key === 'Home') n = 0
    else if (e.key === 'End') n = tabs.length - 1
    else return
    e.preventDefault()
    setTab(tabs[n])
    refs.current[n]?.focus()
  }

  return (
    <section className="section" id="capabilities">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">Platform capabilities</span>
          <h2 className="h2">From fragmented data to a clearer understanding.</h2>
          <p className="lead">
            Six areas of the platform and exactly how far each one has got. Planned areas are shown
            as plans — not as screenshots of features that don’t exist.
          </p>
        </Reveal>
        <div className="tabs" role="tablist" aria-label="Platform capabilities" onKeyDown={onKey}>
          {tabs.map((t, i) => (
            <button
              key={t}
              ref={(el) => {
                refs.current[i] = el
              }}
              role="tab"
              id={`tab-${i}`}
              aria-selected={tab === t}
              aria-controls="cap-panel"
              tabIndex={tab === t ? 0 : -1}
              className="tab"
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="tab-panel" key={tab} id="cap-panel" role="tabpanel" aria-labelledby={`tab-${idx}`}>
          <div className="glass">
            <span className={`badge ${c.status}`}>{lab[c.status]}</span>
            <h3>{c.title}</h3>
            <p>{c.body}</p>
            <ul className="checks">
              {c.done.map((d) => (
                <li key={d}>{d}</li>
              ))}
              {c.next.map((d) => (
                <li key={d} className="pl">
                  <span>
                    {d} <span style={{ color: 'var(--muted)', fontSize: 12 }}>(planned)</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="glass">
            {tab === 'Global Overview' && (
              <>
                <div className="stat-grid">
                  <div className="stat">
                    <div className="v num">{hz.loading ? '…' : hz.events.length}</div>
                    <div className="l">events loaded right now</div>
                  </div>
                  <div className="stat">
                    <div className="v num">{hz.feeds.filter((f) => f.state === 'ok').length}/{hz.feeds.length}</div>
                    <div className="l">public feeds reachable</div>
                  </div>
                </div>
                <p style={{ marginTop: 16, fontSize: 13.5 }}>
                  Counts are live from the sources and change on every load. Coverage is limited to
                  what those two providers report.
                </p>
                <a className="btn btn-primary btn-sm" style={{ marginTop: 16 }} href="#explorer">
                  Open the explorer
                </a>
              </>
            )}
            {tab === 'System & Data Health' && (
              <>
                {hz.feeds.map((f) => (
                  <div className="feed-row" key={f.id}>
                    <span>
                      <a className="text-link" href={f.homepage} target="_blank" rel="noreferrer">{f.name}</a>
                      <small className="num">
                        {f.state === 'ok' && `${f.count} records · fetched ${f.fetchedAt ? timeAgo(f.fetchedAt) : ''}`}
                        {f.state === 'loading' && 'Fetching…'}
                        {f.state === 'error' && (f.error ?? 'Request failed')}
                      </small>
                    </span>
                    <span className={`badge ${f.state === 'ok' ? 'live' : f.state === 'error' ? 'err' : 'planned'}`}>
                      {f.state === 'ok' ? 'OK' : f.state === 'error' ? 'Failed' : 'Loading'}
                    </span>
                  </div>
                ))}
                <button className="btn btn-sm" style={{ marginTop: 16 }} onClick={hz.refresh}>
                  Refresh feeds
                </button>
              </>
            )}
            {tab === 'Location Intelligence' && (
              <div className="placeholder-viz">
                <div>
                  Search any place in the explorer, then open the{' '}
                  <a className="text-link" href="#briefing">evidence briefing</a>.
                </div>
              </div>
            )}
            {(tab === 'Live Monitoring' ||
              tab === 'Alerts & Incidents' ||
              tab === 'Organization Intelligence') && (
              <div className="placeholder-viz">
                <div>
                  <span className="badge planned">Planned</span>
                  <p style={{ marginTop: 12 }}>
                    No interface is shown because this capability isn’t built yet. We won’t show a
                    mock-up that looks like working software.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
