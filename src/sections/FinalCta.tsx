import { Reveal } from '../components/Reveal'
import { CONTACT_URL } from '../lib/config'

export function FinalCta() {
  return (
    <section className="final" id="final">
      <div className="container">
        <Reveal>
          <h2>
            Make sense of the <span className="grad-text">signals</span> shaping your world.
          </h2>
          <p>
            Explore the available evidence, investigate a location, and discover what environmental
            intelligence can help you understand.
          </p>
          <div className="hero-ctas">
            <a className="btn btn-primary" href="#explorer">Explore Global Intelligence</a>
            <a className="btn" href={CONTACT_URL} target="_blank" rel="noreferrer">Discuss a Pilot</a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
