import { useEffect, useRef, useState } from 'react'
import { loadKakaoMaps } from '../utils/kakao-loader'

export type BaseLayer = 'normal' | 'satellite'

export interface PoiProperties {
  id: string
  title: string
  addr: string
  thumbnail: string | null
  thumbnailSmall: string | null
  contentTypeId: string
  typeTag: 'attraction' | 'culture' | string
  region: string
  // When present, render as a numbered course-stop pin instead of a dot.
  // Also bypass clustering so the full itinerary stays visible.
  order?: number
}

export interface SelectedMarker {
  id: string
  lat: number
  lng: number
}

export interface KakaoTourMapProps {
  geojson: GeoJSON.FeatureCollection<GeoJSON.Point, PoiProperties>
  center?: [number, number] // [lng, lat]
  zoom?: number // MapLibre-style zoom (0-20); converted to Kakao level internally
  className?: string
  selectedMarker?: SelectedMarker | null
  baseLayer?: BaseLayer
  onPoiClick?: (props: PoiProperties) => void
  onBoundsChange?: (bounds: [number, number, number, number]) => void
  fitToFeatures?: boolean
  onMapReady?: (map: kakao.maps.Map) => void
}

const DEFAULT_CENTER: [number, number] = [127.7, 36.3]
const DEFAULT_ZOOM = 7

// MapLibre zoom → Kakao level (inverse; 1 is max-zoom). Empirically tuned so
// the Korea-wide default view matches roughly between the two SDKs.
const toKakaoLevel = (zoom: number): number => {
  const level = Math.round(17 - zoom)
  return Math.max(1, Math.min(14, level))
}

const SELECTED_PIN_SVG =
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
  <filter id="ds" x="-20%" y="-10%" width="140%" height="130%">
    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.25"/>
  </filter>
  <path filter="url(#ds)" d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="#d35526"/>
  <g transform="translate(7.5,8)" fill="#fff">
    <path d="M10.5 0.5 L12.95 5.73 L18.6 6.45 L14.4 10.35 L15.47 16 L10.5 13.23 L5.53 16 L6.6 10.35 L2.4 6.45 L8.05 5.73 Z"/>
  </g>
</svg>`)

const DOT_SVG =
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
  <circle cx="9" cy="9" r="6.5" fill="#2a78ff" stroke="#ffffff" stroke-width="2"/>
</svg>`)

const SELECTED_IMG_SRC = `data:image/svg+xml;charset=utf-8,${SELECTED_PIN_SVG}`
const DOT_IMG_SRC = `data:image/svg+xml;charset=utf-8,${DOT_SVG}`

