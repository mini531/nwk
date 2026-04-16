import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { TourMap, type PoiProperties } from '../components/tour-map'
import { useAppStore } from '../stores/app-store'
import { tourNearby, type TourSearchItem, type TourNearbyItem } from '../utils/api'

const KOREA_CENTER: [number, number] = [127.0, 36.5]
const EMPTY_FC: GeoJSON.FeatureCollection<GeoJSON.Point, PoiProperties> = {
  type: 'FeatureCollection',
  features: [],
}

export const MapPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setSelectedPlace = useAppStore((s) => s.setSelectedPlace)

  const [places, setPlaces] = useState<TourSearchItem[]>([])
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc([pos.coords.longitude, pos.coords.latitude]),
      () => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 },
    )
  }, [])

  useEffect(() => {
    setLoading(true)
    const lat = userLoc?.[1] ?? 37.5663
    const lng = userLoc?.[0] ?? 126.9779
    tourNearby({ lat, lng, radius: 50000 })
      .then((result) => setPlaces(result.data.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userLoc])

  const geojson = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point, PoiProperties>>(() => {
    if (!places.length) return EMPTY_FC
    return {
      type: 'FeatureCollection',
      features: places.map((p) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
        properties: {
          id: p.id,
          title: p.title,
          addr: p.addr,
          thumbnail: p.thumbnail ?? null,
          thumbnailSmall: null,
          contentTypeId: (p as unknown as TourNearbyItem).contentTypeId ?? '',
          typeTag: 'attraction' as const,
          region: '',
        },
      })),
    }
  }, [places])

  const handleBoundsChange = useCallback(
    (bounds: [number, number, number, number]) => {
      const [w, s, e, n] = bounds
      const ids = new Set<string>()
      places.forEach((p) => {
        if (p.lng >= w && p.lng <= e && p.lat >= s && p.lat <= n) ids.add(p.id)
      })
      setVisibleIds(ids)
    },
    [places],
  )

  const handlePoiClick = useCallback(
    (props: PoiProperties) => {
      const place = places.find((p) => p.id === props.id)
      if (place) {
        setSelectedPlace(place)
        navigate('/place')
      }
    },
    [places, setSelectedPlace, navigate],
  )

  const visiblePlaces = useMemo(
    () => places.filter((p) => visibleIds.has(p.id)).slice(0, 60),
    [places, visibleIds],
  )

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-4">
      {/* 지도 + 검색바 */}
      <div className="relative">
        <TourMap
          geojson={geojson}
          center={userLoc ?? KOREA_CENTER}
          zoom={userLoc ? 12 : 7}
          className="h-[420px] w-full overflow-hidden rounded-3xl border border-line shadow-card sm:h-[520px] lg:h-[620px]"
          onPoiClick={handlePoiClick}
          onBoundsChange={handleBoundsChange}
          fitToFeatures={!userLoc && places.length > 0}
          showLayerToggle
        />

        {/* 검색 오버레이 */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 p-3">
          <div className="pointer-events-auto mx-auto max-w-md">
            <button
              type="button"
              onClick={() => navigate('/search')}
              className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white/95 px-4 py-3 text-left shadow-lg backdrop-blur-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ink-3">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="text-[14px] text-ink-3">{t('page.search.placeholder')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 관광지 목록 */}
      <div>
        <div className="flex items-center justify-between px-1 pb-2">
          <h2 className="text-[15px] font-bold tracking-tight text-ink">
            {loading ? '불러오는 중...' : `현재 화면의 관광지 ${visiblePlaces.length}개`}
          </h2>
          <button type="button" onClick={() => navigate('/search')} className="text-[13px] font-semibold text-brand">
            전체 검색 →
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visiblePlaces.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { setSelectedPlace(p); navigate('/place') }}
              className="nwk-card flex items-center gap-3 p-3 text-left transition-transform active:scale-[0.99]"
            >
              {p.thumbnail ? (
                <img src={p.thumbnail} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" loading="lazy" />
              ) : (
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold tracking-tight text-ink">{p.title}</p>
                <p className="mt-0.5 truncate text-[12px] text-ink-3">{p.addr}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-ink-3">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>

        {!loading && visiblePlaces.length === 0 && (
          <p className="py-12 text-center text-[14px] text-ink-3">
            지도를 이동하면 해당 영역의 관광지가 여기에 표시됩니다.
          </p>
        )}
      </div>
    </div>
  )
}
