import { useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRightIcon, PinIcon, SearchIcon } from '../components/icons'
import { TourMap, type PoiProperties } from '../components/tour-map'
import tourPois from '../data/live-tour-pois.json'
import { ADVISORIES, type AdvisoryCategory } from '../data/advisories'
import { matchAdvisories, groupByCategory } from '../utils/match-advisories'
import type { TourSearchItem } from '../utils/api'

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
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'attraction' | 'culture'>('all')
  const [focusId, setFocusId] = useState<string | null>(null)

  const keyword = q.replace(SAFE_RE, '').trim().slice(0, MAX_LEN).toLowerCase()

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

  const geoCollection: GeoJsonCollection = useMemo(
    () => ({ type: 'FeatureCollection', features: filteredFeatures }),
    [filteredFeatures],
  )

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
        <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
            {t('page.search.eyebrow')}
          </p>
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
          className="w-full rounded-2xl border border-line bg-white py-3.5 pl-11 pr-4 text-[15px] text-ink shadow-card outline-none transition placeholder:text-ink-3 focus:border-brand focus:shadow-pop"
          aria-label={t('page.search.title')}
        />
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full border px-4 py-1.5 text-[13px] font-medium tracking-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
              filter === f.id
                ? 'border-ink bg-ink text-white'
                : 'border-line bg-white text-ink-2 hover:border-line-strong'
            }`}
          >
            {t(`page.search.poiFilters.${f.id}`)}
          </button>
        ))}
        <p className="ml-auto self-center text-[11px] text-ink-3">
          {filteredFeatures.length} / {POIS.featureCount} {t('page.search.poisLabel')}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:gap-6">
        <div className="relative -mx-5 sm:mx-0">
          <TourMap
            geojson={geoCollection}
            className="h-[420px] w-full overflow-hidden border-y border-line sm:h-[520px] sm:rounded-3xl sm:border lg:h-[620px]"
            onPoiClick={(p) => setFocusId(p.id)}
          />
          <div className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-2 shadow-card backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
            VWorld · TourAPI
          </div>
        </div>

        <aside className="space-y-4 lg:max-h-[620px] lg:overflow-y-auto lg:pr-1">
          {focusFeature ? (
            <>
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
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
                    {t(`page.search.poiFilters.${focusFeature.properties.typeTag}`)}
                  </p>
                  <p className="mt-1 text-[17px] font-semibold leading-tight tracking-tight text-ink">
                    {focusFeature.properties.title}
                  </p>
                  <p className="mt-1 flex items-start gap-1 text-[12px] leading-snug text-ink-3">
                    <PinIcon size={12} className="mt-[3px] shrink-0" aria-hidden="true" />
                    <span>{focusFeature.properties.addr}</span>
                  </p>
                </div>
              </section>

              {focusAdvisories.length > 0 && (
                <section>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">
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
          ) : keyword && filteredFeatures.length === 0 ? (
            <div className="nwk-card p-5 text-center">
              <SearchIcon size={24} className="mx-auto text-ink-3" aria-hidden="true" />
              <p className="mt-2 text-[13px] font-semibold tracking-tight text-ink">
                {t('page.search.noResultsTitle')}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-ink-3">
                {t('page.search.noResultsHint')}
              </p>
            </div>
          ) : (
            <div className="nwk-card p-5 text-center">
              <SearchIcon size={24} className="mx-auto text-ink-3" aria-hidden="true" />
              <p className="mt-2 text-[13px] font-semibold tracking-tight text-ink">
                {t('page.search.tapPrompt')}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-ink-3">{t('page.search.tapHint')}</p>
            </div>
          )}

          {keyword && filteredFeatures.length > 0 && (
            <section>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">
                {t('page.search.matchCount', { count: filteredFeatures.length })}
              </p>
              <ul className="space-y-2">
                {filteredFeatures.slice(0, 6).map((f) => (
                  <li key={f.properties.id}>
                    <button
                      type="button"
                      onClick={() => setFocusId(f.properties.id)}
                      className="nwk-card group flex w-full items-center gap-3 p-3 text-left transition-transform active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                    >
                      {f.properties.thumbnail ? (
                        <img
                          src={f.properties.thumbnail}
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
                        <p className="truncate text-[13px] font-semibold tracking-tight text-ink">
                          {f.properties.title}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-ink-3">
                          {f.properties.addr}
                        </p>
                      </div>
                      <ChevronRightIcon
                        size={16}
                        className="shrink-0 text-ink-3"
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
