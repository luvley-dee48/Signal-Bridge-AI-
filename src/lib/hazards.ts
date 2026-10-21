import { useCallback, useEffect, useState } from 'react'
import type { FeedStatus, HazardEvent, HazardKind } from './types'

const USGS_URL =
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson'
const EONET_URL =
  'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=200'

interface UsgsFeature {
  id: string
  properties: {
    mag: number | null
    place: string | null
    time: number
    url: string
    status?: string
    title?: string
  }
  geometry: { coordinates: [number, number, number?] }
}

interface EonetEvent {
  id: string
  title: string
  link: string
  categories: { id: string; title: string }[]
  geometry: {
    date: string
    type: string
    coordinates: number[] | number[][] | number[][][]
  }[]
}

function eonetKind(categoryId: string): HazardKind {
  switch (categoryId) {
    case 'wildfires':
      return 'wildfire'
    case 'volcanoes':
      return 'volcano'
    case 'severeStorms':
      return 'storm'
    case 'floods':
      return 'flood'
    default:
      return 'other'
  }
}

/** Reduce any GeoJSON geometry coordinates to a single [lon, lat] (first point). */
function firstPoint(c: unknown): [number, number] | null {
  if (Array.isArray(c) && typeof c[0] === 'number' && typeof c[1] === 'number') {
    return [c[0], c[1]]
  }
  if (Array.isArray(c) && c.length > 0) return firstPoint(c[0])
  return null
}

async function loadUsgs(signal: AbortSignal): Promise<HazardEvent[]> {
  const res = await fetch(USGS_URL, { signal })
  if (!res.ok) throw new Error(`USGS responded ${res.status}`)
  const json = (await res.json()) as { features: UsgsFeature[] }
  return json.features.flatMap((f) => {
    const [lon, lat] = f.geometry.coordinates
    if (typeof lon !== 'number' || typeof lat !== 'number') return []
    return [
      {
        id: `usgs:${f.id}`,
        kind: 'earthquake' as const,
        title: f.properties.title ?? f.properties.place ?? 'Earthquake',
        lon,
        lat,
        time: new Date(f.properties.time).toISOString(),
        source: 'USGS' as const,
        sourceUrl: f.properties.url,
        magnitude: f.properties.mag ?? undefined,
        status: f.properties.status,
      },
    ]
  })
}

async function loadEonet(signal: AbortSignal): Promise<HazardEvent[]> {
  const res = await fetch(EONET_URL, { signal })
  if (!res.ok) throw new Error(`NASA EONET responded ${res.status}`)
  const json = (await res.json()) as { events: EonetEvent[] }
  return json.events.flatMap((e) => {
    // latest geometry = most recent observation reported for the event
    const g = e.geometry[e.geometry.length - 1]
    const pt = g ? firstPoint(g.coordinates) : null
    if (!g || !pt) return []
    return [
      {
        id: `eonet:${e.id}`,
        kind: eonetKind(e.categories[0]?.id ?? ''),
        title: e.title,
        lon: pt[0],
        lat: pt[1],
        time: new Date(g.date).toISOString(),
        source: 'NASA EONET' as const,
        sourceUrl: e.link,
        status: 'open',
      },
    ]
  })
}

const initialFeeds: FeedStatus[] = [
  {
    id: 'usgs',
    name: 'USGS Earthquake Hazards (M2.5+, past 24 h)',
    homepage: 'https://earthquake.usgs.gov/earthquakes/feed/',
    state: 'loading',
    count: 0,
  },
  {
    id: 'eonet',
    name: 'NASA EONET open natural events',
    homepage: 'https://eonet.gsfc.nasa.gov/',
    state: 'loading',
    count: 0,
  },
]

export interface HazardsState {
  events: HazardEvent[]
  feeds: FeedStatus[]
  loading: boolean
  refresh: () => void
}

/** Loads real public hazard feeds directly in the browser. No keys, no fabricated data. */
export function useHazards(): HazardsState {
  const [events, setEvents] = useState<HazardEvent[]>([])
  const [feeds, setFeeds] = useState<FeedStatus[]>(initialFeeds)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    const run = async () => {
      setFeeds((f) =>
        f.map((x) => ({ ...x, state: 'loading' as const, error: undefined })),
      )
      const [usgs, eonet] = await Promise.allSettled([
        loadUsgs(ctrl.signal),
        loadEonet(ctrl.signal),
      ])
      if (ctrl.signal.aborted) return
      const now = new Date().toISOString()
      const merged: HazardEvent[] = []
      const nextFeeds: FeedStatus[] = initialFeeds.map((base, i) => {
        const r = i === 0 ? usgs : eonet
        if (r.status === 'fulfilled') {
          merged.push(...r.value)
          return {
            ...base,
            state: 'ok',
            count: r.value.length,
            fetchedAt: now,
          }
        }
        return {
          ...base,
          state: 'error',
          error:
            r.reason instanceof Error ? r.reason.message : 'Request failed',
        }
      })
      setEvents(merged)
      setFeeds(nextFeeds)
    }
    void run()
    return () => ctrl.abort()
  }, [tick])

  const refresh = useCallback(() => setTick((t) => t + 1), [])
  const loading = feeds.some((f) => f.state === 'loading')
  return { events, feeds, loading, refresh }
}

export function haversineKm(
  a: { lon: number; lat: number },
  b: { lon: number; lat: number },
): number {
  const R = 6371
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLon = (b.lon - a.lon) * rad
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 48) return `${h} h ago`
  return `${Math.round(h / 24)} days ago`
}

export function nearbyEvents(
  events: HazardEvent[],
  pt: { lon: number; lat: number },
  km: number,
): { e: HazardEvent; d: number }[] {
  return events
    .map((e) => ({ e, d: haversineKm(pt, e) }))
    .filter((x) => x.d <= km)
    .sort((a, b) => a.d - b.d)
}
