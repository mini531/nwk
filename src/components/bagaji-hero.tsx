import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LIVE_CASES, type LiveCase } from '../data/live-cases'
import type { PriceCategory } from '../data/price-catalog'
import { subscribeRecentChecks, type PublicCheck } from '../data/public-checks'
import { maskEmail } from '../utils/mask'
import { AlertIcon } from './icons'

const CATEGORY_IMAGE: Record<PriceCategory, string> = {
  food: '/hero/categories/food.webp',
  drink: '/hero/categories/drink.webp',
  transit: '/hero/categories/transit.webp',
  lodging: '/hero/categories/lodging.webp',
  tourism: '/hero/categories/tourism.webp',
  fee: '/hero/categories/fee.webp',
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

const overpaidPct = (c: LiveCase): number => {
  const fairMid = (c.fairLow + c.fairHigh) / 2
  if (fairMid <= 0) return 0
  return Math.round(((c.paid - fairMid) / fairMid) * 100)
}

const RECENT_MAX = 6
const VISIBLE = 3
const ROTATE_MS = 4200

const shuffle = <T,>(arr: T[]): T[] => {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const adaptPublic = (pc: PublicCheck): LiveCase => ({
  id: pc.id,
  email: pc.emailMasked,
  itemKey: `catalog.${pc.entryId}.name`,
  category: pc.category,
  verdict: pc.verdict,
  paid: pc.paid,
  fairLow: pc.fairMin,
  fairHigh: pc.fairMax,
  extra: pc.extra,
})

const BagajiCard = ({
  c,
  index,
  pulseKey,
  t,
  lang,
}: {
  c: LiveCase
  index: number
  pulseKey: number
  t: (key: string) => string
  lang: string
}) => {
  const pct = overpaidPct(c)
  const img = CATEGORY_IMAGE[c.category]
  return (
    <article
      className="group relative isolate flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm transition hover:border-danger/40 sm:p-5"
      style={{ animation: `riseIn 520ms ${index * 90}ms both ease-out` }}
      data-pulse={pulseKey}
    >
      <img
        src={img}
        alt=""
        loading="lazy"
        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60 transition duration-700 group-hover:scale-[1.04] group-hover:opacity-75"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#121110] via-[#121110]/85 to-[#121110]/40" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-transparent via-transparent to-danger/25" />
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-danger/15 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-danger sm:text-[12px]">
          <AlertIcon size={11} />
          {t('page.check.verdict.bagaji')}
        </span>
        <span className="nwk-display whitespace-nowrap text-[22px] leading-none tabular-nums text-danger sm:text-[26px]">
          +{pct}%
        </span>
      </div>
      <p className="nwk-display mt-4 text-[22px] leading-tight tabular-nums text-white sm:text-[26px]">
        {formatKrw(c.paid, lang)}
      </p>
      <p className="mt-1 text-[12px] tabular-nums text-white/55">
        {t('page.home.bagaji.fair')} {formatKrw(c.fairLow, lang)}–{formatKrw(c.fairHigh, lang)}
      </p>
      <div className="mt-4 border-t border-white/10 pt-3">
        <p className="truncate text-[13px] font-medium tracking-tight text-white/90">
          {t(c.itemKey)}
        </p>
        <p className="mt-0.5 truncate text-[12px] text-white/45">
          {maskEmail(c.email)}
          {c.extra ? ` · ${c.extra}` : ''}
        </p>
      </div>
    </article>
  )
}

export const BagajiHero = () => {
  const { t, i18n } = useTranslation()
  const [start, setStart] = useState(0)
  const [pulse, setPulse] = useState(0)
  const [live, setLive] = useState<LiveCase[] | null>(null)

  useEffect(() => {
    return subscribeRecentChecks((items) => {
      const bagaji = items
        .filter((p) => p.verdict === 'bagaji' && p.category)
        .slice(0, RECENT_MAX)
        .map(adaptPublic)
      setLive(bagaji)
    }, 60)
  }, [])

  const recent = useMemo(() => {
    const seed = LIVE_CASES.filter((c) => c.verdict === 'bagaji').slice(0, RECENT_MAX)
    if (!live || live.length === 0) return shuffle(seed)
    const merged = [...live]
    for (const s of seed) {
      if (merged.length >= RECENT_MAX) break
      merged.push(s)
    }
    return merged.slice(0, RECENT_MAX)
  }, [live])

  useEffect(() => {
    if (recent.length <= VISIBLE) return
    const id = window.setInterval(() => {
      setStart((s) => (s + 1) % recent.length)
      setPulse((p) => p + 1)
    }, ROTATE_MS)
    return () => window.clearInterval(id)
  }, [recent.length])

  const desktopWindow = useMemo(() => {
    const out: LiveCase[] = []
    for (let i = 0; i < VISIBLE; i++) {
      out.push(recent[(start + i) % recent.length])
    }
    return out
  }, [recent, start])

  return (
    <section className="full-bleed relative overflow-hidden bg-[#121110] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, currentColor 1px, transparent 1px), radial-gradient(circle at 80% 60%, currentColor 1px, transparent 1px)',
          backgroundSize: '38px 38px, 52px 52px',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-danger/20 blur-3xl"
      />
      <div className="relative mx-auto w-full max-w-6xl px-5 py-9 sm:px-6 sm:py-11 lg:px-8 lg:py-14">
        <div className="flex items-center gap-2">
          <span className="relative inline-flex h-2.5 w-2.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-danger opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-danger" />
          </span>
          <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-danger">
            {t('page.home.bagaji.eyebrow')}
          </span>
        </div>

        <h1 className="nwk-display mt-3 max-w-3xl text-[30px] leading-[1.05] text-white sm:text-[40px] lg:text-[52px]">
          {t('page.home.bagaji.headline')}
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-white/70 sm:text-[15px]">
          {t('page.home.bagaji.sub')}
        </p>

        {/* Desktop: 3열 그리드 회전 */}
        <div
          key={pulse}
          className="mt-7 hidden animate-[fadeIn_500ms_ease-out] gap-3 sm:mt-9 sm:grid sm:grid-cols-3 sm:gap-4"
        >
          {desktopWindow.map((c, idx) => (
            <BagajiCard
              key={`d-${c.id}-${pulse}`}
              c={c}
              index={idx}
              pulseKey={pulse}
              t={t}
              lang={i18n.language}
            />
          ))}
        </div>

        {/* Mobile: 가로 스냅 슬라이드 */}
        <div
          className="-mx-5 mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 sm:hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          {recent.map((c, idx) => (
            <div key={`m-${c.id}`} className="w-[86%] shrink-0 snap-center">
              <BagajiCard c={c} index={idx} pulseKey={0} t={t} lang={i18n.language} />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0.4; }
          to { opacity: 1; }
        }
      `}</style>
    </section>
  )
}
