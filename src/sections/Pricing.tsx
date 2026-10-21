import { Reveal } from '../components/Reveal'
import { IconCheck, IconDash } from '../components/icons'
import { CONTACT_URL, type PageActions } from '../lib/config'

interface Plan {
  name: string
  who: string
  price: string
  note: string
  features: [string, boolean][]
  cta: string
  href: string
  external?: boolean
  featured?: boolean
}

const plans: Plan[] = [
  {
    name: 'Explorer',
    who: 'For individuals exploring supported environmental information.',
    price: 'Free',
    note: 'Available now — no account required.',
    features: [
      ['Public global explorer', true],
      ['Place search', true],
      ['Source link and timestamp on every record', true],
      ['Rule-based evidence briefing', true],
      ['Public preparedness resources', false],
    ],
    cta: 'Explore for Free',
    href: '#explorer',
    featured: true,
  },
  {
    name: 'Intelligence',
    who: 'For professionals who need deeper analysis and monitoring.',
    price: 'Planned paid plan',
    note: 'Not available. Pricing is not decided.',
    features: [
      ['Saved locations', false],
      ['Multi-location monitoring', false],
      ['Configurable notifications', false],
      ['Historical analysis & exports', false],
    ],
    cta: 'Register interest',
    href: CONTACT_URL,
    external: true,
  },
  {
    name: 'Enterprise',
    who: 'For organizations that need tailored workflows.',
    price: 'Custom pricing',
    note: 'Pilot discussions only.',
    features: [
      ['Multi-site workflows', false],
      ['Eligible API access', false],
      ['Role-based access', false],
      ['Custom reporting & integrations', false],
    ],
    cta: 'Discuss a Pilot',
    href: CONTACT_URL,
    external: true,
  },
]

export function Pricing({ openAccess }: PageActions) {
  return (
    <section className="section" id="pricing">
      <div className="container">
        <Reveal className="section-head center">
          <span className="eyebrow">SignalBridge Intelligence</span>
          <h2 className="h2">Intelligence for a changing planet.</h2>
          <p className="lead">
            Explore environmental information for free, then choose the monitoring and analysis
            capabilities your work requires — as they become available.
          </p>
        </Reveal>
        <div className="plans">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.1} className={`plan ${p.featured ? 'featured' : ''}`}>
              {p.featured ? <span className="badge live tag">Available now</span> : <span className="badge planned tag">Planned</span>}
              <h3>{p.name}</h3>
              <p className="for">{p.who}</p>
              <div className="price">{p.price}</div>
              <div className="price-note">{p.note}</div>
              <ul>
                {p.features.map(([f, on]) => (
                  <li key={f} className={on ? '' : 'pl'}>
                    {on ? <IconCheck /> : <IconDash />}
                    <span>
                      {f}
                      {!on && <span style={{ fontSize: 12 }}> · planned</span>}
                    </span>
                  </li>
                ))}
              </ul>
              <a
                className={`btn ${p.featured ? 'btn-primary' : ''}`}
                href={p.href}
                {...(p.external ? { target: '_blank', rel: 'noreferrer' } : {})}
              >
                {p.cta}
              </a>
            </Reveal>
          ))}
        </div>
        <Reveal className="fineprint">
          <p>
            No prices are final and no payment is taken on this site. Add-ons (extra locations,
            history, integrations, API limits, sensor support) are <b>to be discussed</b>.
            Critical official emergency warnings will never be placed behind a paywall.
          </p>
          <p style={{ marginTop: 10 }}>
            <button className="text-link" style={{ background: 'none', border: 0, cursor: 'pointer', font: 'inherit', padding: 0 }} onClick={() => openAccess('signup')}>
              Account creation status
            </button>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
