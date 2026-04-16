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
  const [loading, setLoading] = useState(false)
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)

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

  return (
    <>
      {/* 배경 지도 — 전체 화면 (음수 마진으로 AppLayout padding 상쇄) */}
      <div className="-mx-5 -mt-6 sm:-mx-6 lg:-mx-8">
        <TourMap
          geojson={geojson}
          center={userLoc ?? KOREA_CENTER}
          zoom={userLoc ? 12 : 7}
          className="h-[calc(100dvh-120px)] w-full sm:h-[calc(100dvh-104px)] lg:h-[calc(100dvh-74px)]"
          onPoiClick={handlePoiClick}
        />
      </div>

      {/* 검색바 오버레이 */}
      <div className="pointer-events-none fixed left-0 right-0 z-20" style={{ top: 68 }}>
        <div className="pointer-events-auto mx-auto max-w-md px-4">
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="flex w-full items-center gap-3 rounded-2xl border border-white/60 bg-white/90 px-4 py-3 text-left shadow-lg backdrop-blur-md"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-neutral-400">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="text-[14px] text-neutral-400">{t('page.search.placeholder')}</span>
          </button>
        </div>
      </div>

      {/* 좌측 관광지 패널 (유리 느낌) */}
      <div
        className={`pointer-events-auto fixed z-20 transition-transform duration-300 ease-out ${
          panelOpen ? 'translate-x-0' : '-translate-x-[110%]'
        }`}
        style={{ top: 124, left: 12, bottom: 76, width: 340, maxWidth: 'calc(100vw - 60px)' }}
      >
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/50 bg-white/85 shadow-2xl backdrop-blur-lg">
          {/* 헤더 */}
          <div className="flex shrink-0 items-center justify-between border-b border-neutral-200/60 px-4 py-3">
            <h2 className="text-[14px] font-bold text-neutral-800">
              {loading ? '불러오는 중...' : `관광지 ${places.length}개`}
            </h2>
            <button type="button" onClick={() => setPanelOpen(false)} className="grid h-7 w-7 place-items-center rounded-lg text-neutral-400 hover:bg-neutral-200/50">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* 목록 */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {places.slice(0, 40).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setSelectedPlace(p); navigate('/place') }}
                className="flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors hover:bg-white/80"
              >
                {p.thumbnail ? (
                  <img src={p.thumbnail} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" loading="lazy" />
                ) : (
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-neutral-800">{p.title}</p>
                  <p className="mt-0.5 truncate text-[11px] text-neutral-500">{p.addr}</p>
                </div>
              </button>
            ))}
            {!loading && places.length === 0 && (
              <p className="px-4 py-12 text-center text-[13px] text-neutral-400">
                주변 관광지를 불러오는 중입니다...
              </p>
            )}
          </div>

          {/* 풋터 */}
          <div className="shrink-0 border-t border-neutral-200/60 px-4 py-2">
            <button type="button" onClick={() => navigate('/search')} className="w-full rounded-xl bg-neutral-800 py-2.5 text-center text-[13px] font-bold text-white transition-colors hover:bg-neutral-700">
              전체 검색 →
            </button>
          </div>
        </div>
      </div>

      {/* 패널 열기 FAB */}
      {!panelOpen && (
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="fixed z-20 flex items-center gap-2 rounded-r-2xl border border-l-0 border-white/60 bg-white/90 px-3.5 py-2.5 shadow-lg backdrop-blur-md transition-transform active:scale-95"
          style={{ top: 124, left: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-600">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
            <circle cx="3.5" cy="6" r="1.5" fill="currentColor" /><circle cx="3.5" cy="12" r="1.5" fill="currentColor" /><circle cx="3.5" cy="18" r="1.5" fill="currentColor" />
          </svg>
          <span className="text-[12px] font-bold text-neutral-600">목록</span>
        </button>
      )}
    </>
  )
}
