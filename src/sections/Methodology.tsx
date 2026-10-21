import { Reveal } from '../components/Reveal'
import type { HazardsState } from '../lib/hazards'

type S = 'live' | 'proto' | 'planned'
const rows: { s: string; t: string; st: S; n: string }[] = [
  { s: 'USGS Earthquake Hazards Program', t: 'Observed earthquakes (M2.5+, 24 h)', st: 'live', n: 'Public GeoJSON feed, fetched in your browser.' },
  { s: 'NASA EONET', t: 'Open natural events (wildfire, storm, volcano, flood…)', st: 'live', n: 'Latest reported point per event.' },
  { s: 'Open-Meteo Geocoding', t: 'Place-name search', st: 'live', n: 'Finds coordinates only. Provides no environmental data.' },
  { s: 'CARTO / OpenStreetMap', t: 'Basemap tiles', st: 'live', n: 'Cartography only.' },
  { s: 'Meteorological providers', t: 'Weather observations & forecasts', st: 'planned', n: 'Not connected.' },
  { s: 'Satellite-derived products', t: 'Fire, rainfall, flood extent', st: 'planned', n: 'Not connected.' },
  { s: 'Hydrological gauges', t: 'River & water levels', st: 'planned', n: 'Not connected.' },
  { s: 'SignalBridge ESP32 stations', t: 'Water-level telemetry', st: 'planned', n: 'No hardware reporting yet.' },
  { s: 'Community reports', t: 'Unverified local observations', st: 'planned', n: 'Needs backend and moderation.' },
]
const lab: Record<S, string> = { live: 'Live', proto: 'Prototype', planned: 'Planned' }

export function Methodology({ hz }: { hz: HazardsState }) {
  return (
    <section className="section" id="methodology">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">Data sources &amp; methodology</span>
          <h2 className="h2">Trust begins with knowing where the evidence comes from.</h2>
        </Reveal>
        <div className="method-grid">
          {[
            ['Source provenance', 'Every event carries its provider and a link to the provider’s own record.'],
            ['Timestamps & freshness', 'Observation time comes from the source. Fetch time is measured in your browser and shown on the health view.'],
            ['Classification', 'Observed, forecast, estimated and community-reported information are different things and are labelled as such. Today only source-reported observations are shown.'],
            ['Quality checks', 'Only records with valid coordinates are plotted. We do not currently de-duplicate across sources or verify reports.'],
            ['Assessment method', 'There are no risk scores. The briefing is a fixed text template over nearby events, stated in the interface.'],
            ['Uncertainty & limits', 'Coverage is partial, revisions happen, and positions can be approximate. Absence of events is never presented as safety.'],
          ].map(([t, p], i) => (
            <Reveal key={t} delay={i * 0.05} className="mcell">
              <h3>{t}</h3>
              <p>{p}</p>
            </Reveal>
          ))}
        </div>
        <div className="table-scroll">
          <table className="sources">
            <caption className="sr-only">Data sources and their integration status</caption>
            <thead>
              <tr>
                <th scope="col">Source</th>
                <th scope="col">Provides</th>
                <th scope="col">Status</th>
                <th scope="col">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.s}>
                  <th scope="row" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 14, color: 'var(--white)' }}>{r.s}</th>
                  <td>{r.t}</td>
                  <td>
                    <span className={`badge ${r.st}`}>{lab[r.st]}</span>
                  </td>
                  <td style={{ color: 'var(--muted)' }}>{r.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: 12, fontSize: 13, color: 'var(--muted)' }}>
          This session: {hz.loading ? 'loading feeds…' : `${hz.feeds.filter((f) => f.state === 'ok').length} of ${hz.feeds.length} live feeds reachable, ${hz.events.length} events.`}
        </p>
        <div className="callout">
          <b>SignalBridge assessments are not official warnings.</b> For emergencies, follow your
          national meteorological, geological or civil-protection authority.
        </div>
      </div>
    </section>
  )
}
