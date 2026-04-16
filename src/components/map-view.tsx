import { useEffect, useRef } from 'react'
import maplibregl, { type LngLatLike, type Map as MLMap, type Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

// VITE_MAP_TILE_URL 이 full template 이면 그대로, 없으면 proxy 경유
const tileUrl =
  (import.meta.env.VITE_MAP_TILE_URL as string | undefined) ?? '/tiles?layer=Base&z={z}&x={x}&y={y}'

export interface MapMarker {
  id: string
  lng: number
  lat: number
  title?: string
  active?: boolean
}

interface Props {
  center: LngLatLike
  zoom?: number
  markers?: MapMarker[]
  className?: string
  onMarkerClick?: (id: string) => void
}

const DEFAULT_STYLE = {
  version: 8 as const,
  sources: {
    vworld: {
      type: 'raster' as const,
      tiles: [tileUrl],
      tileSize: 256,
      attribution: '© VWorld · 국토교통부',
    },
  },
  layers: [
    {
      id: 'vworld-base',
      type: 'raster' as const,
      source: 'vworld',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
}

export const MapView = ({ center, zoom = 12, markers = [], className, onMarkerClick }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MLMap | null>(null)
  const markerRefs = useRef<Map<string, Marker>>(new Map())

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const markers = markerRefs.current
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DEFAULT_STYLE,
      center,
      zoom,
      attributionControl: { compact: true },
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      markers.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.easeTo({ center, zoom, duration: 400 })
  }, [center, zoom])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const existing = markerRefs.current
    const nextIds = new Set(markers.map((m) => m.id))

    existing.forEach((marker, id) => {
      if (!nextIds.has(id)) {
        marker.remove()
        existing.delete(id)
      }
    })

    for (const m of markers) {
      if (existing.has(m.id)) {
        existing.get(m.id)?.setLngLat([m.lng, m.lat])
        continue
      }
      const el = document.createElement('button')
      el.type = 'button'
      el.setAttribute('aria-label', m.title ?? 'place')
      el.className = [
        'grid place-items-center rounded-full shadow-pop transition-transform active:scale-95',
        m.active
          ? 'h-10 w-10 bg-brand text-white'
          : 'h-8 w-8 bg-surface text-brand ring-2 ring-brand',
      ].join(' ')
      el.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.4-6-10.5A6 6 0 0 1 18 10.5C18 15.6 12 21 12 21Z"/><circle cx="12" cy="10.5" r="2.2"/></svg>'
      if (onMarkerClick) el.addEventListener('click', () => onMarkerClick(m.id))
      const marker = new maplibregl.Marker({ element: el }).setLngLat([m.lng, m.lat]).addTo(map)
      existing.set(m.id, marker)
    }
  }, [markers, onMarkerClick])

  return <div ref={containerRef} className={className} />
}
