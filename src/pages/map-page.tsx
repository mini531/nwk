import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { KakaoTourMap, type BaseLayer, type PoiProperties } from '../components/kakao-tour-map'
import { useAppStore } from '../stores/app-store'
import { tourNearby, tourSearch, type TourSearchItem, type TourNearbyItem } from '../utils/api'
import { matchAdvisories, groupByCategory } from '../utils/match-advisories'
import { PinIcon, HeartIcon } from '../components/icons'
import { useFavorites } from '../hooks/use-favorites'
import { useAuth } from '../hooks/use-auth'
import { useCourses } from '../hooks/use-courses'
import { useCourseLike } from '../hooks/use-course-likes'
import { resolveLocalized, type Lang } from '../types/course'
import { shareCourse } from '../utils/course-share'
import { thumb } from '../utils/image'

// Bucheon City Hall — the app's regional anchor. Fallback when geolocation
// is unavailable or the user is overseas (previously this was Seoul, but the
// Bucheon specialization means we open centered on the local dataset).
const BUCHEON: [number, number] = [126.766, 37.504]
const EMPTY_FC: GeoJSON.FeatureCollection<GeoJSON.Point, PoiProperties> = {
  type: 'FeatureCollection',
  features: [],
}
const PAGE_SIZE = 40

