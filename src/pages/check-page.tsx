import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  PRICE_CATALOG,
  PRICE_CATEGORIES,
  checkPrice,
  type CheckResult,
  type PriceCategory,
  type PriceEntry,
} from '../data/price-catalog'
import { getDisplayRange } from '../data/live-price-source'
import {
  AlertIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CameraIcon,
  CoinIcon,
  GlobeIcon,
  PinIcon,
  ScaleIcon,
  SearchIcon,
  ShieldIcon,
  TrainIcon,
} from '../components/icons'
import type { ComponentType, SVGProps } from 'react'

type Step = 1 | 2 | 3 | 4

const CATEGORY_META: Record<
  PriceCategory,
  {
    Icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>
    bg: string
    fg: string
  }
> = {
  food: { Icon: CoinIcon, bg: 'bg-warn-soft', fg: 'text-warn' },
  drink: { Icon: CoinIcon, bg: 'bg-accent-soft', fg: 'text-accent' },
  transit: { Icon: TrainIcon, bg: 'bg-line', fg: 'text-ink' },
  lodging: { Icon: ShieldIcon, bg: 'bg-brand-soft', fg: 'text-brand' },
  tourism: { Icon: GlobeIcon, bg: 'bg-brand-soft', fg: 'text-brand' },
  fee: { Icon: PinIcon, bg: 'bg-warn-soft', fg: 'text-warn' },
}

const verdictStyles = {
  fair: { ring: 'border-brand-soft bg-brand-soft/40', dot: 'bg-brand', label: 'text-brand' },
  careful: { ring: 'border-warn-soft bg-warn-soft/50', dot: 'bg-warn', label: 'text-warn' },
  bagaji: { ring: 'border-danger/40 bg-danger/10', dot: 'bg-danger', label: 'text-danger' },
} as const

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

const formatPct = (delta: number) => {
  const pct = Math.round(delta * 100)
  return `${pct >= 0 ? '+' : ''}${pct}%`
}

