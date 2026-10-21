import { Reveal } from '../components/Reveal'
import { IconArrow } from '../components/icons'

function Art({ seed }: { seed: number }) {
  const rings = Array.from({ length: 9 }, (_, i) => {
    const r = 20 + i * 14
    const pts = Array.from({ length: 49 }, (_, k) => {
      const a = (k / 48) * Math.PI * 2
      const w = 1 + 0.14 * Math.sin(a * (2 + seed) + i * 0.4) + 0.06 * Math.cos(a * (5 + seed))
      return `${k ? 'L' : 'M'}${(140 + Math.cos(a) * r * w).toFixed(1)} ${(140 + Math.sin(a) * r * w).toFixed(1)}`
    })
    return pts.join('') + 'Z'
  })
  return (
    <svg className="art" viewBox="0 0 280 280" aria-hidden="true">
      {rings.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={i % 3 === 0 ? '#55E7FF' : '#78BEE6'} strokeOpacity={i % 3 === 0 ? 0.45 : 0.2} />
      ))}
      <circle cx="140" cy="140" r="3.5" fill="#55E7FF" />
    </svg>
  )
}

const cases = [
  {
    t: 'Residents & communities',
    p: 'Understand relevant local environmental information, explore preparedness resources, and inspect available evidence for places that matter to you.',
    cta: 'Explore Local Intelligence',
    caveat: 'Not a substitute for official local warnings.',
  },
  {
    t: 'Agriculture',
    p: 'Review supported weather and hazard-related information for selected farming locations.',
    cta: 'Explore Agricultural Use Cases',
    caveat: 'No yield predictions or crop recommendations. Rainfall, temperature and soil layers are planned.',
  },
  {
    t: 'Travel & logistics',
    p: 'Explore supported environmental conditions and relevant disruptions around destinations and facilities.',
    cta: 'Explore Location Risks',
    caveat: 'No route-safety or live road-status claims.',
  },
  {
    t: 'Organizations & infrastructure',
    p: 'Monitor multiple locations, review supported exposure information, and access environmental reporting where available.',
    cta: 'Explore Organization Intelligence',
    caveat: 'Multi-site workspaces are planned and need authentication, which isn’t built yet.',
  },
]

export function UseCases() {
  return (
    <section className="section" id="use-cases">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">Audiences</span>
          <h2 className="h2">Built for people who need environmental intelligence to make decisions.</h2>
        </Reveal>
        <div className="uc-grid">
          {cases.map((c, i) => (
            <Reveal key={c.t} delay={i * 0.06} className="uc">
              <Art seed={i} />
              <h3>{c.t}</h3>
              <p>{c.p}</p>
              <span className="caveat">{c.caveat}</span>
              <a className="btn btn-sm" style={{ alignSelf: 'flex-start', position: 'relative' }} href={i === 3 ? '#capabilities' : '#explorer'}>
                {c.cta} <IconArrow />
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