// Backend (tourNearby) rejects coordinates outside Korea with 400.
// Guard frontend calls so overseas users still see the default center.
const isInKorea = (lng: number, lat: number): boolean =>
  lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132

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
  const [mobileView, setMobileView] = useState<'map' | 'list'>('list')
  const [baseLayerOpen, setBaseLayerOpen] = useState(false)
  const [activeLayer, setActiveLayer] = useState<BaseLayer>('normal')
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [leftTab, setLeftTab] = useState<'theme' | 'poi'>('theme')
  const [courseModalOpen, setCourseModalOpen] = useState(false)
  const [courseSheetExpanded, setCourseSheetExpanded] = useState(true)
  const [sheetShareHint, setSheetShareHint] = useState<'copied' | 'failed' | null>(null)
  const { signIn } = useAuth()
  const sheetLike = useCourseLike(selectedCourseId)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const courses = useCourses()
  const langShort = (lang.slice(0, 2) as Lang) || 'ko'

  // Deep link: /map?course=<id> opens the themed sidebar with the given
  // course pre-selected. Used by the 'View on map' button in the course
  // detail page. Consumed once on mount, then the param is stripped so
  // the user can back-button out cleanly.
  useEffect(() => {
    const id = searchParams.get('course')
    if (!id) return
    if (!courses.some((c) => c.id === id)) return
    setLeftTab('theme')
    setSelectedCourseId(id)
    setCourseModalOpen(true)
    setCourseSheetExpanded(true)
    setMobileView('map')
    const next = new URLSearchParams(searchParams)
    next.delete('course')
    setSearchParams(next, { replace: true })
  }, [courses, searchParams, setSearchParams])
  const [searchResults, setSearchResults] = useState<TourSearchItem[] | null>(null)
  const [searching, setSearching] = useState(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mapInstanceRef = useRef<kakao.maps.Map | null>(null)
  const pendingFlyRef = useRef<TourSearchItem | null>(null)
  const animHandleRef = useRef<number | null>(null)
  const zoomTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Custom RAF pan + staggered zoom. Kakao's built-in panTo silently
  // no-ops in some edge cases (rapid clicks, already-near targets,
  // overlapping setBounds), so we drive setCenter frame-by-frame to
  // guarantee movement on every click. Any pending animation is
  // cancelled before the new one starts.
  const flyToPlace = useCallback((place: Pick<TourSearchItem, 'lat' | 'lng'>) => {
    const map = mapInstanceRef.current
    if (!map) return false
    if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return false
    const k = window.kakao?.maps
    if (!k) return false

    // Cancel any in-flight animation so successive clicks chain cleanly.
    if (animHandleRef.current !== null) {
      cancelAnimationFrame(animHandleRef.current)
      animHandleRef.current = null
    }
    if (zoomTimerRef.current !== null) {
      clearTimeout(zoomTimerRef.current)
      zoomTimerRef.current = null
    }

    const start = map.getCenter()
    const startLat = start.getLat()
    const startLng = start.getLng()
    const endLat = place.lat
    const endLng = place.lng
    const delta = Math.abs(startLat - endLat) + Math.abs(startLng - endLng)

    // Already at target — skip pan but still level-check below.
    if (delta < 1e-5) {
      const currentLevel = map.getLevel()
      if (currentLevel !== 4) map.setLevel(4, { animate: true })
      return true
    }

    const duration = 600
    const startTime = performance.now()
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

    const step = (now: number) => {
      const current = mapInstanceRef.current
      if (!current) {
        animHandleRef.current = null
        return
      }
      const t = Math.min((now - startTime) / duration, 1)
      const e = easeOutCubic(t)
      const lat = startLat + (endLat - startLat) * e
      const lng = startLng + (endLng - startLng) * e
      current.setCenter(new k.LatLng(lat, lng))
      if (t < 1) {
        animHandleRef.current = requestAnimationFrame(step)
      } else {
        animHandleRef.current = null
      }
    }
    animHandleRef.current = requestAnimationFrame(step)

    // Zoom adjusts after pan completes to avoid simultaneous animations.
    const currentLevel = map.getLevel()
    if (currentLevel !== 4) {
      zoomTimerRef.current = setTimeout(() => {
        const curr = mapInstanceRef.current
        if (curr) curr.setLevel(4, { animate: true })
        zoomTimerRef.current = null
      }, duration + 50)
    }

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

  // 지도 기본 중심은 부천. POI 목록은 '전체 관광지' 탭이 처음 열리는 시점까지
  // 지연해 부하를 낮춘다 (공모전 시연 시 코스 기본 뷰가 즉시 뜸).
  useEffect(() => {
    setMapCenter([BUCHEON[0], BUCHEON[1]])
  }, [])

  useEffect(() => {
    if (leftTab !== 'poi') return
    const lat = BUCHEON[1]
    const lng = BUCHEON[0]
    pageRef.current = 1
    hasMoreRef.current = true
    setMapCenter([lng, lat])
    loadPlaces(lat, lng, 20000, 1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftTab, lang])

  // 뷰포트 변경 시 재조회 (debounce 800ms). 한국 밖이면 호출 스킵.
  // 테마 탭이거나 코스가 선택된 동안에는 POI를 다시 부르지 않는다.
  const handleBoundsChange = useCallback(
    (bounds: [number, number, number, number]) => {
      if (boundsTimerRef.current) clearTimeout(boundsTimerRef.current)
      boundsTimerRef.current = setTimeout(() => {
        if (leftTab !== 'poi' || selectedCourseId) return
        const [w, s, e, n] = bounds
        const cLat = (s + n) / 2
        const cLng = (w + e) / 2
        if (!isInKorea(cLng, cLat)) return
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
    [loadPlaces, leftTab, selectedCourseId],
  )

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMoreRef.current || !mapCenter) return
    pageRef.current += 1
    loadPlaces(mapCenter[1], mapCenter[0], mapRadius, pageRef.current, true)
  }, [loadPlaces, loadingMore, mapCenter, mapRadius])

  const displayPlaces = searchResults ?? places
  const isSearchMode = searchResults !== null

  const selectedCourse = useMemo(
    () => (selectedCourseId ? (courses.find((c) => c.id === selectedCourseId) ?? null) : null),
    [selectedCourseId, courses],
  )

  // Mobile list view hides the map via display:none, so Kakao never laid
  // out its container while a course was selected. When the user taps
  // back into the map tab we call relayout() and re-fit the bounds so
  // the numbered course pins appear in the right place immediately.
  useEffect(() => {
    if (mobileView !== 'map') return
    const map = mapInstanceRef.current
    if (!map || typeof window === 'undefined') return
    const k = window.kakao?.maps
    if (!k) return
    const tid = window.setTimeout(() => {
      map.relayout()
      if (!selectedCourse) return
      const bounds = new k.LatLngBounds()
      for (const s of selectedCourse.stops) {
        const poi = s.poi
        if (!poi) continue
        if (!Number.isFinite(poi.coords.lat) || !Number.isFinite(poi.coords.lng)) continue
        bounds.extend(new k.LatLng(poi.coords.lat, poi.coords.lng))
      }
      if (!bounds.isEmpty()) map.setBounds(bounds, 60)
    }, 60)
    return () => window.clearTimeout(tid)
  }, [mobileView, selectedCourse])

  const poiGeojson = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point, PoiProperties>>(() => {
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

  // Course overlay: when a course is active, replace POI markers with
  // numbered course stops (1, 2, 3, ...) so the full itinerary is visible.
  const geojson = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point, PoiProperties>>(() => {
    if (!selectedCourse) return poiGeojson
    const features: GeoJSON.Feature<GeoJSON.Point, PoiProperties>[] = selectedCourse.stops
      .filter(
        (s) => s.poi && Number.isFinite(s.poi.coords.lat) && Number.isFinite(s.poi.coords.lng),
      )
      .map((s) => {
        const poi = s.poi!
        return {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [poi.coords.lng, poi.coords.lat] },
          properties: {
            id: `course-${selectedCourse.id}-${s.order}`,
            title: poi.titleByLang[langShort] ?? poi.titleByLang.ko,
            addr: poi.addrByLang[langShort] ?? poi.addrByLang.ko,
            thumbnail: poi.thumbnail,
            thumbnailSmall: null,
            contentTypeId: '',
            typeTag: 'attraction' as const,
            region: poi.sigunguName ?? '',
            order: s.order,
          },
        }
      })
    return { type: 'FeatureCollection' as const, features }
  }, [selectedCourse, poiGeojson, langShort])

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

  const center: [number, number] = BUCHEON

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
          selectedMarker={
            detailPlace && detailPlace.lat && detailPlace.lng
              ? { id: detailPlace.id, lat: detailPlace.lat, lng: detailPlace.lng }
              : null
          }
          baseLayer={activeLayer}
          onPoiClick={handlePoiClick}
          onBoundsChange={handleBoundsChange}
          onMapReady={handleMapReady}
          fitToFeatures={
            Boolean(selectedCourse) ||
            (isSearchMode && displayPlaces.length > 0) ||
            (places.length > 0 && !userLoc)
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
          <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 px-3 py-2 backdrop-blur-sm">
            <div className="flex items-stretch gap-1.5 rounded-lg bg-neutral-100 p-1">
              <button
                type="button"
                onClick={() => setLeftTab('theme')}
                aria-pressed={leftTab === 'theme'}
                className={`flex-1 rounded-md px-3 py-2 text-[13px] font-bold transition-colors ${
                  leftTab === 'theme'
                    ? 'bg-brand text-on-brand shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {t('page.map.tabTheme')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLeftTab('poi')
                  setSelectedCourseId(null)
                }}
                aria-pressed={leftTab === 'poi'}
                className={`flex-1 rounded-md px-3 py-2 text-[13px] font-bold transition-colors ${
                  leftTab === 'poi'
                    ? 'bg-brand text-on-brand shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {t('page.map.tabPoi')}
              </button>
            </div>
          </div>

          {leftTab === 'theme' ? (
            <>
              <div className="border-b border-neutral-200/60 px-4 py-2.5">
                <h2 className="text-[14px] font-bold text-neutral-800">
                  {t('page.map.themeCount', { count: courses.length })}
                </h2>
              </div>
              {courses.map((c) => {
                const ctext = resolveLocalized(c.i18n, langShort)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCourseId(c.id)
                      setCourseModalOpen(true)
                      setCourseSheetExpanded(true)
                      setMobileView('map')
                    }}
                    className="flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors hover:bg-white/80"
                  >
                    {c.heroImage ? (
                      <img
                        src={c.heroImage}
                        alt=""
                        loading="lazy"
                        className="h-14 w-14 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-400">
                        <PinIcon size={18} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold tracking-tight text-neutral-800">
                        {ctext.title}
                      </p>
                      <p className="mt-0.5 truncate text-[13px] text-neutral-500">
                        {t(`page.courses.duration.${c.duration}`)} ·{' '}
                        {t('page.map.stopsLabel', { count: c.stops.length })} ·{' '}
                        {t('page.courses.bucheonShare', {
                          pct: Math.round(c.bucheonShare * 100),
                        })}
                      </p>
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
                )
              })}
            </>
          ) : (
            <>
              <div className="space-y-2 border-b border-neutral-200/60 bg-white/95 px-4 py-3">
                <h2 className="text-[15px] font-bold text-neutral-800">
                  {loading || searching
                    ? t('page.map.loading')
                    : isSearchMode
                      ? t('page.map.resultCount_search', { count: displayPlaces.length })
                      : t('page.map.resultCount_tour', {
                          count: totalCount > places.length ? totalCount : places.length,
                        })}
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
                  {loadingMore ? t('page.map.loading') : t('page.map.loadMore')}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ═══ 모바일 하단 토글 탭 (목록/지도) ═══ */}
      <div className="fixed inset-x-0 z-20 flex justify-center sm:hidden" style={{ bottom: 72 }}>
        <div className="flex overflow-hidden rounded-full border border-white/60 bg-white/90 shadow-lg backdrop-blur-md">
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
            {t('page.map.tabList')}
          </button>
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
            {t('page.map.tabMap')}
          </button>
        </div>
      </div>

      {/* ═══ 배경지도 선택 (우상단 — 아이콘 + 좌측 슬라이드) ═══
          모바일 목록 뷰에서는 지도 도구가 필요 없으므로 숨김. */}
      <div
        className={`fixed z-20 items-center ${mobileView === 'list' ? 'hidden sm:flex' : 'flex'}`}
        style={{ top: 68, right: 16 }}
      >
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

      {/* ═══ 지도 확대/축소 컨트롤 (우측 · basemap 버튼 아래) ═══
          모바일 목록 뷰에서는 숨김. */}
      <div
        className={`fixed z-20 flex-col overflow-hidden rounded-xl border border-white/60 bg-white/88 shadow-lg backdrop-blur-md ${mobileView === 'list' ? 'hidden sm:flex' : 'flex'}`}
        style={{ top: 116, right: 16 }}
      >
        <button
          type="button"
          onClick={() => {
            const map = mapInstanceRef.current
            if (!map) return
            map.setLevel(Math.max(1, map.getLevel() - 1), { animate: true })
          }}
          aria-label={t('page.map.zoomIn')}
          className="grid h-10 w-10 place-items-center border-b border-black/[0.06] text-neutral-700 transition-colors hover:bg-neutral-100"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => {
            const map = mapInstanceRef.current
            if (!map) return
            map.setLevel(Math.min(14, map.getLevel() + 1), { animate: true })
          }}
          aria-label={t('page.map.zoomOut')}
          className="grid h-10 w-10 place-items-center text-neutral-700 transition-colors hover:bg-neutral-100"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M5 12h14" />
          </svg>
        </button>
      </div>

      {/* 좌측 유리 패널 — 데스크톱 전용: 목록 또는 상세 뷰 전환 */}
      <div
        className="pointer-events-auto fixed z-20 hidden w-[360px] max-w-[calc(100vw-60px)] sm:block"
        style={{ top: 80, left: 12 }}
      >
        <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/88 shadow-2xl backdrop-blur-lg">
          {/* ── 탭: 부천 테마 / 전체 관광지 ── */}
          {!detailPlace && (
            <div className="flex items-stretch gap-1.5 border-b border-neutral-200/60 bg-neutral-50/80 p-1.5">
              <button
                type="button"
                onClick={() => {
                  setLeftTab('theme')
                }}
                aria-pressed={leftTab === 'theme'}
                className={`flex-1 rounded-lg px-4 py-2 text-[13px] font-bold tracking-tight transition-colors ${
                  leftTab === 'theme'
                    ? 'bg-brand text-on-brand shadow-sm'
                    : 'text-neutral-500 hover:bg-white/80 hover:text-neutral-800'
                }`}
              >
                {t('page.map.tabTheme')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLeftTab('poi')
                  setSelectedCourseId(null)
                }}
                aria-pressed={leftTab === 'poi'}
                className={`flex-1 rounded-lg px-4 py-2 text-[13px] font-bold tracking-tight transition-colors ${
                  leftTab === 'poi'
                    ? 'bg-brand text-on-brand shadow-sm'
                    : 'text-neutral-500 hover:bg-white/80 hover:text-neutral-800'
                }`}
              >
                {t('page.map.tabPoi')}
              </button>
            </div>
          )}
          {/* ── 검색 입력 ── */}
          {!detailPlace && leftTab === 'poi' && (
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
                <span className="text-[15px] font-bold text-neutral-800">
                  {t('page.map.backToList')}
                </span>
              </button>
              {/* 상세 본문 */}
              <div className="max-h-[calc(100dvh-200px)] overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.12)_transparent] [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/12">
                {detailPlace.thumbnail && (
                  <img
                    src={thumb(detailPlace.thumbnail, 640) ?? detailPlace.thumbnail}
                    alt=""
                    className="h-44 w-full object-cover"
                  />
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
          ) : leftTab === 'theme' && selectedCourse ? (
            <>
              {/* ── 코스 상세 헤더 (← 뒤로) ── */}
              <button
                type="button"
                onClick={() => setSelectedCourseId(null)}
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
                <span className="text-[15px] font-bold text-neutral-800">
                  {t('page.map.backToThemes')}
                </span>
              </button>
              {/* ── 코스 상세 본문 ── */}
              {(() => {
                const ctext = resolveLocalized(selectedCourse.i18n, langShort)
                return (
                  <div className="max-h-[calc(100dvh-200px)] overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.12)_transparent] [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/12">
                    {selectedCourse.heroImage && (
                      <img
                        src={selectedCourse.heroImage}
                        alt=""
                        className="h-44 w-full object-cover"
                      />
                    )}
                    <div className="space-y-3 p-5">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
                          <span className="rounded-full bg-ink px-2 py-0.5 text-on-ink">
                            {t(`page.courses.duration.${selectedCourse.duration}`)}
                          </span>
                          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-brand">
                            {t('page.courses.bucheonShare', {
                              pct: Math.round(selectedCourse.bucheonShare * 100),
                            })}
                          </span>
                        </div>
                        <h3 className="mt-2 text-[20px] font-bold leading-tight tracking-tight text-neutral-900">
                          {ctext.title}
                        </h3>
                        {ctext.subtitle && (
                          <p className="mt-1 text-[13px] leading-snug text-neutral-500">
                            {ctext.subtitle}
                          </p>
                        )}
                      </div>
                      <p className="whitespace-pre-line text-[13px] leading-relaxed text-neutral-700">
                        {ctext.summary}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selectedCourse.styleTags.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600"
                          >
                            {t(`page.courses.tag.${s}`)}
                          </span>
                        ))}
                      </div>
                      <div className="border-t border-neutral-200/60 pt-3">
                        <p className="mb-2 text-[12px] font-bold text-neutral-500">
                          {t('page.course.itinerary')}
                        </p>
                        <ol className="space-y-2">
                          {selectedCourse.stops.map((s) => {
                            const stext = resolveLocalized(s.i18n, langShort)
                            const poiTitle =
                              s.poi?.titleByLang[langShort] ?? s.poi?.titleByLang.ko ?? ''
                            const hasCoords =
                              s.poi &&
                              Number.isFinite(s.poi.coords.lat) &&
                              Number.isFinite(s.poi.coords.lng)
                            return (
                              <li key={s.order}>
                                <button
                                  type="button"
                                  disabled={!hasCoords}
                                  onClick={() => {
                                    if (!hasCoords || !s.poi) return
                                    flyToPlace({
                                      lat: s.poi.coords.lat,
                                      lng: s.poi.coords.lng,
                                    })
                                  }}
                                  className="flex w-full gap-2.5 rounded-lg bg-white/70 p-2.5 text-left transition-colors hover:bg-brand-soft/60 hover:ring-1 hover:ring-brand/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-default disabled:hover:bg-white/70 disabled:hover:ring-0"
                                >
                                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#2a78ff] text-[12px] font-bold text-white">
                                    {s.order}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-[13px] font-bold text-neutral-800">
                                      {poiTitle}
                                    </p>
                                    <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-neutral-500">
                                      {stext.note}
                                    </p>
                                  </div>
                                </button>
                              </li>
                            )
                          })}
                        </ol>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </>
          ) : leftTab === 'theme' ? (
            <>
              {/* ── 코스 목록 헤더 ── */}
              <div className="flex w-full items-center gap-3 border-b border-neutral-200/60 px-4 py-3">
                <h2 className="flex-1 text-[16px] font-bold text-neutral-800">
                  {t('page.map.themeCount', { count: courses.length })}
                </h2>
              </div>
              {/* ── 코스 목록 본문 ── */}
              <div className="max-h-[calc(100dvh-200px)] overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.12)_transparent] [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/12">
                {courses.map((c) => {
                  const ctext = resolveLocalized(c.i18n, langShort)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCourseId(c.id)}
                      className="flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors hover:bg-white/80"
                    >
                      {c.heroImage ? (
                        <img
                          src={c.heroImage}
                          alt=""
                          loading="lazy"
                          className="h-12 w-12 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-neutral-100 text-neutral-400">
                          <PinIcon size={16} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-bold tracking-tight text-neutral-800">
                          {ctext.title}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] text-neutral-500">
                          {t(`page.courses.duration.${c.duration}`)} ·{' '}
                          {t('page.map.stopsLabel', { count: c.stops.length })} ·{' '}
                          {t('page.courses.bucheonShare', {
                            pct: Math.round(c.bucheonShare * 100),
                          })}
                        </p>
                      </div>
                    </button>
                  )
                })}
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
                    ? t('page.map.loading')
                    : isSearchMode
                      ? t('page.map.resultCount_search', { count: displayPlaces.length })
                      : t('page.map.resultCount_tour', {
                          count: totalCount > places.length ? totalCount : places.length,
                        })}
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
                        {loadingMore ? t('page.map.loading') : t('page.map.loadMore')}
                      </button>
                    )}

                    {!loading && !searching && displayPlaces.length === 0 && (
                      <p className="px-4 py-10 text-center text-[14px] text-neutral-400">
                        {isSearchMode ? t('page.map.noSearchResult') : t('page.map.loadingNearby')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 모바일 전용 코스 상세 시트. 확장(펼침) / 축소(접힘) 두 단계로 토글.
          축소 상태에서는 핸들 바 + 제목만 남아 지도의 번호 핀이 잘 보이고,
          펼치면 히어로 이미지부터 일정까지 스크롤 가능. 스톱 번호 탭 시
          해당 위치로 이동하며 자동으로 축소된다. */}
      {selectedCourse && leftTab === 'theme' && courseModalOpen && (
        <div className="pointer-events-none fixed inset-0 z-30 flex items-end sm:hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/15" />
          <div
            className={`pointer-events-auto relative z-10 flex w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl transition-[max-height] duration-300 ease-out ${
              courseSheetExpanded ? 'max-h-[55dvh]' : 'max-h-[88px]'
            }`}
          >
            <button
              type="button"
              onClick={() => setCourseModalOpen(false)}
              aria-label={t('page.map.backToThemes')}
              className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm"
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
            {(() => {
              const ctext = resolveLocalized(selectedCourse.i18n, langShort)
              return (
                <>
                  {/* 핸들 바 + 제목: 항상 보이는 영역. 탭하면 접고 편다. */}
                  <button
                    type="button"
                    onClick={() => setCourseSheetExpanded((v) => !v)}
                    aria-label={
                      courseSheetExpanded ? t('page.map.sheetCollapse') : t('page.map.sheetExpand')
                    }
                    aria-expanded={courseSheetExpanded}
                    className="flex w-full shrink-0 items-center gap-3 px-4 pb-2 pt-2.5 text-left"
                  >
                    <div className="flex flex-1 flex-col items-stretch">
                      <span className="mx-auto mb-1.5 block h-1 w-10 shrink-0 rounded-full bg-neutral-300" />
                      <div className="flex items-center gap-3">
                        <span className="inline-flex shrink-0 items-center rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand">
                          {t(`page.courses.duration.${selectedCourse.duration}`)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[14px] font-bold tracking-tight text-neutral-800">
                          {ctext.title}
                        </span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`shrink-0 text-neutral-400 transition-transform duration-300 ${
                            courseSheetExpanded ? '' : 'rotate-180'
                          }`}
                        >
                          <path d="M6 15l6-6 6 6" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* 스크롤 가능한 본문 (펼쳤을 때만 접근 가능) */}
                  <div className="flex-1 overflow-y-auto overscroll-contain">
                    {selectedCourse.heroImage ? (
                      <img
                        src={selectedCourse.heroImage}
                        alt=""
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-32 w-full place-items-center bg-neutral-100 text-neutral-300">
                        <PinIcon size={36} />
                      </div>
                    )}
                    <div className="space-y-3 px-5 py-4">
                      <span className="inline-flex items-center rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-on-ink">
                        {t('page.courses.bucheonShare', {
                          pct: Math.round(selectedCourse.bucheonShare * 100),
                        })}
                      </span>
                      {ctext.subtitle && (
                        <p className="text-[13px] leading-snug text-neutral-500">
                          {ctext.subtitle}
                        </p>
                      )}
                      <p className="whitespace-pre-line text-[13px] leading-relaxed text-neutral-700">
                        {ctext.summary}
                      </p>
                      <div className="border-t border-neutral-200/60 pt-3">
                        <p className="mb-2 text-[12px] font-bold text-neutral-500">
                          {t('page.course.itinerary')}
                        </p>
                        <ol className="space-y-2">
                          {selectedCourse.stops.map((s) => {
                            const stext = resolveLocalized(s.i18n, langShort)
                            const poiTitle =
                              s.poi?.titleByLang[langShort] ?? s.poi?.titleByLang.ko ?? ''
                            const hasCoords =
                              s.poi &&
                              Number.isFinite(s.poi.coords.lat) &&
                              Number.isFinite(s.poi.coords.lng)
                            return (
                              <li key={s.order}>
                                <button
                                  type="button"
                                  disabled={!hasCoords}
                                  onClick={() => {
                                    if (!hasCoords || !s.poi) return
                                    setCourseSheetExpanded(false)
                                    setMobileView('map')
                                    flyToPlace({
                                      lat: s.poi.coords.lat,
                                      lng: s.poi.coords.lng,
                                    })
                                  }}
                                  className="flex w-full gap-2.5 rounded-lg bg-neutral-50 p-2.5 text-left transition-colors hover:bg-brand-soft/60 disabled:cursor-default"
                                >
                                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#2a78ff] text-[12px] font-bold text-white">
                                    {s.order}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-[13px] font-bold text-neutral-800">
                                      {poiTitle}
                                    </p>
                                    <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-neutral-500">
                                      {stext.note}
                                    </p>
                                  </div>
                                </button>
                              </li>
                            )
                          })}
                        </ol>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200/60 pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (!sheetLike.canLike) return signIn().catch(() => undefined)
                            sheetLike.toggle()
                          }}
                          aria-pressed={sheetLike.liked}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                            sheetLike.liked
                              ? 'border-accent bg-accent text-on-accent hover:bg-accent/90'
                              : 'border-neutral-300 bg-white text-neutral-700 hover:border-accent hover:text-accent'
                          }`}
                        >
                          <HeartIcon size={14} filled={sheetLike.liked} />
                          <span>{t('page.course.like')}</span>
                          <span className="tabular-nums">{sheetLike.count}</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const txt = resolveLocalized(selectedCourse.i18n, langShort)
                            const result = await shareCourse({
                              title: txt.title,
                              text: txt.summary,
                              url: `${window.location.origin}/courses/${selectedCourse.id}`,
                            })
                            if (result === 'copied') setSheetShareHint('copied')
                            else if (result === 'failed') setSheetShareHint('failed')
                            else setSheetShareHint(null)
                            if (result !== 'shared') {
                              window.setTimeout(() => setSheetShareHint(null), 2500)
                            }
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-neutral-700 hover:border-neutral-500"
                        >
                          {t('page.course.share')}
                        </button>
                        {sheetShareHint === 'copied' && (
                          <span className="text-[11px] font-medium text-brand">
                            {t('page.course.shareCopied')}
                          </span>
                        )}
                        {sheetShareHint === 'failed' && (
                          <span className="text-[11px] font-medium text-danger">
                            {t('page.course.shareFailed')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* 모바일 전용 상세 모달 (하단 sheet). 시트 바깥은 pointer-events-none
          으로 배경 지도 조작을 유지하고, 닫기는 우상단 X 버튼으로. */}
      {detailPlace && (
        <div className="pointer-events-none fixed inset-0 z-30 flex items-end sm:hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/15" />
          <div className="pointer-events-auto relative z-10 flex max-h-[70dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl">
            <div className="relative shrink-0">
              {detailPlace.thumbnail ? (
                <img
                  src={thumb(detailPlace.thumbnail, 640) ?? detailPlace.thumbnail}
                  alt=""
                  className="h-44 w-full object-cover"
                />
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
              {t(`page.place.categories.${category}`, category)}
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
