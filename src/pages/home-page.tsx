import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BagajiHero } from '../components/bagaji-hero'
import { HOTSPOTS, hotspotName, hotspotAddr } from '../data/hotspots'
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
import gangwonCpi from '../data/live-cpi-gangwon.json'

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

interface CpiSnapshot {
  latest: { month: string; personalService: number } | null
  yoyPct: number | null
  momPct: number | null
}
const CPI = gangwonCpi as CpiSnapshot

const livePrice = (key: string, fallback: number): number => {
  const row = BUCHEON_ITEMS[key]
  return row ? row.avg : fallback
}

// Rotating pool — a fresh set of 4 shows on each home render so the
// dashboard doesn't feel static between visits.
const PRICE_POOL: PriceCard[] = [
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
  {
    id: 'kimchi_jjigae',
    labelKey: 'page.home.prices.kimchi_jjigae',
    krw: livePrice('김치찌개', 8000),
    live: Boolean(BUCHEON_ITEMS['김치찌개']),
  },
  {
    id: 'naengmyeon',
    labelKey: 'page.home.prices.naengmyeon',
    krw: livePrice('냉면', 9500),
    live: Boolean(BUCHEON_ITEMS['냉면']),
  },
  {
    id: 'samgyetang',
    labelKey: 'page.home.prices.samgyetang',
    krw: livePrice('삼계탕', 16000),
    live: Boolean(BUCHEON_ITEMS['삼계탕']),
  },
  {
    id: 'tangsuyuk',
    labelKey: 'page.home.prices.tangsuyuk',
    krw: livePrice('탕수육', 22000),
    live: Boolean(BUCHEON_ITEMS['탕수육']),
  },
  {
    id: 'donkatsu',
    labelKey: 'page.home.prices.donkatsu',
    krw: livePrice('돈까스', 9000),
    live: Boolean(BUCHEON_ITEMS['돈까스']),
  },
  {
    id: 'jajangmyeon',
    labelKey: 'page.home.prices.jajangmyeon',
    krw: livePrice('짜장면', 7000),
    live: Boolean(BUCHEON_ITEMS['짜장면']),
  },
]

