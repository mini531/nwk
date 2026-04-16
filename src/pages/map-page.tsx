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

  // 현 위치 가져오기
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc([pos.coords.longitude, pos.coords.latitude]),
      () => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 },
    )
  }, [])

  // 주변 관광지 로딩
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
    () => places.filter((p) => visibleIds.has(p.id)).slice(0, 40),
    [places, visibleIds],
  )

  return (
    <div className="flex h-[calc(100dvh-56px)] flex-col sm:h-[calc(100dvh-64px)]">
      {/* 지도 영역 */}
      <div className="relative flex-1">
        <TourMap
          geojson={geojson}
          center={userLoc ?? KOREA_CENTER}
          zoom={userLoc ? 12 : 7}
          className="h-full w-full"
          onPoiClick={handlePoiClick}
          onBoundsChange={handleBoundsChange}
          fitToFeatures={!userLoc}
          showLayerToggle
        />

        {/* 상단 검색 바 오버레이 */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 p-3 sm:p-4">
          <div className="pointer-events-auto mx-auto max-w-lg">
            <button
              type="button"
              onClick={() => navigate('/search')}
              className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white/95 px-4 py-3 text-left shadow-lg backdrop-blur-sm transition-shadow hover:shadow-xl"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-ink-3"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="text-[14px] text-ink-3">{t('page.search.placeholder')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 하단 POI 리스트 패널 */}
      <div className="shrink-0 border-t border-line bg-surface">
        <div className="mx-auto max-w-5xl px-3 py-2 sm:px-4">
          <div className="flex items-center justify-between gap-2 py-1">
            <h2 className="text-[13px] font-bold text-ink-2">
              {loading
                ? t('page.search.loading', '불러오는 중...')
                : `${t('page.map.title', '현재 화면')} ${visiblePlaces.length}${t('page.map.unit', '개')}`}
            </h2>
            <button
              type="button"
              onClick={() => navigate('/search')}
              className="text-[12px] font-semibold text-brand"
            >
              {t('page.search.viewAll', '전체 검색')} →
            </button>
          </div>
        </div>

        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-3 sm:px-4">
          {visiblePlaces.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setSelectedPlace(p)
                navigate('/place')
              }}
              className="flex w-[240px] shrink-0 snap-start items-center gap-3 rounded-2xl border border-line bg-white p-3 text-left shadow-sm transition-shadow hover:shadow-md active:scale-[0.98] sm:w-[280px]"
            >
              {p.thumbnail ? (
                <img
                  src={p.thumbnail}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-xl object-cover sm:h-16 sm:w-16"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink-3 sm:h-16 sm:w-16">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold tracking-tight text-ink">
                  {p.title}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-ink-3">{p.addr}</p>
              </div>
            </button>
          ))}
          {!loading && visiblePlaces.length === 0 && (
            <p className="w-full py-4 text-center text-[13px] text-ink-3">
              {t('page.map.noPoi', '지도를 이동하면 관광지가 표시됩니다')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
