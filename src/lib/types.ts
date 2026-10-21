export type HazardKind =
  | 'earthquake'
  | 'wildfire'
  | 'volcano'
  | 'storm'
  | 'flood'
  | 'other'

export interface HazardEvent {
  id: string
  kind: HazardKind
  title: string
  lon: number
  lat: number
  /** ISO timestamp of the observation / latest geometry reported by the source */
  time: string
  source: 'USGS' | 'NASA EONET'
  sourceUrl: string
  /** Earthquake magnitude, when the source supplies one */
  magnitude?: number
  /** Provider-supplied status text (e.g. "reviewed", "open") */
  status?: string
}

export interface FeedStatus {
  id: 'usgs' | 'eonet'
  name: string
  homepage: string
  state: 'loading' | 'ok' | 'error'
  count: number
  fetchedAt?: string
  error?: string
}

export interface FocusTarget {
  lon: number
  lat: number
  label: string
  kind: 'place' | 'event'
  eventId?: string
  /** bump to re-trigger flyTo for the same target */
  nonce: number
}

export const KIND_META: Record<HazardKind, { label: string; color: string }> = {
  earthquake: { label: 'Earthquakes', color: '#55E7FF' },
  wildfire: { label: 'Wildfires', color: '#F4B84A' },
  volcano: { label: 'Volcanoes', color: '#FF5B68' },
  storm: { label: 'Severe storms', color: '#8C6CFF' },
  flood: { label: 'Floods', color: '#18C8E8' },
  other: { label: 'Other events', color: '#42D6A4' },
}
