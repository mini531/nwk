import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KakaoTourMap, type BaseLayer, type PoiProperties } from '../components/kakao-tour-map'
import { useAppStore } from '../stores/app-store'
import { tourNearby, tourSearch, type TourSearchItem, type TourNearbyItem } from '../utils/api'
import { matchAdvisories, groupByCategory } from '../utils/match-advisories'
import { PinIcon, HeartIcon } from '../components/icons'
import { useFavorites } from '../hooks/use-favorites'

const SEOUL: [number, number] = [126.978, 37.566]
const EMPTY_FC: GeoJSON.FeatureCollection<GeoJSON.Point, PoiProperties> = {
  type: 'FeatureCollection',
  features: [],
}
const PAGE_SIZE = 40

export const MapPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { isFavorite, toggle: toggleFavorite } = useFavorites()
  const selectedPlace = useAppStore((s) => s.selectedPlace)
  const setSelectedPlace = useAppStore((s) => s.setSelectedPlace)

  const [places, setPlaces] = useState<TourSearchItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)
  const [detailPlace, setDetailPlace] = useState<TourSearchItem | null>(null)
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map')
  const [baseLayerOpen, setBaseLayerOpen] = useState(false)
  const [activeLayer, setActiveLayer] = useState<BaseLayer>('normal')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TourSearchItem[] | null>(null)
  const [searching, setSearching] = useState(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mapInstanceRef = useRef<kakao.maps.Map | null>(null)
  const pendingFlyRef = useRef<TourSearchItem | null>(null)

  const flyToPlace = useCallback((place: Pick<TourSearchItem, 'lat' | 'lng'>) => {
    const map = mapInstanceRef.current
    if (!map || !place.lat || !place.lng) return false
    const k = window.kakao?.maps
    if (!k) return false
    map.panTo(new k.LatLng(place.lat, place.lng))
    map.setLevel(4, { animate: true })
    return true
  }, [])

  const handleMapReady = useCallback(
    (map: kakao.maps.Map) => {
      mapInstanceRef.current = map
      const p = pendingFlyRef.current
      if (p) {
        flyToPlace(p)
        pendingFlyRef.current = null
      }
    },
    [flyToPlace],
  )

  const handleSearch = useCallback(
    (q: string) => {
      setSearchQuery(q)
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
      if (!q.trim()) {
        setSearchResults(null)
        return
      }
      searchTimerRef.current = setTimeout(() => {
        setSearching(true)
        tourSearch({ keyword: q.trim(), lang })
          .then((res) => {
            setSearchResults(res.data.items ?? [])
          })
          .catch(() => setSearchResults([]))
          .finally(() => setSearching(false))
      }, 500)
    },
    [lang],
  )

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults(null)
  }, [])

  const switchLayer = useCallback((layer: BaseLayer) => {
    setActiveLayer(layer)
    setBaseLayerOpen(false)
  }, [])
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null)
  const [mapRadius, setMapRadius] = useState(20000)
  const pageRef = useRef(1)
  const hasMoreRef = useRef(true)
  const boundsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  useEffect(() => {
    if (!searchQuery.trim()) return
    handleSearch(searchQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  useEffect(() => {
    if (!selectedPlace) return
    setDetailPlace(selectedPlace)
    if (!flyToPlace(selectedPlace)) {
      pendingFlyRef.current = selectedPlace
    }
    setSelectedPlace(null)
  }, [selectedPlace, setSelectedPlace, flyToPlace])

  const loadPlaces = useCallback(
    (lat: number, lng: number, radius: number, page: number, append: boolean) => {
      const setter = append ? setLoadingMore : setLoading
      setter(true)
      tourNearby({
        lat,
        lng,
        radius: Math.min(radius, 200000),
        pageNo: page,
        numOfRows: PAGE_SIZE,
        lang,
      })
        .then((result) => {
          const items = result.data.items ?? []
          setPlaces((prev) => (append ? [...prev, ...items] : items))
          setTotalCount(result.data.totalCount ?? items.length)
          hasMoreRef.current = items.length >= PAGE_SIZE
        })
        .catch(() => {})
        .finally(() => setter(false))
    },
    [lang],
  )

  // 초기 로드 (위치 확보 후) + 언어 변경 시 재조회
  useEffect(() => {
    const lat = userLoc?.[1] ?? SEOUL[1]
    const lng = userLoc?.[0] ?? SEOUL[0]
    pageRef.current = 1
    hasMoreRef.current = true
    setMapCenter([lng, lat])
    loadPlaces(lat, lng, 20000, 1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoc, lang])

  // 뷰포트 변경 시 재조회 (debounce 800ms)
  const handleBoundsChange = useCallback(
    (bounds: [number, number, number, number]) => {
      if (boundsTimerRef.current) clearTimeout(boundsTimerRef.current)
      boundsTimerRef.current = setTimeout(() => {
        const [w, s, e, n] = bounds
        const cLat = (s + n) / 2
        const cLng = (w + e) / 2
        // 대략적인 반경 계산 (위도 1도 ≈ 111km)
        const latSpan = (n - s) * 111000
        const lngSpan = (e - w) * 111000 * Math.cos((cLat * Math.PI) / 180)
        const radius = Math.max(latSpan, lngSpan) / 2
        setMapCenter([cLng, cLat])
        setMapRadius(radius)
        pageRef.current = 1
        hasMoreRef.current = true
        loadPlaces(cLat, cLng, radius, 1, false)
      }, 800)
    },
    [loadPlaces],
  )

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMoreRef.current || !mapCenter) return
    pageRef.current += 1
    loadPlaces(mapCenter[1], mapCenter[0], mapRadius, pageRef.current, true)
  }, [loadPlaces, loadingMore, mapCenter, mapRadius])

  const displayPlaces = searchResults ?? places
  const isSearchMode = searchResults !== null

  const geojson = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point, PoiProperties>>(() => {
    if (!displayPlaces.length) return EMPTY_FC
    return {
      type: 'FeatureCollection',
      features: displayPlaces.map((p) => ({
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
  }, [displayPlaces])

  const handlePoiClick = useCallback(
    (props: PoiProperties) => {
      const place = displayPlaces.find((p) => p.id === props.id)
      if (!place) return
      setDetailPlace(place)
      flyToPlace(place)
    },
    [displayPlaces, flyToPlace],
  )

  const openDetail = useCallback(
    (p: TourSearchItem) => {
      setDetailPlace(p)
      flyToPlace(p)
    },
    [flyToPlace],
  )
  const closeDetail = useCallback(() => setDetailPlace(null), [])

  const center = userLoc ?? SEOUL

  return (
    <>
      {/* ═══ 지도 (데스크톱: 항상, 모바일: mobileView=map 일 때) ═══ */}
      <div
        className={`relative -mt-6 ${mobileView === 'list' ? 'hidden sm:block' : ''}`}
        style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}
      >
        <KakaoTourMap
          geojson={geojson}
          center={center}
          zoom={userLoc ? 13 : 11}
          className="h-[calc(100dvh-120px)] w-full sm:h-[calc(100dvh-104px)] lg:h-[calc(100dvh-74px)]"
          selectedId={detailPlace?.id ?? null}
          baseLayer={activeLayer}
          onPoiClick={handlePoiClick}
          onBoundsChange={handleBoundsChange}
          onMapReady={handleMapReady}
          fitToFeatures={
            (isSearchMode && displayPlaces.length > 0) || (places.length > 0 && !userLoc)
          }
        />
        <p
          aria-label="data-attribution"
          className="pointer-events-none absolute bottom-1.5 left-2 z-10 rounded-md bg-white/85 px-2 py-0.5 text-[11px] font-medium text-neutral-700 shadow-sm backdrop-blur-sm sm:text-[12px]"
        >
          {t('page.map.attribution')}
        </p>
      </div>

      {/* ═══ 모바일 목록 뷰 (sm 미만 + mobileView=list) ═══ */}
      <div className={`-mx-5 -mt-6 sm:hidden ${mobileView === 'list' ? '' : 'hidden'}`}>
        <div className="h-[calc(100dvh-120px)] overflow-y-auto bg-white [scrollbar-width:thin]">
          <div className="sticky top-0 z-10 space-y-2 border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur-sm">
            <h2 className="text-[17px] font-bold text-neutral-800">
              {loading || searching
                ? '불러오는 중...'
                : isSearchMode
                  ? `검색결과 ${displayPlaces.length}개`
                  : `관광지 ${totalCount > places.length ? totalCount.toLocaleString() : places.length}개`}
            </h2>
            <div className="relative">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t('page.search.placeholder')}
                className="w-full rounded-xl bg-neutral-100 py-2.5 pl-9 pr-9 text-[14px] text-neutral-800 outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-brand/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 grid h-5 w-5 place-items-center rounded-full bg-neutral-300 text-white"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          {displayPlaces.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => openDetail(p)}
              className="flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left"
            >
              {p.thumbnail ? (
                <img
                  src={p.thumbnail}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-xl object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-400">
                  <svg
                    width="18"
                    height="18"
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
                <p className="truncate text-[16px] font-bold text-neutral-800">{p.title}</p>
                <p className="mt-0.5 truncate text-[14px] text-neutral-500">{p.addr}</p>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="shrink-0 text-neutral-300"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
          {!isSearchMode && hasMoreRef.current && places.length > 0 && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full py-4 text-center text-[14px] font-bold text-brand disabled:text-neutral-400"
            >
              {loadingMore ? '불러오는 중...' : '더 보기'}
            </button>
          )}
        </div>
      </div>

      {/* ═══ 모바일 하단 토글 탭 (지도/목록) ═══ */}
      <div className="fixed inset-x-0 z-20 flex justify-center sm:hidden" style={{ bottom: 72 }}>
        <div className="flex overflow-hidden rounded-full border border-white/60 bg-white/90 shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={() => setMobileView('map')}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-[15px] font-bold transition-colors ${mobileView === 'map' ? 'bg-neutral-800 text-white' : 'text-neutral-600'}`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            </svg>
            지도
          </button>
          <button
            type="button"
            onClick={() => setMobileView('list')}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-[15px] font-bold transition-colors ${mobileView === 'list' ? 'bg-neutral-800 text-white' : 'text-neutral-600'}`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            목록
          </button>
        </div>
      </div>

      {/* ═══ 배경지도 선택 (우상단 — 아이콘 + 좌측 슬라이드) ═══ */}
      <div className="fixed z-20 flex items-center" style={{ top: 68, right: 16 }}>
        {/* 슬라이드 메뉴 */}
        <div
          className="flex items-center overflow-hidden rounded-l-xl border border-r-0 border-white/60 bg-white/88 shadow-lg backdrop-blur-md transition-[width,opacity] duration-300 ease-out"
          style={{ width: baseLayerOpen ? 88 : 0, opacity: baseLayerOpen ? 1 : 0 }}
        >
          {(
            [
              {
                key: 'normal' as BaseLayer,
                icon: (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6zM9 3v15M15 6v15" />
                  </svg>
                ),
              },
              {
                key: 'satellite' as BaseLayer,
                icon: (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="9" y="9" width="6" height="6" rx="1" />
                    <path d="M12 2v2M12 20v2M20 12h2M2 12h2" />
                  </svg>
                ),
              },
            ] as const
          ).map(({ key, icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => switchLayer(key)}
              title={key}
              className={`grid h-10 w-11 place-items-center transition-colors ${activeLayer === key ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'}`}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* 트리거 아이콘 */}
        <button
          type="button"
          onClick={() => setBaseLayerOpen(!baseLayerOpen)}
          className={`grid h-10 w-10 place-items-center rounded-xl border border-white/60 shadow-lg backdrop-blur-md transition-colors ${baseLayerOpen ? 'rounded-l-none bg-neutral-800 text-white' : 'bg-white/88 text-neutral-600 hover:bg-white'}`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
          </svg>
        </button>
      </div>

      {/* 좌측 유리 패널 — 데스크톱 전용: 목록 또는 상세 뷰 전환 */}
      <div
        className="pointer-events-auto fixed z-20 hidden w-[360px] max-w-[calc(100vw-60px)] sm:block"
        style={{ top: 80, left: 12 }}
      >
        <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/88 shadow-2xl backdrop-blur-lg">
          {/* ── 검색 입력 ── */}
          {!detailPlace && (
            <div className="border-b border-neutral-200/60 px-3 py-2.5">
              <div className="relative">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={t('page.search.placeholder')}
                  className="w-full rounded-xl bg-neutral-100/80 py-2.5 pl-9 pr-9 text-[14px] text-neutral-800 outline-none placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-brand/30"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 grid h-5 w-5 place-items-center rounded-full bg-neutral-300 text-white"
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── 상세 뷰 (detailPlace 있을 때) ── */}
          {detailPlace ? (
            <>
              {/* 상세 헤더 */}
              <button
                type="button"
                onClick={closeDetail}
                className="flex w-full items-center gap-2 border-b border-neutral-200/60 px-4 py-3 text-left transition-colors hover:bg-white/60"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-neutral-500"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <span className="text-[15px] font-bold text-neutral-800">목록으로</span>
              </button>
              {/* 상세 본문 */}
              <div className="max-h-[calc(100dvh-200px)] overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.12)_transparent] [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/12">
                {detailPlace.thumbnail && (
                  <img src={detailPlace.thumbnail} alt="" className="h-44 w-full object-cover" />
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="flex-1 text-[22px] font-bold tracking-tight text-neutral-900">
                      {detailPlace.title}
                    </h3>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(detailPlace)}
                      className={`mt-1 shrink-0 rounded-lg p-1.5 transition-colors ${isFavorite(detailPlace.id) ? 'text-accent' : 'text-neutral-300 hover:text-accent/60'}`}
                    >
                      <HeartIcon size={22} filled={isFavorite(detailPlace.id)} />
                    </button>
                  </div>
                  <p className="mt-1.5 flex items-start gap-1.5 text-[15px] text-neutral-500">
                    <PinIcon size={14} className="mt-[3px] shrink-0" />
                    {detailPlace.addr}
                  </p>
                  <DetailAdvisories place={detailPlace} />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* ── 목록 헤더 ── */}
              <button
                type="button"
                onClick={() => setPanelOpen(!panelOpen)}
                className="flex w-full shrink-0 cursor-pointer items-center gap-3 border-b border-neutral-200/60 px-4 py-3 text-left transition-colors hover:bg-white/60"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-neutral-500"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <h2 className="flex-1 text-[16px] font-bold text-neutral-800">
                  {loading || searching
                    ? '불러오는 중...'
                    : isSearchMode
                      ? `검색결과 ${displayPlaces.length}개`
                      : `관광지 ${totalCount > places.length ? totalCount.toLocaleString() : places.length}개`}
                </h2>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`shrink-0 text-neutral-400 transition-transform duration-250 ${panelOpen ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* ── 목록 본문 ── */}
              <div
                className="grid transition-[grid-template-rows] duration-300 ease-out"
                style={{ gridTemplateRows: panelOpen ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <div className="max-h-[calc(100dvh-290px)] overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.12)_transparent] [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/12">
                    {displayPlaces.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => openDetail(p)}
                        className="flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors hover:bg-white/80"
                      >
                        {p.thumbnail ? (
                          <img
                            src={p.thumbnail}
                            alt=""
                            className="h-11 w-11 shrink-0 rounded-lg object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-neutral-100 text-neutral-400">
                            <svg
                              width="16"
                              height="16"
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
                          <p className="truncate text-[15px] font-bold text-neutral-800">
                            {p.title}
                          </p>
                          <p className="mt-0.5 truncate text-[13px] text-neutral-500">{p.addr}</p>
                        </div>
                      </button>
                    ))}

                    {!isSearchMode && hasMoreRef.current && places.length > 0 && (
                      <button
                        type="button"
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="w-full py-3 text-center text-[15px] font-bold text-brand disabled:text-neutral-400"
                      >
                        {loadingMore ? '불러오는 중...' : '더 보기'}
                      </button>
                    )}

                    {!loading && !searching && displayPlaces.length === 0 && (
                      <p className="px-4 py-10 text-center text-[14px] text-neutral-400">
                        {isSearchMode
                          ? '검색 결과가 없습니다'
                          : '주변 관광지를 불러오는 중입니다...'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 모바일 전용 상세 모달 (하단 sheet) */}
      {detailPlace && (
        <div className="fixed inset-0 z-30 flex items-end sm:hidden" onClick={closeDetail}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative z-10 flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative shrink-0">
              {detailPlace.thumbnail ? (
                <img src={detailPlace.thumbnail} alt="" className="h-44 w-full object-cover" />
              ) : (
                <div className="grid h-36 w-full place-items-center bg-neutral-100 text-neutral-300">
                  <PinIcon size={36} />
                </div>
              )}
              <button
                type="button"
                onClick={closeDetail}
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain p-5 [scrollbar-width:thin]">
              <div className="flex items-start justify-between gap-2">
                <h3 className="flex-1 text-[22px] font-bold tracking-tight text-neutral-900">
                  {detailPlace.title}
                </h3>
                <button
                  type="button"
                  onClick={() => toggleFavorite(detailPlace)}
                  className={`shrink-0 rounded-lg p-1.5 transition-colors ${isFavorite(detailPlace.id) ? 'text-accent' : 'text-neutral-300 hover:text-accent/60'}`}
                >
                  <HeartIcon size={24} filled={isFavorite(detailPlace.id)} />
                </button>
              </div>
              <p className="mt-1.5 flex items-start gap-1.5 text-[15px] text-neutral-500">
                <PinIcon size={14} className="mt-[3px] shrink-0" />
                {detailPlace.addr}
              </p>
              <DetailAdvisories place={detailPlace} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ── advisory 렌더 (데스크톱 패널 + 모바일 시트 공용) ── */
const CAT_LABEL: Record<string, string> = {
  price: '물가 정보',
  transit: '교통',
  etiquette: '에티켓',
  safety: '안전',
}
const CAT_COLOR: Record<string, string> = {
  price: 'bg-amber-100 text-amber-700',
  transit: 'bg-neutral-200 text-neutral-700',
  etiquette: 'bg-teal-100 text-teal-700',
  safety: 'bg-red-100 text-red-700',
}

function DetailAdvisories({ place }: { place: TourSearchItem }) {
  const { t, i18n } = useTranslation()
  const groups = useMemo(() => groupByCategory(matchAdvisories(place)), [place])
  const fmtKrw = (v: number) => {
    try {
      return new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency: 'KRW',
        maximumFractionDigits: 0,
      }).format(v)
    } catch {
      return `₩${v.toLocaleString()}`
    }
  }

  if (groups.length === 0) {
    return (
      <p className="mt-5 text-center text-[14px] text-neutral-400">
        {t('page.place.noAdvisory', '이 장소에 대한 추가 정보가 아직 없습니다.')}
      </p>
    )
  }

  return (
    <div className="mt-4 space-y-3">
      {groups.map(({ category, items }) => (
        <section key={category}>
          <div className="mb-1.5 flex items-center gap-2">
            <span
              className={`rounded-md px-2 py-0.5 text-[13px] font-bold ${CAT_COLOR[category] ?? 'bg-neutral-100 text-neutral-600'}`}
            >
              {CAT_LABEL[category] ?? category}
            </span>
          </div>
          <ul className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-100">
            {items.map((a) => (
              <li key={a.id} className="px-3.5 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="flex-1 text-[14px] font-semibold text-neutral-800">
                    {t(`advisory.${a.id}.title`)}
                  </p>
                  {a.amount && (
                    <span className="shrink-0 text-[13px] font-bold tabular-nums text-amber-600">
                      {fmtKrw(a.amount.value)}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[13px] leading-relaxed text-neutral-500">
                  {t(`advisory.${a.id}.body`)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
