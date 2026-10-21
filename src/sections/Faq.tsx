import { useState } from 'react'
import { Reveal } from '../components/Reveal'

const qa: [string, string][] = [
  ['What is SignalBridge?', 'A prototype environmental-intelligence platform. Today it provides a public map of live, source-reported natural events, place search, and a rule-based evidence briefing. Monitoring, incidents, organization tools and accounts are planned.'],
  ['Where does the environmental data come from?', 'Currently from the USGS earthquake feed and NASA EONET, fetched directly in your browser. Place search uses Open-Meteo geocoding and the basemap uses CARTO / OpenStreetMap tiles. Weather, satellite, hydrological, sensor and community sources are planned, not connected.'],
  ['Does SignalBridge cover every location worldwide?', 'No. Coverage is whatever the two public feeds report: earthquakes of magnitude 2.5 and above, and events NASA EONET tracks. Many hazards, such as local flooding or heat, are not covered yet. No events near a place does not mean no hazard.'],
  ['How does the AI generate explanations?', 'It doesn’t yet. The briefing is a fixed text template over events near the selected place. The design is ready for a language model that only explains the cited evidence, but none is connected.'],
  ['Are SignalBridge assessments official warnings?', 'No. Nothing here is an official warning. For emergencies, follow your national meteorological, geological or civil-protection authority.'],
  ['How are community reports verified?', 'They aren’t — community reporting isn’t built. When it is, reports will be labelled unverified until reviewed, with duplicate handling and privacy-aware locations.'],
  ['Can I connect an ESP32 sensor?', 'That is the intended design (ESP32 + ultrasonic water-level sensor → Wi-Fi → backend → dashboard), but there is no ingestion backend yet, so nothing can be connected today.'],
  ['What happens when a sensor goes offline?', 'The design keeps the last reading visible, marks its age and shows an offline state, and never presents old data as live. This will apply once sensors are connected.'],
  ['Is the platform free to use?', 'The public explorer is free and needs no account. Paid plans are only proposed; no prices are decided and no payments are taken.'],
  ['What is included in organization plans?', 'Nothing is available yet. Planned: multi-site monitoring, eligible API access, role-based access and custom reporting, to be shaped with pilot partners.'],
  ['How does SignalBridge handle uncertainty?', 'By stating it: each briefing lists coverage gaps and revision risk, and labels data as source-reported observations. It never converts missing data into reassurance.'],
  ['Can my organization participate in a pilot?', 'Yes — we’d like that. Use “Discuss a Pilot” to open an issue on the project’s GitHub repository.'],
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="section" id="faq">
      <div className="container">
        <Reveal className="section-head center">
          <span className="eyebrow">FAQ</span>
          <h2 className="h2">Frequently asked questions</h2>
          <p className="lead">Answers describe the product as it is today.</p>
        </Reveal>
        <div className="faq">
          {qa.map(([q, a], i) => (
            <Reveal key={q} delay={Math.min(i, 5) * 0.04} className={`faq-item ${open === i ? 'open' : ''}`}>
              <h3 style={{ margin: 0 }}>
                <button
                  className="faq-q"
                  aria-expanded={open === i}
                  aria-controls={`faq-a-${i}`}
                  id={`faq-q-${i}`}
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  {q}
                  <span className="pm" aria-hidden="true" />
                </button>
              </h3>
              <div className="faq-a" id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`}>
                <div>
                  <p>{a}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
