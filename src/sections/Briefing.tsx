import { useMemo, useState } from 'react'
import { Reveal } from '../components/Reveal'
import { nearbyEvents, timeAgo, type HazardsState } from '../lib/hazards'
import { KIND_META, type FocusTarget, type HazardKind } from '../lib/types'

const PERSONAS = ['Residents', 'Farmers', 'Travellers', 'Organizations'] as const
type Persona = (typeof PERSONAS)[number]
const RADIUS = 300

const framing: Record<Persona, { lead: string; steps: string[] }> = {
  Residents: {
    lead: 'For people living nearby, reports like these are context, not a forecast of what will happen to you.',
    steps: [
      'Follow your national geological, meteorological or civil-protection authority for official guidance.',
      'Check that your household emergency plan and contacts are up to date.',
    ],
  },
  Farmers: {
    lead: 'For land and livestock the practical questions are whether anything has been reported near your fields, water sources or buildings, and how recent it is. This briefing contains no soil, rainfall or crop data.',
    steps: [
      'Inspect structures and water infrastructure if strong shaking was reported close to you.',
      'Ask your local agricultural or disaster-management office for official advisories.',
    ],
  },
  Travellers: {
    lead: 'For a trip, treat this as one input among several. Point reports say nothing about transport status or whether services are running.',
    steps: [
      'Check your airline or carrier and your government’s travel advisory for current conditions.',
      'Re-check closer to departure — the feeds update continuously.',
    ],
  },
  Organizations: {
    lead: 'For a site or supplier network, compare event positions with your facility locations and record the timestamps and sources used. Asset-level exposure analysis is not implemented here.',
    steps: [
      'Record which sources and timestamps informed any decision.',
      'Confirm with the responsible official authority before acting on an incident.',
    ],
  },
}

function plural(n: number, w: string) {
  return `${n} ${w}${n === 1 ? '' : 's'}`
}

export function Briefing({ hz, focus }: { hz: HazardsState; focus: FocusTarget | null }) {
  const [persona, setPersona] = useState<Persona>('Residents')

  const subject = useMemo(() => {
    if (focus) return { lon: focus.lon, lat: focus.lat, label: focus.label, example: false }
    const quakes = hz.events.filter((e) => e.magnitude != null)
    const best = quakes.sort((a, b) => (b.magnitude ?? 0) - (a.magnitude ?? 0))[0] ?? hz.events[0]
    return best ? { lon: best.lon, lat: best.lat, label: best.title, example: true } : null
  }, [focus, hz.events])

  const near = useMemo(() => (subject ? nearbyEvents(hz.events, subject, RADIUS) : []), [subject, hz.events])
  const allFailed = hz.feeds.every((f) => f.state === 'error')

  const counts = (Object.keys(KIND_META) as HazardKind[])
    .map((k) => ({ k, n: near.filter((x) => x.e.kind === k).length }))
    .filter((x) => x.n > 0)
  const maxMag = near.reduce((m, x) => Math.max(m, x.e.magnitude ?? 0), 0)
  const f = framing[persona]

  return (
    <section className="section" id="briefing">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">AI intelligence preview</span>
          <h2 className="h2">Understand the evidence behind the assessment.</h2>
          <p className="lead">
            A briefing built only from the events the live feeds returned for the selected place.
            Switching audience changes the framing and next steps — never the underlying facts.
          </p>
        </Reveal>

        <div className="tabs" role="group" aria-label="Audience perspective" style={{ marginTop: 36 }}>
          {PERSONAS.map((p) => (
            <button key={p} className="tab" aria-pressed={persona === p} aria-selected={persona === p} onClick={() => setPersona(p)}>
              {p}
            </button>
          ))}
        </div>

        {!subject ? (
          <div className="glass" style={{ padding: 32, marginTop: 20 }}>
            <span className="badge warn">No data</span>
            <p style={{ marginTop: 12, color: 'var(--muted)' }}>
              {hz.loading
                ? 'Loading live events…'
                : allFailed
                  ? 'The live feeds are unreachable, so no briefing can be built. Nothing is being shown instead of invented data.'
                  : 'The feeds returned no events to build an example from. Search a place in the explorer.'}
            </p>
          </div>
        ) : (
          <div className="brief">
            <div className="glass">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                <span className="badge proto">Rule-based summary · no AI model connected</span>
                <span className="badge">{subject.example ? 'Example from live feed' : 'Your selection'}</span>
              </div>
              <h4>Selected location</h4>
              <p>
                <b>{subject.label}</b>{' '}
                <span className="num" style={{ color: 'var(--muted)' }}>
                  ({subject.lat.toFixed(2)}, {subject.lon.toFixed(2)})
                </span>
              </p>

              <h4>What the evidence may mean</h4>
              <p>
                {near.length === 0
                  ? `The loaded feeds contain no source-reported events within ${RADIUS} km.`
                  : `Within ${RADIUS} km the feeds report ${plural(near.length, 'event')}: ${counts
                      .map((c) => `${c.n} ${KIND_META[c.k].label.toLowerCase()}`)
                      .join(', ')}${maxMag > 0 ? `; the largest earthquake is M${maxMag.toFixed(1)}` : ''}. The most recent was ${timeAgo(
                      near.reduce((a, b) => (new Date(a.e.time) > new Date(b.e.time) ? a : b)).e.time,
                    )}.`}{' '}
                {f.lead}
              </p>

              <h4>What remains uncertain</h4>
              <ul>
                <li>Coverage: only M2.5+ earthquakes and NASA EONET open events — absence of events is not absence of hazard.</li>
                <li>Earthquake magnitudes and locations can be revised by USGS after first publication.</li>
                <li>EONET positions are the latest reported point and can be approximate.</li>
                <li>No weather, rainfall, flood-gauge, soil or sensor data is included.</li>
              </ul>

              <h4>Practical next steps</h4>
              <ul>
                {f.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <p style={{ marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
                This is a SignalBridge summary, not an official warning.
              </p>
            </div>

            <div className="glass">
              <h4>Evidence · source citations</h4>
              {near.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 14 }}>No records to cite.</p>}
              {near.slice(0, 7).map(({ e, d }) => (
                <a key={e.id} className="cite" href={e.sourceUrl} target="_blank" rel="noreferrer">
                  <span style={{ color: KIND_META[e.kind].color }}>●</span> {e.title}
                  <small className="num">
                    {KIND_META[e.kind].label.replace(/s$/, '')} · Observed (source-reported) · {e.source} ·{' '}
                    {timeAgo(e.time)} · {Math.round(d)} km
                  </small>
                </a>
              ))}
              {near.length > 7 && (
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>+ {near.length - 7} more within {RADIUS} km</p>
              )}
              <h4 style={{ marginTop: 24 }}>Method</h4>
              <p style={{ fontSize: 13.5, color: 'var(--muted)' }}>
                Events within {RADIUS} km are selected by great-circle distance and summarised with a
                fixed text template. Each citation links to the provider’s own record.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