export const CheckPage = () => {
  const { t, i18n } = useTranslation()
  const [step, setStep] = useState<Step>(1)
  const [category, setCategory] = useState<PriceCategory | null>(null)
  const [entry, setEntry] = useState<PriceEntry | null>(null)
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [price, setPrice] = useState('')
  const [km, setKm] = useState('')
  const [night, setNight] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)

  const items = useMemo(
    () => (category ? PRICE_CATALOG.filter((e) => e.category === category) : []),
    [category],
  )

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items
    const q = query.trim().toLowerCase()
    return items.filter((e) => t(`catalog.${e.id}.name`).toLowerCase().includes(q))
  }, [items, query, t])

  const popularItems = useMemo(() => items.filter((e) => e.popular), [items])

  const isTaxi = entry?.inputMode === 'taxi'

  const reset = () => {
    setStep(1)
    setCategory(null)
    setEntry(null)
    setQuery('')
    setShowAll(false)
    setPrice('')
    setKm('')
    setNight(false)
    setResult(null)
  }

  const onBack = () => {
    if (step === 4) {
      setResult(null)
      setStep(3)
    } else if (step === 3) {
      setEntry(null)
      setPrice('')
      setKm('')
      setStep(2)
    } else if (step === 2) {
      setCategory(null)
      setQuery('')
      setShowAll(false)
      setStep(1)
    }
  }

  const onPickCategory = (c: PriceCategory) => {
    setCategory(c)
    setStep(2)
  }

  const onPickItem = (e: PriceEntry) => {
    setEntry(e)
    setStep(3)
  }

  const onSubmitPrice = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!entry) return
    const paid = Number(price.replace(/[^0-9]/g, ''))
    if (!Number.isFinite(paid) || paid <= 0) return
    if (isTaxi) {
      const kmNum = Number(km.replace(/[^0-9.]/g, ''))
      if (!Number.isFinite(kmNum) || kmNum <= 0) return
      const r = checkPrice(entry.id, paid, { km: kmNum, night })
      if (r) {
        setResult(r)
        setStep(4)
      }
      return
    }
    const r = checkPrice(entry.id, paid)
    if (r) {
      setResult(r)
      setStep(4)
    }
  }

  const questionKey = useMemo(() => {
    if (!category) return 'page.check.steps.q1'
    return `page.check.steps.q2.${category}`
  }, [category])

  return (
    <div className="space-y-6 pb-4">
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1">
            <ScaleIcon size={13} className="text-brand" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
              {t('page.check.eyebrow')}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map((n) => (
              <span
                key={n}
                className={`h-1.5 rounded-full transition-all ${
                  n === step ? 'w-6 bg-ink' : n < step ? 'w-1.5 bg-ink' : 'w-1.5 bg-line'
                }`}
              />
            ))}
          </div>
        </div>
        {step > 1 && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-ink-3 hover:text-ink-2"
          >
            <ArrowLeftIcon size={14} />
            {t('page.check.back')}
          </button>
        )}
      </header>

      {step === 1 && (
        <div className="space-y-5">
          <h1 className="text-[24px] font-semibold leading-[1.2] tracking-tight text-ink">
            {t(questionKey)}
          </h1>
          <p className="text-[13px] leading-relaxed text-ink-2">{t('page.check.subhead')}</p>

          <div className="rounded-2xl border border-brand-soft bg-brand-soft/30 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand text-white">
                <TrainIcon size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold tracking-tight text-ink">
                  {t('page.check.safeTransit.title')}
                </p>
                <p className="mt-1 text-[12px] leading-snug text-ink-2">
                  {t('page.check.safeTransit.body')}
                </p>
                <button
                  type="button"
                  onClick={() => onPickCategory('transit')}
                  className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-brand hover:underline"
                >
                  {t('page.check.safeTransit.cta')}
                  <ArrowRightIcon size={12} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {PRICE_CATEGORIES.map((c) => {
              const meta = CATEGORY_META[c]
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => onPickCategory(c)}
                  className="nwk-card group flex h-28 flex-col justify-between p-4 text-left transition-transform active:scale-[0.98]"
                >
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-xl ${meta.bg} ${meta.fg}`}
                  >
                    <meta.Icon size={20} />
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold tracking-tight text-ink">
                      {t(`page.check.categories.${c}`)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-3">
                      {t(`page.check.categoryHints.${c}`)}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            disabled
            className="flex w-full items-center justify-between rounded-2xl border border-dashed border-line bg-canvas-2 px-4 py-3.5 text-left"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-ink-3">
                <CameraIcon size={18} />
              </span>
              <div>
                <p className="text-[13px] font-semibold tracking-tight text-ink">
                  {t('page.check.photo.title')}
                </p>
                <p className="text-[11px] text-ink-3">{t('page.check.photo.comingSoon')}</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">
              {t('page.check.photo.soonBadge')}
            </span>
          </button>
        </div>
      )}

      {step === 2 && category && (
        <div className="space-y-5">
          <h1 className="text-[24px] font-semibold leading-[1.2] tracking-tight text-ink">
            {t(questionKey)}
          </h1>

          {popularItems.length > 0 && !query && !showAll && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
                {t('page.check.popular')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {popularItems.map((e) => (
                  <ItemCard
                    key={e.id}
                    entry={e}
                    onClick={() => onPickItem(e)}
                    lang={i18n.language}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="relative">
              <SearchIcon
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value.slice(0, 30))
                  setShowAll(true)
                }}
                placeholder={t('page.check.searchPlaceholder')}
                className="w-full rounded-2xl border border-line bg-white py-3 pl-11 pr-4 text-[14px] text-ink outline-none focus:border-brand"
              />
            </div>
          </div>

          {(query || showAll) && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
                {query ? t('page.check.searchResult') : t('page.check.allItems')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {filteredItems.map((e) => (
                  <ItemCard
                    key={e.id}
                    entry={e}
                    onClick={() => onPickItem(e)}
                    lang={i18n.language}
                  />
                ))}
                {filteredItems.length === 0 && (
                  <p className="col-span-2 py-6 text-center text-[13px] text-ink-3">
                    {t('page.check.noResults')}
                  </p>
                )}
              </div>
            </div>
          )}

          {popularItems.length > 0 && !showAll && !query && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-full rounded-2xl border border-line bg-white py-3 text-[13px] font-medium text-ink-2 hover:border-line-strong"
            >
              {t('page.check.seeAll')} ({items.length})
            </button>
          )}
        </div>
      )}

      {step === 3 && entry && (
        <form onSubmit={onSubmitPrice} className="space-y-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
              {t(`page.check.categories.${entry.category}`)} · {t('page.check.steps.q3')}
            </p>
            <h1 className="mt-1 text-[24px] font-semibold leading-[1.2] tracking-tight text-ink">
              {t(`catalog.${entry.id}.name`)}
            </h1>
            {entry.unit && <p className="mt-1 text-[12px] text-ink-3">{entry.unit}</p>}
          </div>

          {isTaxi && (
            <div className="space-y-3 rounded-2xl border border-line bg-canvas-2 px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
                {t('page.check.form.taxiContext')}
              </p>
              <div>
                <p className="mb-1 text-[11px] font-medium text-ink-3">
                  {t('page.check.form.distance')}
                </p>
                <div className="relative">
                  <input
                    inputMode="decimal"
                    value={km}
                    onChange={(e) => setKm(e.target.value.replace(/[^0-9.]/g, '').slice(0, 6))}
                    placeholder="0.0"
                    className="w-full rounded-xl border border-line bg-white py-2.5 pl-3 pr-12 text-[16px] font-semibold tabular-nums text-ink outline-none focus:border-brand"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-medium text-ink-3">
                    km
                  </span>
                </div>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-medium text-ink-3">
                  {t('page.check.form.timeOfDay')}
                </p>
                <div className="flex gap-2">
                  {(
                    [
                      { v: false, key: 'day' },
                      { v: true, key: 'night' },
                    ] as const
                  ).map(({ v, key }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNight(v)}
                      className={`flex-1 rounded-xl border px-3 py-2 text-[13px] font-medium tracking-tight transition ${
                        night === v
                          ? 'border-ink bg-ink text-white'
                          : 'border-line bg-white text-ink-2'
                      }`}
                    >
                      {t(`page.check.form.${key}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
              {t('page.check.form.price')}
            </p>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[22px] font-semibold text-ink-3">
                ₩
              </span>
              <input
                inputMode="numeric"
                autoFocus
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
                placeholder="0"
                className="w-full rounded-2xl border border-line bg-white py-5 pl-11 pr-4 text-[28px] font-semibold tabular-nums text-ink outline-none focus:border-brand"
              />
            </div>
            {!isTaxi &&
              (() => {
                const r = getDisplayRange(entry.id, entry.fairMin, entry.fairMax)
                return (
                  <p className="mt-2 text-[11px] text-ink-3">
                    {t('page.check.fairHint')}:{' '}
                    <span className="font-semibold tabular-nums text-ink-2">
                      {formatKrw(r.min, i18n.language)}–{formatKrw(r.max, i18n.language)}
                    </span>
                    {r.isLive && (
                      <span className="ml-1.5 inline-flex items-center rounded-md bg-brand-soft px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-brand">
                        LIVE
                      </span>
                    )}
                  </p>
                )
              })()}
          </div>

          <button
            type="submit"
            disabled={!price || (isTaxi && !km)}
            className="w-full rounded-2xl bg-ink py-4 text-[15px] font-semibold text-white transition-transform active:scale-[0.99] disabled:opacity-40"
          >
            {t('page.check.form.submit')}
          </button>
        </form>
      )}

      {step === 4 && result && (
        <div className="space-y-4">
          <section className={`rounded-3xl border-2 p-5 ${verdictStyles[result.verdict].ring}`}>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-2 w-2 rounded-full ${verdictStyles[result.verdict].dot}`}
              />
              <p
                className={`text-[11px] font-bold uppercase tracking-[0.18em] ${verdictStyles[result.verdict].label}`}
              >
                {t(`page.check.verdict.${result.verdict}`)}
              </p>
            </div>
            <p className="mt-2 text-[22px] font-semibold tracking-tight text-ink">
              {t(`catalog.${result.entry.id}.name`)}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/70 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">
                  {t('page.check.labels.paid')}
                </p>
                <p className="mt-1 text-[18px] font-semibold tabular-nums text-ink">
                  {formatKrw(result.paid, i18n.language)}
                </p>
              </div>
              <div className="rounded-xl bg-white/70 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">
                  {t('page.check.labels.fair')}
                </p>
                <p className="mt-1 text-[14px] font-semibold tabular-nums text-ink">
                  {formatKrw(result.fairMin, i18n.language)}–
                  {formatKrw(result.fairMax, i18n.language)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-white/70 px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                {t('page.check.labels.delta')}
              </span>
              <span
                className={`text-[22px] font-bold tabular-nums ${verdictStyles[result.verdict].label}`}
              >
                {formatPct(result.deltaPct)}
              </span>
            </div>

            {result.verdict !== 'fair' && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-white/70 px-4 py-3">
                <AlertIcon
                  size={16}
                  className={`mt-0.5 shrink-0 ${verdictStyles[result.verdict].label}`}
                />
                <p className="text-[12px] leading-snug text-ink-2">
                  {t(`page.check.advice.${result.verdict}`)}
                </p>
              </div>
            )}

            {result.source ? (
              <a
                href={result.source.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 block rounded-xl border border-line bg-white/70 px-4 py-3"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-brand">
                  {t('page.check.sourceBadge')}
                </p>
                <p className="mt-0.5 text-[11px] font-medium leading-snug text-ink-2">
                  {result.source.label}
                </p>
                <p className="mt-0.5 text-[10px] leading-snug text-ink-3">
                  {result.source.samples}
                  {t('page.check.sourceSamples')}
                  {result.source.spec ? ` · ${result.source.spec}` : ''}
                </p>
              </a>
            ) : (
              <p className="mt-4 text-[10px] text-ink-3">{t('page.check.sourceNote')}</p>
            )}
          </section>

          <button
            type="button"
            onClick={reset}
            className="w-full rounded-2xl border border-line bg-white py-3.5 text-[14px] font-semibold text-ink transition hover:border-line-strong"
          >
            {t('page.check.again')}
          </button>
        </div>
      )}
    </div>
  )
}

const ItemCard = ({
  entry,
  onClick,
  lang,
}: {
  entry: PriceEntry
  onClick: () => void
  lang: string
}) => {
  const { t } = useTranslation()
  const range = getDisplayRange(entry.id, entry.fairMin, entry.fairMax)
  return (
    <button
      type="button"
      onClick={onClick}
      className="nwk-card flex flex-col items-start gap-1 p-3.5 text-left transition-transform active:scale-[0.98]"
    >
      <div className="flex w-full items-start justify-between gap-1.5">
        <p className="flex-1 text-[14px] font-semibold leading-tight tracking-tight text-ink">
          {t(`catalog.${entry.id}.name`)}
        </p>
        {range.isLive && (
          <span className="inline-flex shrink-0 items-center rounded-md bg-brand-soft px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-brand">
            LIVE
          </span>
        )}
      </div>
      {entry.unit && <p className="text-[10px] text-ink-3">{entry.unit}</p>}
      <p className="mt-1 text-[11px] font-medium tabular-nums text-ink-3">
        {entry.inputMode === 'taxi'
          ? t('page.check.byDistance')
          : `${formatKrw(range.min, lang)}–${formatKrw(range.max, lang)}`}
      </p>
    </button>
  )
}
