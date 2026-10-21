import { IconClock, IconDatabase, IconEye, IconLayers, IconShield } from '../components/icons'
import type { HazardsState } from '../lib/hazards'

export function Trust({ hz }: { hz: HazardsState }) {
  const ok = hz.feeds.filter((f) => f.state === 'ok').length
  const items = [
    { i: <IconLayers />, t: 'Multi-source environmental evidence' },
    { i: <IconClock />, t: 'Timestamp and source on every record' },
    { i: <IconEye />, t: 'Uncertainty stated plainly' },
    { i: <IconDatabase />, t: 'Observed, estimated and reported data kept separate' },
    { i: <IconShield />, t: 'Not an official warning service' },
    {
      i: <IconDatabase />,
      t: hz.loading
        ? 'Connecting to live feeds…'
        : `${ok} of ${hz.feeds.length} live public feeds reachable · ${hz.events.length} events loaded now`,
    },
    { i: <IconEye />, t: 'Coverage is limited — see Data & Methodology' },
  ]
  return (
    <div className="trust" role="region" aria-label="Trust and data transparency">
      <div className="marquee" style={{ ['--dur' as string]: '60s' }}>
        <div className="marquee-track">
          {[0, 1].map((n) =>
            items.map((it, idx) => (
              <div className="trust-item" key={`${n}-${idx}`} aria-hidden={n === 1 ? true : undefined}>
                {it.i}
                <span>{it.t}</span>
              </div>
            )),
          )}
        </div>
      </div>
    </div>
  )
}
