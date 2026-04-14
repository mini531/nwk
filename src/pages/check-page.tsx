import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  PRICE_CATALOG,
  PRICE_CATEGORIES,
  checkPrice,
  type CheckResult,
  type PriceCategory,
} from '../data/price-catalog'
import { AlertIcon, CameraIcon, ScaleIcon } from '../components/icons'

const verdictStyles = {
  fair: {
    ring: 'border-brand-soft bg-brand-soft/40',
    dot: 'bg-brand',
    label: 'text-brand',
  },
  careful: {
    ring: 'border-warn-soft bg-warn-soft/50',
    dot: 'bg-warn',
    label: 'text-warn',
  },
  bagaji: {
    ring: 'border-danger/40 bg-danger/10',
    dot: 'bg-danger',
    label: 'text-danger',
  },
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
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct}%`
}

export const CheckPage = () => {
  const { t, i18n } = useTranslation()
  const [category, setCategory] = useState<PriceCategory>('food')
  const [itemId, setItemId] = useState<string>('')
  const [priceInput, setPriceInput] = useState<string>('')
  const [kmInput, setKmInput] = useState<string>('')
  const [night, setNight] = useState<boolean>(false)
  const [result, setResult] = useState<CheckResult | null>(null)

  const items = useMemo(() => PRICE_CATALOG.filter((e) => e.category === category), [category])

  const selectedEntry = useMemo(() => PRICE_CATALOG.find((e) => e.id === itemId) ?? null, [itemId])
  const isTaxi = selectedEntry?.inputMode === 'taxi'

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const paid = Number(priceInput.replace(/[^0-9]/g, ''))
    if (!itemId || !Number.isFinite(paid) || paid <= 0) {
      setResult(null)
      return
    }
    if (isTaxi) {
      const km = Number(kmInput.replace(/[^0-9.]/g, ''))
      if (!Number.isFinite(km) || km <= 0) {
        setResult(null)
        return
      }
      setResult(checkPrice(itemId, paid, { km, night }))
      return
    }
    setResult(checkPrice(itemId, paid))
  }

  return (
    <div className="space-y-6 pb-4">
      <header className="space-y-1">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1">
          <ScaleIcon size={13} className="text-brand" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
            {t('page.check.eyebrow')}
          </p>
        </div>
        <h1 className="text-[24px] font-semibold leading-[1.15] tracking-tight text-ink">
          {t('page.check.title')}
        </h1>
        <p className="text-[13px] leading-relaxed text-ink-2">{t('page.check.subhead')}</p>
      </header>

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

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
            {t('page.check.form.category')}
          </p>
          <div className="-mx-5 overflow-x-auto px-5">
            <div className="flex gap-2">
              {PRICE_CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => {
                    setCategory(c)
                    setItemId('')
                    setResult(null)
                  }}
                  className={`shrink-0 rounded-full border px-4 py-1.5 text-[13px] font-medium tracking-tight transition ${
                    category === c
                      ? 'border-ink bg-ink text-white'
                      : 'border-line bg-white text-ink-2'
                  }`}
                >
                  {t(`page.check.categories.${c}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
            {t('page.check.form.item')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {items.map((e) => (
              <button
                type="button"
                key={e.id}
                onClick={() => {
                  setItemId(e.id)
                  setResult(null)
                }}
                className={`rounded-xl border px-3 py-2.5 text-left text-[13px] font-medium tracking-tight transition ${
                  itemId === e.id
                    ? 'border-brand bg-brand-soft text-brand'
                    : 'border-line bg-white text-ink-2'
                }`}
              >
                <span className="block">{t(`catalog.${e.id}.name`)}</span>
                {e.unit && <span className="mt-0.5 block text-[10px] text-ink-3">{e.unit}</span>}
              </button>
            ))}
          </div>
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
                  value={kmInput}
                  onChange={(e) => setKmInput(e.target.value.replace(/[^0-9.]/g, '').slice(0, 6))}
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
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-ink-3">
              ₩
            </span>
            <input
              inputMode="numeric"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
              placeholder="0"
              className="w-full rounded-2xl border border-line bg-white py-3.5 pl-9 pr-4 text-[18px] font-semibold tabular-nums text-ink outline-none focus:border-brand"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!itemId || !priceInput}
          className="w-full rounded-2xl bg-ink py-3.5 text-[15px] font-semibold text-white transition-transform active:scale-[0.99] disabled:opacity-40"
        >
          {t('page.check.form.submit')}
        </button>
      </form>

      {result && (
        <section className={`rounded-3xl border-2 p-5 ${verdictStyles[result.verdict].ring}`}>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${verdictStyles[result.verdict].dot}`}
            />
            <p
              className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
                verdictStyles[result.verdict].label
              }`}
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
              className={`text-[20px] font-bold tabular-nums ${verdictStyles[result.verdict].label}`}
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

          <p className="mt-4 text-[10px] text-ink-3">{t('page.check.sourceNote')}</p>
        </section>
      )}
    </div>
  )
}
