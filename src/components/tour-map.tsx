import { useEffect, useRef } from 'react'
import maplibregl, { type LngLatLike, type Map as MLMap, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
  <filter id="ds" x="-20%" y="-10%" width="140%" height="130%">
    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.25"/>
  </filter>
  <path filter="url(#ds)" d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="#d35526"/>
  <g transform="translate(9,9)" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="1" y="6" width="16" height="11" rx="2"/>
    <path d="M6 6V5a1 1 0 011-1h4a1 1 0 011 1v1"/>
    <circle cx="9" cy="11.5" r="3"/>
    <circle cx="9" cy="11.5" r="1" fill="#fff" stroke="none"/>
  </g>
</svg>`

const DEFAULT_TILE_BASE =
  (import.meta.env.VITE_MAP_TILE_URL as string | undefined) ??
  'https://asia-northeast3-nwk-app-ba6f8.cloudfunctions.net/mapTile'

const tileUrl = `${DEFAULT_TILE_BASE}?layer=Base&z={z}&x={x}&y={y}`

const BASE_STYLE = {
  version: 8 as const,
  sources: {
    vworld: {
      type: 'raster' as const,
      tiles: [tileUrl],
      tileSize: 256,
      attribution: '© VWorld · 국토교통부 · TourAPI KTO',
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

export interface TourMapProps {
  geojson: GeoJSON.FeatureCollection<GeoJSON.Point, PoiProperties>
  center?: LngLatLike
  zoom?: number
  className?: string
  selectedId?: string | null
  onPoiClick?: (props: PoiProperties) => void
  onBoundsChange?: (bounds: [number, number, number, number]) => void
  fitToFeatures?: boolean
  onMapReady?: (map: MLMap) => void
}

export interface PoiProperties {
  id: string
  title: string
  addr: string
  thumbnail: string | null
  thumbnailSmall: string | null
  contentTypeId: string
  typeTag: 'attraction' | 'culture'
  region: string
}

const DEFAULT_CENTER: [number, number] = [127.7, 36.3] // Korea bounds centroid
const DEFAULT_ZOOM = 6.6

export const TourMap = ({
  geojson,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  className,
  selectedId,
  onPoiClick,
  onBoundsChange,
  fitToFeatures = false,
  onMapReady,
}: TourMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MLMap | null>(null)
  const onClickRef = useRef(onPoiClick)
  onClickRef.current = onPoiClick
  const onBoundsRef = useRef(onBoundsChange)
  onBoundsRef.current = onBoundsChange
  const onMapReadyRef = useRef(onMapReady)
  onMapReadyRef.current = onMapReady
  const selectedIdRef = useRef(selectedId)
  selectedIdRef.current = selectedId
  const selectedMarkerRef = useRef<Marker | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASE_STYLE,
      center,
      zoom,
      attributionControl: { compact: true },
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'bottom-right',
    )
    mapRef.current = map

    map.on('load', () => {
      if (onMapReadyRef.current) onMapReadyRef.current(map)
      map.addSource('pois', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 48,
      })

      map.addLayer({
        id: 'poi-clusters',
        type: 'circle',
        source: 'pois',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#48aeff', 10, '#2a78ff', 40, '#1a4fd2'],
          'circle-radius': ['step', ['get', 'point_count'], 16, 10, 22, 40, 30],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
          'circle-opacity': 0.9,
        },
      })

      map.addLayer({
        id: 'poi-cluster-count',
        type: 'symbol',
        source: 'pois',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 12,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        },
        paint: {
          'text-color': '#ffffff',
        },
      })

      map.addLayer({
        id: 'poi-points',
        type: 'circle',
        source: 'pois',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match',
            ['get', 'typeTag'],
            'attraction',
            '#2a78ff',
            'culture',
            '#9333ea',
            '#2a78ff',
          ],
          'circle-radius': 7,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      })

      // Cluster click → smooth flyTo with a bit of extra zoom for drama
      map.on('click', 'poi-clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['poi-clusters'] })
        const feature = features[0]
        if (!feature) return
        const clusterId = feature.properties?.cluster_id
        const source = map.getSource('pois') as unknown as {
          getClusterExpansionZoom: (id: number) => Promise<number>
        }
        const expansion = source.getClusterExpansionZoom(clusterId)
        const apply = (nextZoom: number) => {
          const geom = feature.geometry
          if (geom.type !== 'Point') return
          const currentZoom = map.getZoom()
          const targetZoom = Math.max(nextZoom + 0.4, currentZoom + 1.2)
          map.flyTo({
            center: geom.coordinates as [number, number],
            zoom: targetZoom,
            speed: 1.2,
            curve: 1.6,
            essential: true,
          })
        }
        if (expansion && typeof (expansion as unknown as Promise<number>).then === 'function') {
          ;(expansion as unknown as Promise<number>).then(apply).catch(() => {})
        } else {
          // Legacy callback form in older MapLibre versions
          const legacySource = map.getSource('pois') as unknown as {
            getClusterExpansionZoom: (id: number, cb: (err: unknown, z: number) => void) => void
          }
          legacySource.getClusterExpansionZoom(clusterId, (err, z) => {
            if (!err) apply(z)
          })
        }
      })

      map.on('click', 'poi-points', (e) => {
        const feature = e.features?.[0]
        if (!feature) return
        const props = feature.properties as unknown as PoiProperties
        if (onClickRef.current) onClickRef.current(props)
      })

      map.on('mouseenter', 'poi-clusters', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'poi-clusters', () => {
        map.getCanvas().style.cursor = ''
      })
      map.on('mouseenter', 'poi-points', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'poi-points', () => {
        map.getCanvas().style.cursor = ''
      })

      // viewport bounds 변경 이벤트
      const emitBounds = () => {
        if (!onBoundsRef.current) return
        const b = map.getBounds()
        onBoundsRef.current([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()])
      }
      map.on('moveend', emitBounds)
      map.on('zoomend', emitBounds)
      emitBounds()
    })

    return () => {
      if (selectedMarkerRef.current) selectedMarkerRef.current.remove()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const source = map.getSource('pois') as unknown as
      | { setData: (d: GeoJSON.FeatureCollection) => void }
      | undefined
    if (!source) return
    source.setData(geojson)

    if (fitToFeatures && geojson.features.length > 0) {
      let minLng = Infinity,
        minLat = Infinity,
        maxLng = -Infinity,
        maxLat = -Infinity
      for (const f of geojson.features) {
        const [lng, lat] = f.geometry.coordinates
        if (lng < minLng) minLng = lng
        if (lat < minLat) minLat = lat
        if (lng > maxLng) maxLng = lng
        if (lat > maxLat) maxLat = lat
      }
      if (Number.isFinite(minLng)) {
        map.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
          { padding: 60, maxZoom: 14, duration: 600 },
        )
      }
    }
  }, [geojson, fitToFeatures])

  useEffect(() => {
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove()
      selectedMarkerRef.current = null
    }
    const map = mapRef.current
    if (!map || !selectedId) return
    const feat = geojson.features.find((f) => f.properties.id === selectedId)
    if (!feat) return
    const [lng, lat] = feat.geometry.coordinates
    const el = document.createElement('div')
    el.innerHTML = PIN_SVG
    el.style.cursor = 'pointer'
    el.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom', offset: [0, 0] })
      .setLngLat([lng, lat])
      .addTo(map)
    selectedMarkerRef.current = marker
  }, [selectedId, geojson])

  return <div ref={containerRef} className={className} />
}