// Numbered course-stop pin (blue-on-white, drop shadow) — generated per `n`.
// Cached so we don't rebuild the SVG string on every marker update.
const numberedPinCache = new Map<number, string>()
const numberedPinSrc = (n: number): string => {
  const cached = numberedPinCache.get(n)
  if (cached) return cached
  const svg =
    encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
  <filter id="ds${n}" x="-20%" y="-10%" width="140%" height="130%">
    <feDropShadow dx="0" dy="2" stdDeviation="2.2" flood-color="#000" flood-opacity="0.3"/>
  </filter>
  <path filter="url(#ds${n})" d="M20 0C9 0 0 9 0 20c0 15 20 32 20 32s20-17 20-32C40 9 31 0 20 0z" fill="#2a78ff"/>
  <circle cx="20" cy="19" r="12" fill="#fff"/>
  <text x="20" y="24" font-family="system-ui,-apple-system,sans-serif" font-size="15" font-weight="800" text-anchor="middle" fill="#2a78ff">${n}</text>
</svg>`)
  const src = `data:image/svg+xml;charset=utf-8,${svg}`
  numberedPinCache.set(n, src)
  return src
}

export const KakaoTourMap = ({
  geojson,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  className,
  selectedMarker,
  baseLayer = 'normal',
  onPoiClick,
  onBoundsChange,
  fitToFeatures = false,
  onMapReady,
}: KakaoTourMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<kakao.maps.Map | null>(null)
  const clustererRef = useRef<kakao.maps.MarkerClusterer | null>(null)
  const markersRef = useRef<Map<string, kakao.maps.Marker>>(new Map())
  const selectedMarkerRef = useRef<kakao.maps.Marker | null>(null)
  // mapLoaded flips true once the async SDK + map instance is ready.
  // The marker-sync effect depends on it so it re-runs after init — the
  // initial run happens before the SDK resolves and would otherwise bail
  // out on the `!map` guard, leaving the first geojson un-rendered.
  const [mapLoaded, setMapLoaded] = useState(false)

  const onClickRef = useRef(onPoiClick)
  onClickRef.current = onPoiClick
  const onBoundsRef = useRef(onBoundsChange)
  onBoundsRef.current = onBoundsChange
  const onMapReadyRef = useRef(onMapReady)
  onMapReadyRef.current = onMapReady

  // Init: load SDK once and create map
  useEffect(() => {
    let cancelled = false
    loadKakaoMaps()
      .then((kakaoNs) => {
        if (cancelled || !containerRef.current || mapRef.current) return
        const k = kakaoNs.maps
        const map = new k.Map(containerRef.current, {
          center: new k.LatLng(center[1], center[0]),
          level: toKakaoLevel(zoom),
          mapTypeId: baseLayer === 'satellite' ? k.MapTypeId.HYBRID : k.MapTypeId.ROADMAP,
        })
        mapRef.current = map

        const clusterer = new k.MarkerClusterer({
          map,
          averageCenter: true,
          minLevel: 6,
          gridSize: 60,
          minClusterSize: 3,
        })
        clustererRef.current = clusterer

        const emitBounds = () => {
          if (!onBoundsRef.current) return
          const b = map.getBounds()
          const sw = b.getSouthWest()
          const ne = b.getNorthEast()
          onBoundsRef.current([sw.getLng(), sw.getLat(), ne.getLng(), ne.getLat()])
        }
        k.event.addListener(map, 'idle', emitBounds)
        emitBounds()

        if (onMapReadyRef.current) onMapReadyRef.current(map)
        setMapLoaded(true)
      })
      .catch((err) => {
        console.error('kakao map init failed', err)
      })
    return () => {
      cancelled = true
      const map = mapRef.current
      if (selectedMarkerRef.current) selectedMarkerRef.current.setMap(null)
      if (clustererRef.current) clustererRef.current.clear()
      for (const m of markersRef.current.values()) m.setMap(null)
      markersRef.current.clear()
      if (map) {
        // Kakao has no map.remove(); detaching listeners + clearing markers is enough.
        // The container element is unmounted by React.
      }
      mapRef.current = null
      clustererRef.current = null
      setMapLoaded(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Swap base layer when prop changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || typeof window === 'undefined') return
    const kakaoNs = window.kakao?.maps
    if (!kakaoNs) return
    map.setMapTypeId(
      baseLayer === 'satellite' ? kakaoNs.MapTypeId.HYBRID : kakaoNs.MapTypeId.ROADMAP,
    )
  }, [baseLayer])

  // Sync POI markers with geojson
  useEffect(() => {
    const map = mapRef.current
    const clusterer = clustererRef.current
    if (!map || !clusterer || typeof window === 'undefined') return
    const kakaoNs = window.kakao?.maps
    if (!kakaoNs) return

    const next = new Map<string, kakao.maps.Marker>()
    const addedToCluster: kakao.maps.Marker[] = []
    const directMarkers: kakao.maps.Marker[] = []
    const dotImage = new kakaoNs.MarkerImage(DOT_IMG_SRC, new kakaoNs.Size(18, 18), {
      offset: new kakaoNs.Point(9, 9),
    })

    for (const feat of geojson.features) {
      const id = feat.properties.id
      const [lng, lat] = feat.geometry.coordinates
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue
      const isStop = typeof feat.properties.order === 'number'
      const existing = markersRef.current.get(id)
      if (existing) {
        existing.setPosition(new kakaoNs.LatLng(lat, lng))
        next.set(id, existing)
        markersRef.current.delete(id)
        continue
      }
      const image = isStop
        ? new kakaoNs.MarkerImage(
            numberedPinSrc(feat.properties.order as number),
            new kakaoNs.Size(40, 52),
            { offset: new kakaoNs.Point(20, 52) },
          )
        : dotImage
      const marker = new kakaoNs.Marker({
        position: new kakaoNs.LatLng(lat, lng),
        image,
        clickable: true,
        zIndex: isStop ? 50 : undefined,
      })
      kakaoNs.event.addListener(marker, 'click', () => {
        if (onClickRef.current) onClickRef.current(feat.properties)
      })
      next.set(id, marker)
      if (isStop) directMarkers.push(marker)
      else addedToCluster.push(marker)
    }

    // Remove stale markers
    for (const stale of markersRef.current.values()) {
      clusterer.removeMarker(stale)
      stale.setMap(null)
    }

    if (addedToCluster.length > 0) clusterer.addMarkers(addedToCluster)
    // Numbered course stops sit outside the clusterer so they always render.
    for (const m of directMarkers) m.setMap(map)
    markersRef.current = next

    if (fitToFeatures && geojson.features.length > 0) {
      const bounds = new kakaoNs.LatLngBounds()
      for (const f of geojson.features) {
        const [lng, lat] = f.geometry.coordinates
        if (Number.isFinite(lng) && Number.isFinite(lat)) {
          bounds.extend(new kakaoNs.LatLng(lat, lng))
        }
      }
      if (!bounds.isEmpty()) {
        map.setBounds(bounds, 60)
      }
    }
  }, [geojson, fitToFeatures, mapLoaded])

  // Selected marker overlay (orange star pin). Uses lat/lng from the
  // selectedMarker prop directly — works even for places not present in
  // the current geojson (e.g. a hotspot deep-linked from the home page).
  useEffect(() => {
    const map = mapRef.current
    if (!map || typeof window === 'undefined') return
    const kakaoNs = window.kakao?.maps
    if (!kakaoNs) return

    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.setMap(null)
      selectedMarkerRef.current = null
    }
    if (!selectedMarker) return
    const { lat, lng } = selectedMarker
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || (lat === 0 && lng === 0)) return

    const pinImage = new kakaoNs.MarkerImage(SELECTED_IMG_SRC, new kakaoNs.Size(36, 48), {
      offset: new kakaoNs.Point(18, 48),
    })
    const marker = new kakaoNs.Marker({
      position: new kakaoNs.LatLng(lat, lng),
      image: pinImage,
      zIndex: 100,
    })
    marker.setMap(map)
    selectedMarkerRef.current = marker
  }, [selectedMarker, mapLoaded])

  return <div ref={containerRef} className={className} />
}
