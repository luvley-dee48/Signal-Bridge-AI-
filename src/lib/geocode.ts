export interface Place {
  id: number
  name: string
  admin1?: string
  country?: string
  lat: number
  lon: number
}

interface OpenMeteoResult {
  id: number
  name: string
  admin1?: string
  country?: string
  latitude: number
  longitude: number
}

/** Open-Meteo geocoding (no API key). Geocoding != environmental data availability. */
export async function searchPlaces(
  query: string,
  signal: AbortSignal,
): Promise<Place[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    q,
  )}&count=6&language=en&format=json`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Geocoder responded ${res.status}`)
  const json = (await res.json()) as { results?: OpenMeteoResult[] }
  return (json.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    admin1: r.admin1,
    country: r.country,
    lat: r.latitude,
    lon: r.longitude,
  }))
}

export function placeLabel(p: Place): string {
  return [p.name, p.admin1, p.country].filter(Boolean).join(', ')
}
