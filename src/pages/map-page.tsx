import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { TourMap, type PoiProperties } from '../components/tour-map'
import { useAppStore } from '../stores/app-store'
import { tourNearby, type TourSearchItem, type TourNearbyItem } from '../utils/api'

const SEOUL: [number, number] = [126.978, 37.566]
const EMPTY_FC: GeoJSON.FeatureCollection<GeoJSON.Point, PoiProperties> = {
  type: 'FeatureCollection',
  features: [],
}
const PAGE_SIZE = 40

export const MapPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setSelectedPlace = useAppStore((s) => s.setSelectedPlace)

  const [places, setPlaces] = useState<TourSearchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)
  const [detailPlace, setDetailPlace] = useState<TourSearchItem | null>(null)
  const pageRef = useRef(1)
  const hasMoreRef = useRef(true)

  // 지도 페이지 활성 동안 부모 main 스크롤 차단
  useLayoutEffect(() => {
    const main = document.getElementById('main')
    if (!main) return
    const prev = main.style.overflow
    const prevPb = main.style.paddingBottom
    main.style.overflow = 'hidden'
    main.style.paddingBottom = '0'
    return () => {
      main.style.overflow = prev
      main.style.paddingBottom = prevPb
    }
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc([pos.coords.longitude, pos.coords.latitude]),
      () => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 },
    )
  }, [])

  const loadPlaces = useCallback(
    (page: number, append: boolean) => {
      const setter = append ? setLoadingMore : setLoading
      setter(true)
      const lat = userLoc?.[1] ?? SEOUL[1]
      const lng = userLoc?.[0] ?? SEOUL[0]
      tourNearby({ lat, lng, radius: 50000, pageNo: page, numOfRows: PAGE_SIZE })
        .then((result) => {
          const items = result.data.items ?? []
          setPlaces((prev) => (append ? [...prev, ...items] : items))
          hasMoreRef.current = items.length >= PAGE_SIZE
        })
        .catch(() => {})
        .finally(() => setter(false))
    },
    [userLoc],
  )

  useEffect(() => {
    pageRef.current = 1
    hasMoreRef.current = true
    loadPlaces(1, false)
  }, [loadPlaces])

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMoreRef.current) return
    pageRef.current += 1
    loadPlaces(pageRef.current, true)
  }, [loadPlaces, loadingMore])

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
      if (place) setDetailPlace(place)
    },
    [places],
  )

  const openDetail = useCallback((p: TourSearchItem) => setDetailPlace(p), [])
  const closeDetail = useCallback(() => setDetailPlace(null), [])
  const goToDetail = useCallback(() => {
    if (!detailPlace) return
    setSelectedPlace(detailPlace)
    navigate('/place')
  }, [detailPlace, setSelectedPlace, navigate])

  const center = userLoc ?? SEOUL

  return (
    <>
      {/* 전체 화면 배경 지도 — 뷰포트 전폭 (max-w 돌파) */}
      <div className="-mt-6" style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}>
        <TourMap
          geojson={geojson}
          center={center}
          zoom={userLoc ? 13 : 11}
          className="h-[calc(100dvh-120px)] w-full sm:h-[calc(100dvh-104px)] lg:h-[calc(100dvh-74px)]"
          onPoiClick={handlePoiClick}
          fitToFeatures={places.length > 0 && !userLoc}
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

      {/* 좌측 유리 패널 — 헤더 클릭으로 위로 접기 (남원 glass-card 스타일) */}
      <div
        className="pointer-events-auto fixed z-20 w-[340px] max-w-[calc(100vw-60px)]"
        style={{ top: 80, left: 12 }}
      >
        <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/88 shadow-2xl backdrop-blur-lg">
          {/* 헤더 (클릭으로 접기/펼치기) */}
          <button
            type="button"
            onClick={() => setPanelOpen(!panelOpen)}
            className="flex w-full shrink-0 cursor-pointer items-center gap-3 border-b border-neutral-200/60 px-4 py-3 text-left transition-colors hover:bg-white/60"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-neutral-500">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <h2 className="flex-1 text-[14px] font-bold text-neutral-800">
              {loading ? '불러오는 중...' : `관광지 ${places.length}개`}
            </h2>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
              className={`shrink-0 text-neutral-400 transition-transform duration-250 ${panelOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {/* 본문 — grid rows transition 으로 자연스럽게 접기 */}
          <div
            className="grid transition-[grid-template-rows] duration-300 ease-out"
            style={{ gridTemplateRows: panelOpen ? '1fr' : '0fr' }}
          >
            <div className="overflow-hidden">
              <div className="max-h-[calc(100dvh-240px)] overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.12)_transparent] [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/12">
              {places.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => openDetail(p)}
                  className="flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors hover:bg-white/80"
                >
                  {p.thumbnail ? (
                    <img src={p.thumbnail} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" loading="lazy" />
                  ) : (
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-neutral-100 text-neutral-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

              {hasMoreRef.current && places.length > 0 && (
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full py-3 text-center text-[13px] font-bold text-brand disabled:text-neutral-400"
                >
                  {loadingMore ? '불러오는 중...' : '더 보기'}
                </button>
              )}

              {!loading && places.length === 0 && (
                <p className="px-4 py-10 text-center text-[13px] text-neutral-400">
                  주변 관광지를 불러오는 중입니다...
                </p>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 관광지 상세 모달 */}
      {detailPlace && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4" onClick={closeDetail}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 이미지 */}
            {detailPlace.thumbnail ? (
              <img src={detailPlace.thumbnail} alt="" className="h-48 w-full object-cover sm:h-56" />
            ) : (
              <div className="grid h-48 w-full place-items-center bg-neutral-100 text-neutral-300 sm:h-56">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
              </div>
            )}

            {/* 내용 */}
            <div className="p-5">
              <h3 className="text-[18px] font-bold tracking-tight text-neutral-900">{detailPlace.title}</h3>
              <p className="mt-1 text-[13px] text-neutral-500">{detailPlace.addr}</p>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={goToDetail}
                  className="flex-1 rounded-xl bg-neutral-900 py-3 text-center text-[14px] font-bold text-white transition-colors hover:bg-neutral-800"
                >
                  상세 정보 보기
                </button>
                <button
                  type="button"
                  onClick={closeDetail}
                  className="rounded-xl border border-neutral-200 bg-white px-5 py-3 text-[14px] font-bold text-neutral-600 transition-colors hover:bg-neutral-50"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
