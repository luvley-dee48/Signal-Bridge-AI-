import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { GeoJSONSource, StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { KIND_META, type FocusTarget, type HazardEvent, type HazardKind } from '../lib/types'

interface Props {
  events: HazardEvent[]
  active: HazardKind[]
  focus: FocusTarget | null
  resetNonce: number
  reducedMotion: boolean
  onSelect: (e: HazardEvent) => void
  onStatus: (s: { ready?: boolean; tileError?: boolean }) => void
}

// MapLibre derives its worker path from the library file's own location, which breaks
// once bundled. Emit the worker as a real asset and point MapLibre at it.
maplibregl.setWorkerUrl(workerUrl)

const ATTR =
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>'

const style: StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: ['a', 'b', 'c', 'd'].map(
        (s) => `https://${s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png`,
      ),
      tileSize: 256,
      maxzoom: 18,
      attribution: ATTR,
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#070b17' } },
    { id: 'carto', type: 'raster', source: 'carto', paint: { 'raster-opacity': 0.92 } },
  ],
}

const colorExpr = [
  'match',
  ['get', 'kind'],
  ...(Object.keys(KIND_META) as HazardKind[]).flatMap((k) => [k, KIND_META[k].color]),
  '#42D6A4',
] as unknown as maplibregl.ExpressionSpecification

const toFc = (evs: HazardEvent[]): GeoJSON.FeatureCollection => ({
  type: 'FeatureCollection',
  features: evs.map((e) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [e.lon, e.lat] },
    properties: {
      id: e.id,
      kind: e.kind,
      r: e.magnitude ? Math.min(18, 4 + (e.magnitude - 2.5) * 2.6) : 6,
    },
  })),
})

export default function HazardMap({
  events,
  active,
  focus,
  resetNonce,
  reducedMotion,
  onSelect,
  onStatus,
}: Props) {
  const el = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [ready, setReady] = useState(false)
  const evRef = useRef(events)
  const selectRef = useRef(onSelect)
  const statusRef = useRef(onStatus)

  useEffect(() => {
    evRef.current = events
    selectRef.current = onSelect
    statusRef.current = onStatus
  })

  useEffect(() => {
    const container = el.current
    if (!container) return
    const map = new maplibregl.Map({
      container,
      style,
      center: [12, 22],
      zoom: 1.5,
      minZoom: 1,
      maxZoom: 12,
      cooperativeGestures: true,
      attributionControl: { compact: true },
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')

    map.on('load', () => {
      map.addSource('events', { type: 'geojson', data: toFc(evRef.current) })
      map.addSource('sel', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({
        id: 'events-glow',
        type: 'circle',
        source: 'events',
        paint: {
          'circle-color': colorExpr,
          'circle-radius': ['*', ['get', 'r'], 2.1],
          'circle-opacity': 0.16,
          'circle-blur': 0.8,
        },
      })
      map.addLayer({
        id: 'events-dot',
        type: 'circle',
        source: 'events',
        paint: {
          'circle-color': colorExpr,
          'circle-radius': ['get', 'r'],
          'circle-opacity': 0.85,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.55,
          'circle-stroke-width': 1,
        },
      })
      map.addLayer({
        id: 'sel-ring',
        type: 'circle',
        source: 'sel',
        paint: {
          'circle-radius': 20,
          'circle-color': '#55E7FF',
          'circle-opacity': 0.1,
          'circle-stroke-color': '#55E7FF',
          'circle-stroke-width': 2,
        },
      })
      setReady(true)
      statusRef.current({ ready: true })
    })

    map.on('click', 'events-dot', (e) => {
      const id = e.features?.[0]?.properties?.id as string | undefined
      const ev = evRef.current.find((x) => x.id === id)
      if (ev) selectRef.current(ev)
    })
    map.on('mouseenter', 'events-dot', () => (map.getCanvas().style.cursor = 'pointer'))
    map.on('mouseleave', 'events-dot', () => (map.getCanvas().style.cursor = ''))
    map.on('error', (e) => {
      const src = (e as unknown as { sourceId?: string }).sourceId
      if (src === 'carto') statusRef.current({ tileError: true })
    })
    map.on('data', (e) => {
      if ((e as unknown as { sourceId?: string; tile?: unknown }).sourceId === 'carto' && (e as unknown as { tile?: unknown }).tile)
        statusRef.current({ tileError: false })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    ;(map.getSource('events') as GeoJSONSource | undefined)?.setData(toFc(events))
  }, [events, ready])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const f: maplibregl.FilterSpecification = ['in', ['get', 'kind'], ['literal', active]]
    map.setFilter('events-dot', f)
    map.setFilter('events-glow', f)
  }, [active, ready])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const src = map.getSource('sel') as GeoJSONSource | undefined
    if (!focus) {
      src?.setData({ type: 'FeatureCollection', features: [] })
      return
    }
    src?.setData({
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [focus.lon, focus.lat] } },
      ],
    })
    map.flyTo({
      center: [focus.lon, focus.lat],
      zoom: focus.kind === 'event' ? 5 : 6,
      duration: reducedMotion ? 0 : 1600,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.nonce, ready])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || resetNonce === 0) return
    map.flyTo({ center: [12, 22], zoom: 1.5, duration: reducedMotion ? 0 : 1200 })
  }, [resetNonce, ready, reducedMotion])

  // Inline: maplibre-gl.css sets `.maplibregl-map { position: relative }`, which would collapse an absolutely-positioned container.
  return <div className="map-canvas" ref={el} style={{ position: 'absolute', inset: 0 }} />
}
