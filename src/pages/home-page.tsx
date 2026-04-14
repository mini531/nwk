import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapView, type MapMarker } from '../components/map-view'
import { LiveTicker } from '../components/live-ticker'
import { HOTSPOTS } from '../data/hotspots'
import { ADVISORIES, type AdvisoryCategory } from '../data/advisories'
import { useAppStore } from '../stores/app-store'
import { useKstClock } from '../hooks/use-kst-clock'
import {
  ArrowRightIcon,
  CoinIcon,
  GlobeIcon,
  SearchIcon,
  ShieldIcon,
  TrainIcon,
} from '../components/icons'
import type { ComponentType, SVGProps } from 'react'

import bucheonLive from '../data/live-prices-bucheon.json'

const KRW_PER_USD = 1330
const ADVISORY_BY_ID = new Map(ADVISORIES.map((a) => [a.id, a]))

interface PriceCard {
  id: string
  labelKey: string
  krw: number
  live: boolean
}

interface BucheonItem {
  min: number
  max: number
  avg: number
  samples: number
}

const BUCHEON_ITEMS = (bucheonLive as { items: Record<string, BucheonItem> }).items

const livePrice = (key: string, fallback: number): PriceCard['krw'] & number => {
  const row = BUCHEON_ITEMS[key]
  return row ? row.avg : fallback
}

const PRICE_CARDS: PriceCard[] = [
  {
    id: 'americano',
    labelKey: 'page.home.prices.americano',
    krw: livePrice('커피(외식)', 4500),
    live: Boolean(BUCHEON_ITEMS['커피(외식)']),
  },
  {
    id: 'bibimbap',
    labelKey: 'page.home.prices.bibimbap',
    krw: livePrice('비빔밥', 9000),
    live: Boolean(BUCHEON_ITEMS['비빔밥']),
  },
  {
    id: 'samgyeopsal',
    labelKey: 'page.home.prices.samgyeopsal',
    krw: livePrice('삼겹살(외식)', 18000),
    live: Boolean(BUCHEON_ITEMS['삼겹살(외식)']),
  },
  {
    id: 'chicken',
    labelKey: 'page.home.prices.chicken',
    krw: livePrice('튀김닭', 20000),
    live: Boolean(BUCHEON_ITEMS['튀김닭']),
  },
]

const CATEGORY_META: Record<
  AdvisoryCategory,
  {
    Icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>
    bg: string
    fg: string
  }
> = {
  price: { Icon: CoinIcon, bg: 'bg-accent-soft', fg: 'text-accent' },
  transit: { Icon: TrainIcon, bg: 'bg-line', fg: 'text-ink' },
  etiquette: { Icon: GlobeIcon, bg: 'bg-brand-soft', fg: 'text-brand' },
  safety: { Icon: ShieldIcon, bg: 'bg-warn-soft', fg: 'text-warn' },
}

