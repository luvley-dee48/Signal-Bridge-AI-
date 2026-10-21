import { Reveal } from '../components/Reveal'
import { CONTACT_URL } from '../lib/config'

const who = [
  'Research institutions',
  'Environmental data providers',
  'Universities',
  'Community organizations',
  'Climate-resilience programmes',
  'Infrastructure & logistics',
  'Agricultural organizations',
  'Public agencies',
]

export function Partners() {
  return (
    <section className="section" id="partners" style={{ paddingTop: 0 }}>
      <div className="container">
        <Reveal className="glass partner">
          <div>
            <span className="eyebrow">Partnerships &amp; pilot programme</span>
            <h2 className="h2">Build better environmental intelligence with us.</h2>
            <p className="lead">
              SignalBridge is a prototype. We’re looking to validate use cases, data quality and
              practical outcomes through pilot projects. There are no signed partners today.
            </p>
            <div className="hero-ctas">
              <a className="btn btn-primary" href={CONTACT_URL} target="_blank" rel="noreferrer">Discuss a Pilot</a>
              <a className="btn" href={CONTACT_URL} target="_blank" rel="noreferrer">Partner With SignalBridge</a>
              <a className="btn" href={CONTACT_URL} target="_blank" rel="noreferrer">Contact the Team</a>
            </div>
            <p style={{ marginTop: 14, fontSize: 13, color: 'var(--muted)' }}>
              These open a new issue on the project’s GitHub repository — the only contact route configured so far.
            </p>
          </div>
          <div>
            <p style={{ fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--cyan)', fontWeight: 600 }}>
              We’d like to hear from
            </p>
            <div className="chips">
              {who.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
