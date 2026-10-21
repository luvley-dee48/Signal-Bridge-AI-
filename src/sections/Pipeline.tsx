import { Reveal } from '../components/Reveal'

type S = 'live' | 'proto' | 'planned'
const lab: Record<S, string> = { live: 'Live', proto: 'Prototype', planned: 'Planned' }

const stages: { n: string; title: string; body: string; items: [string, S][] }[] = [
  {
    n: '01',
    title: 'Environmental Data',
    body: 'Collect supported information from environmental data providers, weather feeds, satellite products, connected sensors, and community reports.',
    items: [
      ['USGS earthquake feed', 'live'],
      ['NASA EONET natural events', 'live'],
      ['Open-Meteo place search', 'live'],
      ['Weather & satellite products', 'planned'],
      ['ESP32 sensors · community reports', 'planned'],
    ],
  },
  {
    n: '02',
    title: 'Interpretation',
    body: 'Classify incoming evidence, assess what the available data supports, and explain uncertainty in clear language. This does not verify facts or issue official warnings.',
    items: [
      ['Source classification', 'proto'],
      ['Deterministic rule-based summary', 'proto'],
      ['AI language model explanations', 'planned'],
    ],
  },
  {
    n: '03',
    title: 'Location-Specific Intelligence',
    body: 'Show the relevant findings for a place, explain their potential significance, and provide practical next steps.',
    items: [
      ['Place → nearby events', 'live'],
      ['Evidence briefing with citations', 'proto'],
      ['Preparedness guidance library', 'planned'],
    ],
  },
]

export function Pipeline() {
  return (
    <section className="section" id="how">
      <div className="container">
        <Reveal className="section-head center">
          <span className="eyebrow">How SignalBridge works</span>
          <h2 className="h2">Evidence becomes understanding. Understanding informs action.</h2>
          <p className="lead">
            The pipeline below shows the architecture honestly: what runs today, what is a
            prototype, and what is still planned.
          </p>
        </Reveal>
        <div className="pipe">
          <div className="pipe-line" aria-hidden="true" />
          {stages.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.18}>
              <article className="stage">
                <span className="n">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                <ul>
                  {s.items.map(([t, st]) => (
                    <li key={t}>
                      <span>{t}</span>
                      <span className={`badge ${st}`}>{lab[st]}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
