import { useEffect, useState, type MouseEvent } from 'react'
import { Reveal } from '../components/Reveal'
import { IconBrain, IconLayers, IconPin, IconRadio } from '../components/icons'
import { useReducedMotion } from '../lib/motion'

const PHRASES = [
  'actionable intelligence.',
  'location-specific insights.',
  'clearer risk awareness.',
  'informed decisions.',
]

const cards = [
  {
    icon: <IconLayers />,
    title: 'Unified Environmental View',
    body: 'Bring available environmental observations and supported hazard information into one geographic workspace.',
    badge: ['live', 'Live · 2 public feeds'],
  },
  {
    icon: <IconPin />,
    title: 'Location-Specific Intelligence',
    body: 'Connect evidence to a selected place and explain the implications that the evidence supports.',
    badge: ['proto', 'Prototype'],
  },
  {
    icon: <IconRadio />,
    title: 'Live Environmental Monitoring',
    body: 'Display actual readings from connected sensors, including water-level measurements, timestamps, and device health where available.',
    badge: ['planned', 'Planned · awaiting hardware'],
  },
  {
    icon: <IconBrain />,
    title: 'Evidence-Grounded AI',
    body: 'Translate supported evidence into clear explanations, practical next steps, and transparent citations.',
    badge: ['proto', 'Prototype · rule-based, no AI model yet'],
  },
] as const

function spot(e: MouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
}

export function Why() {
  const reduced = useReducedMotion()
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (reduced) return
    const t = window.setInterval(() => setIdx((i) => (i + 1) % PHRASES.length), 3000)
    return () => window.clearInterval(t)
  }, [reduced])

  const cur = reduced ? 0 : idx
  const prev = (cur + PHRASES.length - 1) % PHRASES.length

  return (
    <section className="section" id="why">
      <div className="container">
        <Reveal>
          <span className="eyebrow">Why SignalBridge?</span>
          <h2 className="why-h">
            We turn environmental signals into
            <span className="sr-only"> {PHRASES.join(' ')}</span>
            <span className={`rotor ${reduced ? 'static' : ''}`} aria-hidden="true">
              {PHRASES.map((p, i) => (
                <span key={p} className={i === cur ? 'on' : i === prev && !reduced ? 'off' : ''}>
                  {p}
                </span>
              ))}
            </span>
          </h2>
          <p className="lead">
            Environmental information is often fragmented across maps, sensors, weather sources,
            reports, and separate tools. SignalBridge brings supported information into one
            geographic intelligence workflow and explains its relevance without hiding uncertainty.
          </p>
        </Reveal>
        <div className="cards-4">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08}>
              <article className="fcard" onMouseMove={spot} style={{ height: '100%' }}>
                <div className="ico">{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
                <span className={`badge ${c.badge[0]}`}>{c.badge[1]}</span>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
