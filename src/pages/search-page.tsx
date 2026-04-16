import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRightIcon, PinIcon, SearchIcon } from '../components/icons'
import { TourMap, type PoiProperties } from '../components/tour-map'
import tourPois from '../data/live-tour-pois.json'
import { ADVISORIES, type AdvisoryCategory } from '../data/advisories'
import { matchAdvisories, groupByCategory } from '../utils/match-advisories'
import { tourNearby, tourSearch, type TourSearchItem } from '../utils/api'

type GeoJsonCollection = GeoJSON.FeatureCollection<GeoJSON.Point, PoiProperties>

const POIS = tourPois as unknown as GeoJsonCollection & {
  featureCount: number
  fetchedAt: string
}

const CATEGORY_FILTERS = [
  { id: 'all' as const },
  { id: 'attraction' as const },
  { id: 'culture' as const },
]

const MAX_LEN = 50
const SAFE_RE = /[<>"'`;{}\\]/g

const ADVISORY_BY_ID = new Map(ADVISORIES.map((a) => [a.id, a]))

const CATEGORY_ACCENT: Record<AdvisoryCategory, { dot: string; text: string; bg: string }> = {
  price: { dot: 'bg-accent', text: 'text-accent', bg: 'bg-accent-soft' },
  transit: { dot: 'bg-ink', text: 'text-ink', bg: 'bg-line' },
  etiquette: { dot: 'bg-brand', text: 'text-brand', bg: 'bg-brand-soft' },
  safety: { dot: 'bg-warn', text: 'text-warn', bg: 'bg-warn-soft' },
}

const poiToItem = (p: PoiProperties, feature: GeoJSON.Feature<GeoJSON.Point>): TourSearchItem => ({
  id: p.id,
  title: p.title,
  addr: p.addr,
  lat: feature.geometry.coordinates[1],
  lng: feature.geometry.coordinates[0],
  thumbnail: p.thumbnail ?? undefined,
})

export const SearchPage = () => {
  const { t, i18n } = useTranslation()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'attraction' | 'culture'>('all')
  const [focusId, setFocusId] = useState<string | null>(null)
  const [liveItems, setLiveItems] = useState<TourSearchItem[]>([])
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveSource, setLiveSource] = useState<'live' | 'mock' | null>(null)
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null)
  const [nearbyItems, setNearbyItems] = useState<TourSearchItem[]>([])
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [nearbyError, setNearbyError] = useState<string | null>(null)
  const asideRef = useRef<HTMLElement>(null)

  const requestNearby = () => {
    if (!('geolocation' in navigator)) {
      setNearbyError(t('page.search.geoUnsupported'))
      return
    }
    setNearbyLoading(true)
    setNearbyError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await tourNearby({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            radius: 3000,
            lang: i18n.language,
          })
          const items = res.data.items
          setNearbyItems(items)
          if (items.length === 0) setNearbyError(t('page.search.geoEmpty'))
          setQ('')
          setFocusId(null)
        } catch {
          setNearbyError(t('page.search.geoFailed'))
        } finally {
          setNearbyLoading(false)
        }
      },
      () => {
        setNearbyError(t('page.search.geoDenied'))
        setNearbyLoading(false)
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 },
    )
  }

  const handlePoiClick = (p: PoiProperties) => {
    setFocusId(p.id)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      window.requestAnimationFrame(() => {
        asideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }

  const keyword = q.replace(SAFE_RE, '').trim().slice(0, MAX_LEN).toLowerCase()

  // Debounced live tourSearch call in the user's current language.
  useEffect(() => {
    const trimmed = keyword.trim()
    if (trimmed.length < 2) {
      setLiveItems([])
      setLiveSource(null)
      return
    }
    let cancelled = false
    setLiveLoading(true)
    const timer = window.setTimeout(async () => {
      try {
        const res = await tourSearch({ keyword: trimmed, lang: i18n.language })
        if (cancelled) return
        setLiveItems(res.data.items)
        setLiveSource(res.data.source)
      } catch {
        if (cancelled) return
        setLiveItems([])
        setLiveSource(null)
      } finally {
        if (!cancelled) setLiveLoading(false)
      }
    }, 450)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      setLiveLoading(false)
    }
  }, [keyword, i18n.language])

  const filteredFeatures = useMemo(() => {
    let features = POIS.features
    if (filter !== 'all') {
      features = features.filter((f) => f.properties.typeTag === filter)
    }
    if (keyword) {
      features = features.filter(
        (f) =>
          f.properties.title.toLowerCase().includes(keyword) ||
          f.properties.addr.toLowerCase().includes(keyword),
      )
    }
    return features
  }, [filter, keyword])

  const itemsToFeatures = (items: TourSearchItem[]) =>
    items
      .filter((it) => Number.isFinite(it.lat) && Number.isFinite(it.lng) && it.lat && it.lng)
      .map<GeoJSON.Feature<GeoJSON.Point, PoiProperties>>((it) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [it.lng, it.lat] },
        properties: {
          id: it.id,
          title: it.title,
          addr: it.addr,
          thumbnail: it.thumbnail ?? null,
          thumbnailSmall: null,
          contentTypeId: '',
          typeTag: 'attraction' as const,
          region: 'live',
        },
      }))

  const liveFeatures = useMemo(() => itemsToFeatures(liveItems), [liveItems])
  const nearbyFeatures = useMemo(() => itemsToFeatures(nearbyItems), [nearbyItems])

  const geoCollection: GeoJsonCollection = useMemo(() => {
    if (nearbyFeatures.length > 0) {
      return { type: 'FeatureCollection', features: nearbyFeatures }
    }
    if (keyword && liveFeatures.length > 0) {
      return { type: 'FeatureCollection', features: liveFeatures }
    }
    return { type: 'FeatureCollection', features: filteredFeatures }
  }, [nearbyFeatures, keyword, liveFeatures, filteredFeatures])

  const mapFeatureSource =
    nearbyFeatures.length > 0 ? 'nearby' : keyword && liveFeatures.length > 0 ? 'live' : 'static'

  // Sidebar list: viewport-synced when no keyword, live results when typing.
  const visibleFeatures = useMemo(() => {
    if (keyword) return filteredFeatures
    if (!bounds) return filteredFeatures.slice(0, 40)
    const [west, south, east, north] = bounds
    return filteredFeatures
      .filter((f) => {
        const [lng, lat] = f.geometry.coordinates
        return lng >= west && lng <= east && lat >= south && lat <= north
      })
      .slice(0, 60)
  }, [keyword, filteredFeatures, bounds])

  const focusFeature = useMemo(
    () => (focusId ? POIS.features.find((f) => f.properties.id === focusId) : null),
    [focusId],
  )

  const focusAdvisories = useMemo(() => {
    if (!focusFeature) return []
    const item = poiToItem(focusFeature.properties, focusFeature)
    const matches = matchAdvisories(item)
    return groupByCategory(matches).map((g) => ({
      category: g.category,
      items: g.items.slice(0, 2).map((a) => ADVISORY_BY_ID.get(a.id) ?? a),
    }))
  }, [focusFeature])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    // Search is live via keyword state filtering; submit just blurs the input.
    ;(e.target as HTMLFormElement).querySelector('input')?.blur()
  }

  return (
    <div className="pb-4">
      <header className="mb-5 max-w-3xl space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
          <p className="text-[12px] font-semibold text-brand">{t('page.search.eyebrow')}</p>
        </div>
        <h1 className="text-[28px] font-semibold tracking-tight text-ink sm:text-[32px]">
          {t('page.search.title')}
        </h1>
        <p className="text-[14px] leading-relaxed text-ink-2">{t('page.search.subhead')}</p>
      </header>

      <form onSubmit={onSubmit} className="relative mb-4">
        <SearchIcon
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3"
          aria-hidden="true"
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value.slice(0, MAX_LEN))}
          placeholder={t('page.search.placeholder')}
          maxLength={MAX_LEN}
          className="w-full rounded-2xl border border-line bg-surface py-3.5 pl-11 pr-4 text-[15px] text-ink shadow-card outline-none transition placeholder:text-ink-3 focus:border-brand focus:shadow-pop"
          aria-label={t('page.search.title')}
        />
      </form>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={requestNearby}
          disabled={nearbyLoading}
          className="flex items-center gap-1.5 rounded-full border border-brand bg-brand px-4 py-1.5 text-[13px] font-semibold text-white transition hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {nearbyLoading ? (
            <>
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              {t('page.search.geoLoading')}
            </>
          ) : (
            <>
              <PinIcon size={14} aria-hidden="true" />
              {t('page.search.nearbyCta')}
            </>
          )}
        </button>
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full border px-4 py-1.5 text-[13px] font-medium tracking-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
              filter === f.id
                ? 'border-ink bg-ink text-white'
                : 'border-line bg-surface text-ink-2 hover:border-line-strong'
            }`}
          >
            {t(`page.search.poiFilters.${f.id}`)}
          </button>
        ))}
        {nearbyItems.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setNearbyItems([])
              setNearbyError(null)
            }}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-medium text-ink-3 hover:text-ink-2"
          >
            {t('page.search.nearbyClear')}
          </button>
        )}
        <p className="ml-auto self-center text-[12px] text-ink-3">
          {filteredFeatures.length} / {POIS.featureCount} {t('page.search.poisLabel')}
        </p>
      </div>
      {nearbyError && (
        <p className="mb-3 rounded-lg border border-warn-soft bg-warn-soft/50 px-3 py-2 text-[11px] text-warn">
          {nearbyError}
        </p>
      )}
      {nearbyItems.length > 0 && !nearbyError && (
        <p className="mb-3 rounded-lg border border-brand-soft bg-brand-soft/40 px-3 py-2 text-[11px] font-medium text-brand">
          {t('page.search.nearbyResultCount', { count: nearbyItems.length })}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:gap-6">
        <div className="relative -mx-5 sm:mx-0">
          <TourMap
            geojson={geoCollection}
            className="h-[360px] w-full overflow-hidden border-y border-line sm:h-[480px] sm:rounded-3xl sm:border lg:h-[620px]"
            onPoiClick={handlePoiClick}
            onBoundsChange={setBounds}
            fitToFeatures={mapFeatureSource !== 'static'}
          />
          <div className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/95 px-3 py-1 text-[12px] font-semibold text-ink-2 shadow-card backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
            VWorld · TourAPI
          </div>
        </div>

        <aside
          ref={asideRef}
          aria-live="polite"
          className="scroll-mt-20 space-y-4 lg:max-h-[620px] lg:overflow-y-auto lg:pr-1"
        >
          {focusFeature ? (
            <>
              <button
                type="button"
                onClick={() => setFocusId(null)}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-ink-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                ← {t('page.search.backToList')}
              </button>
              <section className="nwk-card overflow-hidden p-0">
                {focusFeature.properties.thumbnail && (
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-canvas-2">
                    <img
                      src={focusFeature.properties.thumbnail}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="px-5 pb-4 pt-4">
                  <p className="text-[12px] font-semibold text-brand">
                    {t(`page.search.poiFilters.${focusFeature.properties.typeTag}`)}
                  </p>
                  <p className="mt-1 text-[17px] font-semibold leading-tight tracking-tight text-ink">
                    {focusFeature.properties.title}
                  </p>
                  <p className="mt-1 flex items-start gap-1 text-[13px] leading-snug text-ink-3">
                    <PinIcon size={12} className="mt-[3px] shrink-0" aria-hidden="true" />
                    <span>{focusFeature.properties.addr}</span>
                  </p>
                </div>
              </section>

              {focusAdvisories.length > 0 && (
                <section>
                  <p className="mb-2 text-[12px] font-semibold text-ink-3">
                    {t('page.search.matchedLabel')}
                  </p>
                  <ul className="space-y-2">
                    {focusAdvisories.map(({ category, items }) => {
                      const accent = CATEGORY_ACCENT[category]
                      return (
                        <li
                          key={category}
                          className={`rounded-2xl border border-line ${accent.bg} px-4 py-3`}
                        >
                          <p
                            className={`text-[10px] font-bold uppercase tracking-[0.14em] ${accent.text}`}
                          >
                            {t(`page.place.categories.${category}`)}
                          </p>
                          <ul className="mt-1.5 space-y-1.5">
                            {items.map((a) => (
                              <li key={a.id} className="flex items-start gap-2">
                                <span
                                  className={`mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full ${accent.dot}`}
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[12px] font-semibold leading-snug text-ink">
                                    {t(`advisory.${a.id}.title`)}
                                  </p>
                                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-ink-3">
                                    {t(`advisory.${a.id}.body`)}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )}

              {focusAdvisories.length === 0 && (
                <p className="rounded-2xl border border-dashed border-line bg-canvas-2 px-4 py-3 text-[12px] text-ink-3">
                  {t('page.search.noAdvisory')}
                </p>
              )}
            </>
          ) : (
            <section>
              <p className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-ink-3">
                {keyword
                  ? t('page.search.liveResults', {
                      lang: i18n.language.toUpperCase(),
                      count: liveItems.length,
                    })
                  : t('page.search.visibleCount', { count: visibleFeatures.length })}
                {liveLoading && (
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                )}
              </p>
              {keyword && liveSource === 'mock' && (
                <p className="mb-2 rounded-lg bg-warn-soft/50 px-3 py-1.5 text-[10px] text-warn">
                  {t('page.search.mockNotice')}
                </p>
              )}
              <ul className="space-y-2">
                {(keyword
                  ? liveItems.slice(0, 12).map((it) => ({
                      id: it.id,
                      title: it.title,
                      addr: it.addr,
                      thumb: it.thumbnail ?? null,
                    }))
                  : visibleFeatures.slice(0, 20).map((f) => ({
                      id: f.properties.id,
                      title: f.properties.title,
                      addr: f.properties.addr,
                      thumb: f.properties.thumbnail,
                    }))
                ).map(({ id, title, addr, thumb }) => {
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => setFocusId(id)}
                        className={`nwk-card group flex w-full items-center gap-3 p-3 text-left transition-transform active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                          focusId === id ? 'ring-2 ring-brand' : ''
                        }`}
                      >
                        {thumb ? (
                          <img
                            src={thumb}
                            alt=""
                            loading="lazy"
                            className="h-11 w-11 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                            <PinIcon size={18} aria-hidden="true" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-semibold tracking-tight text-ink">
                            {title}
                          </p>
                          <p className="mt-0.5 truncate text-[12px] text-ink-3">{addr}</p>
                        </div>
                        <ChevronRightIcon
                          size={16}
                          className="shrink-0 text-ink-3"
                          aria-hidden="true"
                        />
                      </button>
                    </li>
                  )
                })}
                {!liveLoading && keyword && liveItems.length === 0 && keyword.length >= 2 && (
                  <li className="rounded-xl border border-dashed border-line bg-canvas-2 px-4 py-3 text-[12px] text-ink-3">
                    {t('page.search.noResultsHint')}
                  </li>
                )}
                {!keyword && visibleFeatures.length === 0 && (
                  <li className="rounded-xl border border-dashed border-line bg-canvas-2 px-4 py-3 text-[12px] text-ink-3">
                    {t('page.search.emptyViewport')}
                  </li>
                )}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
