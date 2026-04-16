import { useCallback, useEffect, useRef, useState } from 'react'
import maplibregl, { type LngLatLike, type Map as MLMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const tileBase =
  (import.meta.env.VITE_MAP_TILE_URL as string | undefined) ?? '/tiles?layer={layer}&z={z}&x={x}&y={y}'

function makeTileUrl(layer: string) {
  if (tileBase.includes('{layer}')) return tileBase.replace('{layer}', layer)
  // direct VWorld URL: replace layer name in path
  return tileBase.replace(/\/Base\//, `/${layer}/`).replace(/\/Satellite\//, `/${layer}/`)
}

type MapLayer = 'Base' | 'Satellite'

function buildStyle(layer: MapLayer) {
  return {
    version: 8 as const,
    sources: {
      vworld: {
        type: 'raster' as const,
        tiles: [makeTileUrl(layer)],
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
}

export interface TourMapProps {
  geojson: GeoJSON.FeatureCollection<GeoJSON.Point, PoiProperties>
  center?: LngLatLike
  zoom?: number
  className?: string
  onPoiClick?: (props: PoiProperties) => void
  onBoundsChange?: (bounds: [number, number, number, number]) => void
  fitToFeatures?: boolean
  showLayerToggle?: boolean
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
  onPoiClick,
  onBoundsChange,
  fitToFeatures = false,
  showLayerToggle = false,
}: TourMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MLMap | null>(null)
  const onClickRef = useRef(onPoiClick)
  onClickRef.current = onPoiClick
  const onBoundsRef = useRef(onBoundsChange)
  onBoundsRef.current = onBoundsChange
  const [activeLayer, setActiveLayer] = useState<MapLayer>('Base')

  const switchLayer = useCallback(
    (layer: MapLayer) => {
      const map = mapRef.current
      if (!map || layer === activeLayer) return
      setActiveLayer(layer)
      const src = map.getSource('vworld') as unknown as { tiles?: string[]; _options?: { tiles: string[] } }
      if (src) {
        const newUrl = makeTileUrl(layer)
        ;(src as unknown as { tiles: string[] }).tiles = [newUrl]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(map.style as any).sourceCaches?.['vworld']?.clearTiles()
        map.triggerRepaint()
      }
    },
    [activeLayer],
  )

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildStyle(activeLayer),
      center,
      zoom,
      attributionControl: { compact: true },
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'top-right',
    )
    mapRef.current = map

    map.on('load', () => {
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

      const emitBounds = () => {
        if (!onBoundsRef.current) return
        const b = map.getBounds()
        onBoundsRef.current([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()])
      }
      map.on('moveend', emitBounds)
      map.on('zoomend', emitBounds)
      // Emit once after load so the sidebar can show the initial viewport
      emitBounds()
    })

    return () => {
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
      let minLng = Infinity
      let minLat = Infinity
      let maxLng = -Infinity
      let maxLat = -Infinity
      for (const f of geojson.features) {
        const [lng, lat] = f.geometry.coordinates
        if (lng < minLng) minLng = lng
        if (lat < minLat) minLat = lat
        if (lng > maxLng) maxLng = lng
        if (lat > maxLat) maxLat = lat
      }
      if (Number.isFinite(minLng) && Number.isFinite(maxLng)) {
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

  return (
    <div className={`relative ${className ?? ''}`}>
      <div ref={containerRef} className="absolute inset-0" />
      {showLayerToggle && (
        <div className="absolute bottom-4 left-4 z-10 flex overflow-hidden rounded-lg border border-white/60 bg-white/90 shadow-lg backdrop-blur-sm">
          <button
            type="button"
            onClick={() => switchLayer('Base')}
            className={`px-3 py-1.5 text-[12px] font-bold transition-colors ${activeLayer === 'Base' ? 'bg-ink text-white' : 'text-ink-2 hover:text-ink'}`}
          >
            일반
          </button>
          <button
            type="button"
            onClick={() => switchLayer('Satellite')}
            className={`px-3 py-1.5 text-[12px] font-bold transition-colors ${activeLayer === 'Satellite' ? 'bg-ink text-white' : 'text-ink-2 hover:text-ink'}`}
          >
            위성
          </button>
        </div>
      )}
    </div>
  )
}
