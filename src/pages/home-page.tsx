import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BagajiHero } from '../components/bagaji-hero'
import { Reveal } from '../components/reveal'
import { useCourses } from '../hooks/use-courses'
import { resolveLocalized, type Lang } from '../types/course'
import { useKstClock } from '../hooks/use-kst-clock'
import { ArrowRightIcon, CoinIcon, CompassIcon, ScaleIcon } from '../components/icons'

import bucheonLive from '../data/live-prices-bucheon.json'
import gangwonCpi from '../data/live-cpi-gangwon.json'

const KRW_PER_USD = 1330

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
    id: 'samgyeopsal_200g',
    labelKey: 'page.home.prices.samgyeopsal',
    krw: livePrice('삼겹살(외식)', 18000),
    live: Boolean(BUCHEON_ITEMS['삼겹살(외식)']),
  },
  {
    id: 'fried_chicken_whole',
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

const pickRotation = <T,>(pool: T[], size: number): T[] => {
  const idxs = new Set<number>()
  while (idxs.size < Math.min(size, pool.length)) {
    idxs.add(Math.floor(Math.random() * pool.length))
  }
  return Array.from(idxs).map((i) => pool[i])
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

const Inner = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8">{children}</div>
)

// Standard section heading block — centered eyebrow/title/body.
const SectionHead = ({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string
  title: string
  body: string
}) => (
  <header className="mx-auto max-w-3xl text-center">
    <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-brand">{eyebrow}</p>
    <h2 className="nwk-display mt-3 text-[30px] leading-[1.15] text-ink sm:text-[40px]">{title}</h2>
    <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-ink-2 sm:text-[17px]">
      {body}
    </p>
  </header>
)

export const HomePage = () => {
  const { t, i18n } = useTranslation()
  const kst = useKstClock()
  const courses = useCourses()
  const lang = (i18n.language.slice(0, 2) as Lang) || 'ko'

  const priceCards = useMemo(() => pickRotation(PRICE_POOL, 4), [])
  const coursePreview = useMemo(() => pickRotation(courses, 6), [courses])

  return (
    <div className="-mt-6">
      {/* 히어로 — BagajiHero가 스스로 full-bleed + 내부 max-w-6xl 처리 */}
      <BagajiHero />

      {/* 섹션 1 — 부천 테마 여행 */}
      <Reveal>
        <section className="full-bleed border-t border-line/60 bg-canvas-2/40">
          <Inner>
            <div className="py-16 sm:py-20">
              <SectionHead
                eyebrow={t('page.home.sections.courses.eyebrow')}
                title={t('page.home.sections.courses.title')}
                body={t('page.home.sections.courses.body')}
              />

              <ul className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {coursePreview.map((c) => {
                  const text = resolveLocalized(c.i18n, lang)
                  return (
                    <li key={c.id} className="h-full">
                      <Link
                        to={`/courses/${c.id}`}
                        className="nwk-card nwk-card-hover group flex h-full flex-col overflow-hidden p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                      >
                        {c.heroImage && (
                          <div className="relative aspect-[16/10] w-full overflow-hidden bg-canvas-2">
                            <img
                              src={c.heroImage}
                              alt=""
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-bold tracking-wider text-brand shadow-card backdrop-blur">
                              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                              TourAPI
                            </div>
                            <div className="absolute right-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-[12px] font-bold text-on-ink backdrop-blur">
                              {t(`page.courses.duration.${c.duration}`)}
                            </div>
                          </div>
                        )}
                        <div className="flex flex-1 flex-col gap-2 px-5 py-5">
                          <p className="nwk-display line-clamp-2 min-h-[2.4em] text-[18px] leading-tight text-ink">
                            {text.title}
                          </p>
                          <p className="line-clamp-2 min-h-[2.4em] text-[13px] leading-snug text-ink-3">
                            {text.subtitle ?? ''}
                          </p>
                          <div className="mt-auto flex items-center justify-between border-t border-line pt-2.5 text-[13px] text-ink-3">
                            <span className="inline-flex items-center gap-1">
                              <CoinIcon size={12} />
                              {formatKrw(c.budgetKrw.min, i18n.language)}
                            </span>
                            <span className="font-semibold text-brand">
                              {t('page.courses.bucheonShare', {
                                pct: Math.round(c.bucheonShare * 100),
                              })}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>

              <div className="mt-10 flex justify-center">
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 text-[15px] font-semibold tracking-tight text-on-ink transition hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  {t('page.home.viewAllCourses')}
                  <ArrowRightIcon size={16} />
                </Link>
              </div>
            </div>
          </Inner>
        </section>
      </Reveal>

      {/* 섹션 2 — 바가지 없는 한국 여행을 위한 가격 안내 */}
      <Reveal>
        <section className="full-bleed border-t border-line/60 bg-canvas">
          <Inner>
            <div className="py-16 sm:py-20">
              <SectionHead
                eyebrow={t('page.home.sections.prices.eyebrow')}
                title={t('page.home.sections.prices.title')}
                body={t('page.home.sections.prices.body')}
              />

              <div className="mx-auto mt-10 flex max-w-5xl items-center justify-between">
                <p className="text-[13px] font-semibold text-brand">
                  {t('page.home.rightNowLabel')}
                </p>
                <p className="flex items-center gap-1.5 text-[12px] tabular-nums text-ink-3">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                  {kst} KST
                </p>
              </div>

              <div className="mx-auto mt-4 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-4">
                {priceCards.map((p) => (
                  <Link
                    key={p.id}
                    to={`/check?item=${p.id}`}
                    className="nwk-card nwk-card-hover group relative flex flex-col gap-1.5 px-5 py-5 pt-7 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  >
                    {p.live && (
                      <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-brand-soft px-2 py-0.5 text-[12px] font-bold uppercase tracking-wider text-brand">
                        LIVE
                      </span>
                    )}
                    <p className="nwk-display text-[28px] tabular-nums text-ink">
                      {formatKrw(p.krw, i18n.language)}
                    </p>
                    <p className="text-[12px] font-medium tabular-nums text-ink-3">
                      ≈ {formatUsd(p.krw)}
                    </p>
                    <p className="mt-1 text-[14px] font-medium tracking-tight text-ink-2 group-hover:text-brand">
                      {t(p.labelKey)}
                    </p>
                  </Link>
                ))}
              </div>
              <p className="mx-auto mt-3 max-w-3xl text-center text-[12px] text-ink-3">
                {t('page.home.pricesFootnote')}
              </p>

              {CPI.latest && CPI.yoyPct !== null && (
                <div className="mx-auto mt-6 flex max-w-3xl items-center justify-between rounded-2xl border border-line bg-surface px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-ink-3">
                      {t('page.home.cpiLabel')}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-snug text-ink-2">
                      {CPI.latest.month.slice(0, 7)} · {t('page.home.cpiBody')}
                    </p>
                  </div>
                  <div
                    className={`ml-3 shrink-0 text-[24px] font-bold tabular-nums ${
                      CPI.yoyPct >= 3 ? 'text-warn' : 'text-brand'
                    }`}
                  >
                    {CPI.yoyPct >= 0 ? '+' : ''}
                    {CPI.yoyPct.toFixed(1)}%
                  </div>
                </div>
              )}

              <div className="mx-auto mt-6 flex max-w-4xl flex-wrap justify-center gap-2">
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

              <div className="mt-10 flex justify-center">
                <Link
                  to="/check"
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 text-[15px] font-semibold tracking-tight text-on-ink transition hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  <ScaleIcon size={16} />
                  {t('page.home.sections.prices.checkCta')}
                  <ArrowRightIcon size={16} />
                </Link>
              </div>
            </div>
          </Inner>
        </section>
      </Reveal>

      {/* 섹션 3 — 관광 지도 탐색 */}
      <Reveal>
        <section className="full-bleed border-t border-line/60 bg-brand-soft/40">
          <Inner>
            <div className="py-16 sm:py-20">
              <SectionHead
                eyebrow={t('page.home.sections.map.eyebrow')}
                title={t('page.home.sections.map.title')}
                body={t('page.home.sections.map.body')}
              />
              <div className="mt-10 flex justify-center">
                <Link
                  to="/map"
                  className="inline-flex items-center gap-2 rounded-full bg-brand px-8 py-4 text-[16px] font-semibold tracking-tight text-on-brand transition hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  <CompassIcon size={18} />
                  {t('page.home.sections.map.cta')}
                  <ArrowRightIcon size={16} />
                </Link>
              </div>
            </div>
          </Inner>
        </section>
      </Reveal>

      {/* 섹션 4 — 데이터 출처 */}
      <Reveal>
        <section className="full-bleed border-t border-line/60 bg-canvas-3/50">
          <Inner>
            <div className="py-10 sm:py-12 text-center">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-3">
                {t('page.home.sourceLabel')}
              </p>
              <p className="mx-auto mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-2">
                {t('page.home.sourceBody')}
              </p>
            </div>
          </Inner>
        </section>
      </Reveal>
    </div>
  )
}