const formatKrw = (v: number, lang: string) => {
  try {
    return new Intl.NumberFormat(lang, {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(v)
  } catch {
    return `₩${v.toLocaleString()}`
  }
}

const formatUsd = (krw: number) => {
  const usd = krw / KRW_PER_USD
  return `$${usd.toFixed(usd < 10 ? 2 : 1)}`
}

export const HomePage = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const kst = useKstClock()
  const setSelectedPlace = useAppStore((s) => s.setSelectedPlace)
  const [activeId, setActiveId] = useState<string>(HOTSPOTS[0].place.id)

  const active = useMemo(
    () => HOTSPOTS.find((h) => h.place.id === activeId) ?? HOTSPOTS[0],
    [activeId],
  )

  const markers: MapMarker[] = useMemo(
    () =>
      HOTSPOTS.map((h) => ({
        id: h.place.id,
        lng: h.place.lng,
        lat: h.place.lat,
        title: h.place.title,
        active: h.place.id === activeId,
      })),
    [activeId],
  )

  const featured = useMemo(
    () =>
      active.featuredAdvisoryIds
        .map((id) => ADVISORY_BY_ID.get(id))
        .filter((a): a is NonNullable<typeof a> => Boolean(a)),
    [active],
  )

  const openFull = () => {
    setSelectedPlace(active.place)
    navigate('/place')
  }

  return (
    <div className="-mx-5 space-y-7 pb-6">
      <section className="px-5 pt-1">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">
            {t('page.home.liveLabel')}
          </p>
          <p className="text-[10px] text-ink-3">{t('page.home.liveNote')}</p>
        </div>
        <LiveTicker />
      </section>

      <section className="px-5">
        <div className="flex items-baseline justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
            {t('page.home.rightNowLabel')}
          </p>
          <p className="flex items-center gap-1.5 text-[11px] tabular-nums text-ink-3">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
            {kst} KST
          </p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {PRICE_CARDS.map((p) => (
            <div key={p.id} className="nwk-card flex flex-col gap-1 px-4 py-3.5">
              <div className="flex items-start justify-between gap-1">
                <p className="text-[22px] font-semibold leading-none tracking-tight tabular-nums text-ink">
                  {formatKrw(p.krw, i18n.language)}
                </p>
                {p.live && (
                  <span className="inline-flex shrink-0 items-center rounded-md bg-brand-soft px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-brand">
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium tabular-nums text-ink-3">
                ≈ {formatUsd(p.krw)}
              </p>
              <p className="mt-0.5 text-[12px] font-medium tracking-tight text-ink-2">
                {t(p.labelKey)}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-ink-3">{t('page.home.pricesFootnote')}</p>

        <div className="-mx-5 mt-4 overflow-x-auto px-5 pb-1">
          <div className="flex min-w-max gap-2">
            {(
              [
                { k: 'fx', v: '₩1,330 / $1' },
                { k: 'emergency', v: '112 · 119' },
                { k: 'plug', v: '220V · C/F' },
                { k: 'water', v: 'OK' },
                { k: 'tipping', v: 'NO' },
                { k: 'tz', v: 'UTC+9' },
              ] as const
            ).map(({ k, v }) => (
              <div
                key={k}
                className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">
                  {t(`page.home.facts.${k}`)}
                </span>
                <span className="text-[12px] font-semibold tabular-nums tracking-tight text-ink">
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5">
        <Link
          to="/kit"
          className="flex items-center justify-between rounded-2xl border border-line bg-white px-4 py-3.5 text-ink transition hover:border-line-strong"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
              {t('page.home.kitLinkLabel')}
            </p>
            <p className="mt-0.5 truncate text-[14px] font-semibold tracking-tight text-ink">
              {t('page.home.kitLinkTitle')}
            </p>
          </div>
          <ArrowRightIcon size={16} className="shrink-0 text-ink-3" />
        </Link>
      </section>

      <section className="space-y-3">
        <div className="px-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
            {t('page.home.matchedLabel')}
          </p>
          <h2 className="mt-1 text-[16px] font-semibold tracking-tight text-ink">
            {t('page.home.matchedTitle')}
          </h2>
        </div>

        <div className="relative">
          <MapView
            center={[active.place.lng, active.place.lat]}
            zoom={10}
            markers={markers}
            className="h-[300px] w-full overflow-hidden border-y border-line"
            onMarkerClick={(id) => setActiveId(id)}
          />
          <div className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-2 shadow-card backdrop-blur">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand" />
            {t('page.home.mapTag')}
          </div>
        </div>

        <div className="-mx-5 overflow-x-auto px-5">
          <div className="flex gap-2">
            {HOTSPOTS.map((h) => {
              const isActive = h.place.id === activeId
              return (
                <button
                  key={h.place.id}
                  type="button"
                  onClick={() => setActiveId(h.place.id)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium tracking-tight transition ${
                    isActive
                      ? 'border-ink bg-ink text-white shadow-pop'
                      : 'border-line bg-white text-ink-2 hover:border-line-strong'
                  }`}
                >
                  {t(h.nameKey)}
                </button>
              )
            })}
          </div>
        </div>

        <div className="px-5">
          <button
            type="button"
            onClick={openFull}
            className="nwk-card group block w-full overflow-hidden p-0 text-left transition-transform active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
                  {t(active.regionKey)}
                </p>
                <p className="mt-0.5 truncate text-[17px] font-semibold tracking-tight text-ink">
                  {t(active.nameKey)}
                </p>
              </div>
              <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium text-brand">
                {t('page.home.openFull')}
                <ArrowRightIcon size={14} />
              </span>
            </div>

            <ul className="divide-y divide-line border-t border-line">
              {featured.map((a) => {
                const meta = CATEGORY_META[a.category]
                return (
                  <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                    <span
                      className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${meta.bg} ${meta.fg}`}
                    >
                      <meta.Icon size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold tracking-tight text-ink">
                        {t(`advisory.${a.id}.title`)}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-ink-3">
                        {t(`advisory.${a.id}.body`)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </button>
        </div>
      </section>

      <section className="px-5">
        <Link
          to="/search"
          className="flex items-center justify-between rounded-2xl border border-line bg-white px-4 py-3 text-ink transition hover:border-line-strong"
        >
          <span className="flex items-center gap-2.5 text-[13px] font-medium text-ink-2">
            <SearchIcon size={16} className="text-ink-3" />
            {t('page.home.searchCta')}
          </span>
          <ArrowRightIcon size={14} className="text-ink-3" />
        </Link>
      </section>

      <section className="mx-5 rounded-2xl border border-line bg-canvas-2 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">
          {t('page.home.sourceLabel')}
        </p>
        <p className="mt-1.5 text-[12px] leading-snug text-ink-2">{t('page.home.sourceBody')}</p>
      </section>
    </div>
  )
}
