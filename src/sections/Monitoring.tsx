import { Reveal } from '../components/Reveal'

const states: [string, string][] = [
  ['Normal', 'live'],
  ['Caution', 'warn'],
  ['High', 'err'],
  ['Offline', 'planned'],
  ['Sensor fault', 'planned'],
]

export function Monitoring({ onInterest }: { onInterest: string }) {
  return (
    <section className="section" id="monitoring">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">Live monitoring · IoT</span>
          <h2 className="h2">From a physical sensor to a live intelligence dashboard.</h2>
          <p className="lead">
            The SignalBridge Smart Flood Monitor is designed around a low-cost ESP32 with an
            ultrasonic sensor. It is <b>not connected to this site yet</b>, so no readings are shown.
          </p>
        </Reveal>
        <div className="iot">
          <Reveal className="glass">
            <h3 style={{ fontSize: 20, marginBottom: 14 }}>Intended data path</h3>
            <div className="flow" aria-label="ESP32 and ultrasonic sensor, then Wi-Fi, backend validation, stored observation, live dashboard">
              <span>ESP32 + ultrasonic</span>
              <i>→</i>
              <span>Wi-Fi</span>
              <i>→</i>
              <span>Backend validation</span>
              <i>→</i>
              <span>Stored observation</span>
              <i>→</i>
              <span>Live dashboard</span>
            </div>
            <p style={{ color: 'var(--muted)' }}>
              A water-container demonstration shows that the pipeline works. It is not the same as
              validated real-world flood monitoring, which needs calibration, siting, power and
              communications that are resilient in a real flood.
            </p>
            <p style={{ color: 'var(--muted)', marginTop: 12 }}>
              Rules once connected: simulated data will carry a permanent <b>SIMULATED DATA</b>{' '}
              label; stale readings stay visible with their age; nothing is ever shown as live
              without a real device report.
            </p>
            <a className="btn btn-sm" style={{ marginTop: 20 }} href={onInterest} target="_blank" rel="noreferrer">
              Ask about the sensor pilot
            </a>
          </Reveal>
          <Reveal className="glass" delay={0.1}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h3 style={{ fontSize: 20 }}>Station dashboard</h3>
              <span className="badge planned">Waiting for hardware data</span>
            </div>
            <div className="gauge-row">
              <div className="stat">
                <div className="v num">—</div>
                <div className="l">Water depth (cm)</div>
              </div>
              <div className="stat">
                <div className="v num">—</div>
                <div className="l">Sensor-to-water distance (cm)</div>
              </div>
              <div className="stat">
                <div className="v num">—</div>
                <div className="l">Last received</div>
              </div>
              <div className="stat">
                <div className="v">No device</div>
                <div className="l">Connection state</div>
              </div>
            </div>
            <div className="chart-empty">No readings yet — chart appears when a device reports</div>
            <div className="state-legend" aria-label="Planned station states">
              {states.map(([s, c]) => (
                <span key={s} className={`badge ${c}`}>{s}</span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