const pickRotation = (pool: PriceCard[], size: number): PriceCard[] => {
  const idxs = new Set<number>()
  while (idxs.size < Math.min(size, pool.length)) {
    idxs.add(Math.floor(Math.random() * pool.length))
  }
  return Array.from(idxs).map((i) => pool[i])
}

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

  const featured = useMemo(
    () =>
      active.featuredAdvisoryIds
        .map((id) => ADVISORY_BY_ID.get(id))
        .filter((a): a is NonNullable<typeof a> => Boolean(a)),
    [active],
  )

  const openFull = () => {
    setSelectedPlace(active.place)
    navigate('/map')
  }

  // Randomized once per page mount so a revisit shows a different set.
  const priceCards = useMemo(() => pickRotation(PRICE_POOL, 4), [])

  return (
    <div className="pb-8">
      <BagajiHero />
      <div className="mt-10 lg:grid lg:grid-cols-12 lg:gap-10">
        <div className="space-y-8 lg:col-span-5 lg:space-y-10 xl:col-span-4">
          <section>
            <div className="flex items-baseline justify-between">
              <p className="text-[13px] font-semibold text-brand">{t('page.home.rightNowLabel')}</p>
              <p className="flex items-center gap-1.5 text-[12px] tabular-nums text-ink-3">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                {kst} KST
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
              {priceCards.map((p) => (
                <div key={p.id} className="nwk-card relative flex flex-col gap-1.5 px-5 py-5 pt-7">
                  {p.live && (
                    <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-brand-soft px-2 py-0.5 text-[12px] font-bold uppercase tracking-wider text-brand">
                      LIVE
                    </span>
                  )}
                  <p className="nwk-display text-[26px] tabular-nums text-ink">
                    {formatKrw(p.krw, i18n.language)}
                  </p>
                  <p className="text-[12px] font-medium tabular-nums text-ink-3">
                    ≈ {formatUsd(p.krw)}
                  </p>
                  <p className="mt-1 text-[14px] font-medium tracking-tight text-ink-2">
                    {t(p.labelKey)}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-ink-3">{t('page.home.pricesFootnote')}</p>

            {CPI.latest && CPI.yoyPct !== null && (
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-line bg-surface px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-ink-3">{t('page.home.cpiLabel')}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-ink-2">
                    {CPI.latest.month.slice(0, 7)} · {t('page.home.cpiBody')}
                  </p>
                </div>
                <div
                  className={`ml-3 shrink-0 text-[22px] font-bold tabular-nums ${
                    CPI.yoyPct >= 3 ? 'text-warn' : 'text-brand'
                  }`}
                >
                  {CPI.yoyPct >= 0 ? '+' : ''}
                  {CPI.yoyPct.toFixed(1)}%
                </div>
              </div>
            )}

            <div className="mt-4 -mx-5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:overflow-visible sm:px-0">
              <div className="flex min-w-max gap-2 sm:min-w-0 sm:flex-wrap">
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
                    className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2"
                  >
                    <span className="text-[12px] font-semibold text-ink-3">
                      {t(`page.home.facts.${k}`)}
                    </span>
                    <span className="text-[14px] font-semibold tabular-nums tracking-tight text-ink">
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <Link
              to="/kit"
              className="flex items-center justify-between rounded-2xl border border-line bg-surface px-5 py-4 text-ink transition hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-ink-3">
                  {t('page.home.kitLinkLabel')}
                </p>
                <p className="mt-0.5 truncate text-[16px] font-semibold tracking-tight text-ink">
                  {t('page.home.kitLinkTitle')}
                </p>
              </div>
              <ArrowRightIcon size={18} className="shrink-0 text-ink-3" aria-hidden="true" />
            </Link>
          </section>
        </div>

        <div className="mt-10 space-y-6 lg:col-span-7 lg:mt-0 xl:col-span-8">
          <section className="space-y-4">
            <div>
              <p className="text-[12px] font-semibold text-ink-3">{t('page.home.matchedLabel')}</p>
              <h2 className="nwk-display mt-1 text-[22px] text-ink sm:text-[26px]">
                {t('page.home.matchedTitle')}
              </h2>
            </div>

            <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:overflow-visible sm:px-0">
              <div className="flex gap-2 sm:flex-wrap">
                {HOTSPOTS.map((h) => {
                  const isActive = h.place.id === activeId
                  const shortName = hotspotName(h, i18n.language)
                    .split(/[[(（]/)[0]
                    .trim()
                  return (
                    <button
                      key={h.place.id}
                      type="button"
                      onClick={() => setActiveId(h.place.id)}
                      className={`shrink-0 rounded-full border px-5 py-2.5 text-[14px] font-medium tracking-tight transition ${
                        isActive
                          ? 'border-ink bg-ink text-on-ink shadow-pop'
                          : 'border-line bg-surface text-ink-2 hover:border-line-strong'
                      }`}
                    >
                      {shortName}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={openFull}
                className="nwk-card nwk-card-hover group block w-full overflow-hidden p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                {active.thumbnail && (
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-canvas-2 sm:aspect-[21/10]">
                    <img
                      src={active.thumbnail}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="pointer-events-none absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-bold tracking-wider text-brand shadow-card backdrop-blur">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                      TourAPI
                    </div>
                    <div className="absolute inset-x-5 bottom-4 text-white">
                      <p className="text-[12px] font-semibold text-white/80">
                        {t(active.regionKey)}
                      </p>
                      <p className="nwk-display mt-0.5 text-[22px] leading-tight text-white">
                        {hotspotName(active, i18n.language)}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start justify-between gap-3 px-6 pb-3 pt-5">
                  <div className="min-w-0 flex-1">
                    {!active.thumbnail && (
                      <>
                        <p className="text-[12px] font-semibold text-ink-3">
                          {t(active.regionKey)}
                        </p>
                        <p className="nwk-display mt-0.5 truncate text-[22px] text-ink">
                          {hotspotName(active, i18n.language)}
                        </p>
                      </>
                    )}
                    <p className="mt-0.5 truncate text-[13px] text-ink-3">
                      {hotspotAddr(active, i18n.language)}
                    </p>
                  </div>
                  <span className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-brand">
                    {t('page.home.openFull')}
                    <ArrowRightIcon size={14} />
                  </span>
                </div>

                <ul className="divide-y divide-line border-t border-line">
                  {featured.map((a) => {
                    const meta = CATEGORY_META[a.category]
                    return (
                      <li key={a.id} className="flex items-start gap-3 px-6 py-4">
                        <span
                          className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${meta.bg} ${meta.fg}`}
                        >
                          <meta.Icon size={17} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold tracking-tight text-ink">
                            {t(`advisory.${a.id}.title`)}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-3">
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

          <section>
            <Link
              to="/search"
              className="group flex items-center justify-between rounded-2xl border-2 border-brand-soft bg-brand-soft/40 px-5 py-5 text-ink transition hover:bg-brand-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-brand">
                  {t('page.home.exploreMapLabel')}
                </p>
                <p className="mt-1 truncate text-[16px] font-semibold tracking-tight text-ink">
                  {t('page.home.exploreMapTitle')}
                </p>
              </div>
              <span className="ml-3 flex shrink-0 items-center gap-2 rounded-full bg-brand px-4 py-2 text-[13px] font-semibold text-on-brand transition group-hover:bg-brand/90">
                <SearchIcon size={14} aria-hidden="true" />
                <ArrowRightIcon size={14} aria-hidden="true" />
              </span>
            </Link>
          </section>

          <section className="rounded-2xl border border-line bg-canvas-2 px-5 py-5">
            <p className="text-[12px] font-semibold text-ink-3">{t('page.home.sourceLabel')}</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">
              {t('page.home.sourceBody')}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
