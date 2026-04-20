import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useRecentChecks } from '../hooks/use-recent-checks'
import { useAuth } from '../hooks/use-auth'
import { uploadReceiptPhoto } from '../services/photo-upload'
import { ocrImage, extractPrices, type ExtractedPrice } from '../utils/menu-ocr'
import { matchExtractedPrices } from '../utils/menu-match'
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

interface PhotoVerdictItem {
  label: string
  paid: number
  entry: PriceEntry | null
  verdict: CheckResult | null
  similarity: number
}

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
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrItems, setOcrItems] = useState<ExtractedPrice[] | null>(null)
  const [showOcrModal, setShowOcrModal] = useState(false)
  const [photoVerdicts, setPhotoVerdicts] = useState<PhotoVerdictItem[] | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const { push: pushRecent, attachPhoto } = useRecentChecks()
  const { user } = useAuth()

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null)
      return
    }
    const url = URL.createObjectURL(photoFile)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photoFile])

  useEffect(() => {
    if (!result) return
    const id = pushRecent({
      entryId: result.entry.id,
      paid: result.paid,
      fairMin: result.fairMin,
      fairMax: result.fairMax,
      deltaPct: result.deltaPct,
      verdict: result.verdict,
      ...(photoUrl ? { photoUrl } : {}),
    })
    if (!photoFile || !user || photoUrl) return
    setPhotoUploading(true)
    setPhotoError(null)
    uploadReceiptPhoto(user.uid, photoFile)
      .then((url) => {
        setPhotoUrl(url)
        attachPhoto(id, url)
      })
      .catch((err) => {
        console.error('photo upload failed', err)
        setPhotoError(t('page.check.photo.uploadError'))
      })
      .finally(() => setPhotoUploading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result])

  const items = useMemo(
    () => (category ? PRICE_CATALOG.filter((e) => e.category === category) : []),
    [category],
  )

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items
    const q = query.trim().toLowerCase()
    return items.filter((e) => t(`catalog.${e.id}.name`).toLowerCase().includes(q))
  }, [items, query, t])

  // Sort popular items first so they stay at the top of the default view,
  // but still show every catalog entry from the start.
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => Number(Boolean(b.popular)) - Number(Boolean(a.popular))),
    [items],
  )
  const DEFAULT_VISIBLE = 18
  const visibleItems = useMemo(() => {
    if (query) return filteredItems
    if (showAll) return sortedItems
    return sortedItems.slice(0, DEFAULT_VISIBLE)
  }, [query, filteredItems, showAll, sortedItems])
  const hiddenCount = sortedItems.length - DEFAULT_VISIBLE

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
    setPhotoFile(null)
    setPhotoUrl(null)
    setPhotoError(null)
    setPhotoVerdicts(null)
    setOcrLoading(false)
    setOcrItems(null)
    setShowOcrModal(false)
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  const onPickPhoto = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    setPhotoFile(file)
    setPhotoUrl(null)
    setPhotoError(null)
    setPhotoVerdicts(null)
    setOcrItems(null)
    setOcrLoading(true)
    setShowOcrModal(true)
    try {
      const lines = await ocrImage(file)
      const prices = extractPrices(lines)
      setOcrItems(prices)
    } catch (err) {
      console.error('OCR failed', err)
      setPhotoError(t('page.check.photo.ocrError'))
      setShowOcrModal(false)
    } finally {
      setOcrLoading(false)
    }
  }

  const removeOcrItem = (idx: number) => {
    setOcrItems((prev) => (prev ? prev.filter((_, i) => i !== idx) : prev))
  }

  const analyzeExtracted = () => {
    if (!ocrItems || ocrItems.length === 0) return
    const matched = matchExtractedPrices(ocrItems, t)
    const verdicts: PhotoVerdictItem[] = matched
      .filter((m) => m.entry !== null)
      .map((m) => ({
        label: m.extracted.label,
        paid: m.extracted.price,
        entry: m.entry,
        verdict: m.entry ? checkPrice(m.entry.id, m.extracted.price) : null,
        similarity: m.similarity,
      }))
    setPhotoVerdicts(verdicts)
    setShowOcrModal(false)
  }

  const closeOcrModal = () => {
    setShowOcrModal(false)
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
          <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1">
            <ScaleIcon size={13} className="text-brand" />
            <p className="text-[12px] font-semibold text-brand">{t('page.check.eyebrow')}</p>
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
        <div className="mx-auto max-w-3xl space-y-5">
          <h1 className="text-[24px] font-semibold leading-[1.2] tracking-tight text-ink">
            {t(questionKey)}
          </h1>
          <p className="text-[14px] leading-relaxed text-ink-2">{t('page.check.subhead')}</p>

          <div className="rounded-2xl border border-brand-soft bg-brand-soft/30 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand text-on-brand">
                <TrainIcon size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold tracking-tight text-ink">
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

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
            {PRICE_CATEGORIES.map((c) => {
              const meta = CATEGORY_META[c]
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => onPickCategory(c)}
                  className="nwk-card group flex h-28 flex-col justify-between p-4 text-left transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
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
                    <p className="mt-0.5 text-[12px] text-ink-3">
                      {t(`page.check.categoryHints.${c}`)}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          <div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={onPickPhoto}
              className="hidden"
            />
            {photoPreview ? (
              <div className="rounded-2xl border border-line bg-surface p-3">
                <div className="flex items-start gap-3">
                  <img
                    src={photoPreview}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold tracking-tight text-ink">
                      {t('page.check.photo.attached')}
                    </p>
                    <p className="mt-0.5 text-[12px] text-ink-3">
                      {user ? t('page.check.photo.willUpload') : t('page.check.photo.signInHint')}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="text-[12px] font-semibold text-brand hover:underline"
                      >
                        {t('page.check.photo.replace')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null)
                          if (photoInputRef.current) photoInputRef.current.value = ''
                        }}
                        className="text-[12px] font-medium text-ink-3 hover:text-ink-2"
                      >
                        {t('page.check.photo.remove')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="flex w-full items-center justify-between rounded-2xl border border-dashed border-line bg-canvas-2 px-4 py-3.5 text-left transition-colors hover:border-line-strong hover:bg-surface"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
                    <CameraIcon size={18} />
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold tracking-tight text-ink">
                      {t('page.check.photo.title')}
                    </p>
                    <p className="text-[12px] text-ink-3">{t('page.check.photo.helper')}</p>
                  </div>
                </div>
                <ArrowRightIcon size={14} className="text-ink-3" />
              </button>
            )}

            {photoError && !showOcrModal && (
              <p className="mt-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-[12px] leading-snug text-danger">
                {photoError}
              </p>
            )}

            {photoVerdicts && photoVerdicts.length > 0 && (
              <div className="mt-3 space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[12px] font-semibold text-ink-3">
                    {t('page.check.photo.resultCount', { count: photoVerdicts.length })}
                  </p>
                  {photoVerdicts.filter((v) => v.verdict?.verdict === 'bagaji').length > 0 && (
                    <span className="text-[12px] font-bold uppercase tracking-wider text-danger">
                      {t('page.check.photo.bagajiFound')}
                    </span>
                  )}
                </div>
                <ul className="space-y-2">
                  {photoVerdicts.map((v, idx) => (
                    <li
                      key={`${v.label}-${idx}`}
                      className={`rounded-2xl border px-4 py-3 ${
                        v.verdict ? verdictStyles[v.verdict.verdict].ring : 'border-line bg-surface'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-semibold tracking-tight text-ink">
                            {v.entry ? t(`catalog.${v.entry.id}.name`) : v.label}
                          </p>
                          <p className="mt-0.5 text-[12px] tabular-nums text-ink-3">
                            {formatKrw(v.paid, i18n.language)}
                            {v.entry && v.verdict ? (
                              <>
                                {' · '}
                                {t('page.check.fairHint')}:{' '}
                                {formatKrw(v.verdict.fairMin, i18n.language)}–
                                {formatKrw(v.verdict.fairMax, i18n.language)}
                              </>
                            ) : null}
                          </p>
                        </div>
                        {v.verdict && (
                          <div
                            className={`shrink-0 text-right ${verdictStyles[v.verdict.verdict].label}`}
                          >
                            <p className="text-[13px] font-bold uppercase tracking-wider">
                              {t(`page.check.verdict.${v.verdict.verdict}`)}
                            </p>
                            <p className="text-[13px] font-bold tabular-nums">
                              {formatPct(v.verdict.deltaPct)}
                            </p>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 2 && category && (
        <div className="mx-auto max-w-3xl space-y-4">
          <h1 className="text-[22px] font-semibold leading-[1.2] tracking-tight text-ink sm:text-[24px]">
            {t(questionKey)}
          </h1>

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
                setShowAll(false)
              }}
              placeholder={t('page.check.searchPlaceholder')}
              className="w-full rounded-2xl border border-line bg-surface py-3 pl-11 pr-4 text-[14px] text-ink outline-none focus:border-brand"
            />
          </div>

          <div>
            <p className="mb-2 text-[12px] font-semibold text-ink-3">
              {query
                ? t('page.check.searchResult')
                : showAll || hiddenCount <= 0
                  ? t('page.check.allItems')
                  : t('page.check.quickPick')}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {visibleItems.map((e) => (
                <ItemCard key={e.id} entry={e} onClick={() => onPickItem(e)} lang={i18n.language} />
              ))}
              {visibleItems.length === 0 && (
                <p className="col-span-2 py-6 text-center text-[13px] text-ink-3 sm:col-span-3">
                  {t('page.check.noResults')}
                </p>
              )}
            </div>
          </div>

          {!query && !showAll && hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-full rounded-2xl border border-line bg-surface py-3 text-[13px] font-medium text-ink-2 transition hover:border-line-strong hover:text-ink"
            >
              {t('page.check.showMoreCount', { count: hiddenCount })}
            </button>
          )}
        </div>
      )}

      {step === 3 && entry && (
        <form onSubmit={onSubmitPrice} className="mx-auto max-w-xl space-y-5">
          <div>
            <p className="text-[12px] font-semibold text-ink-3">
              {t(`page.check.categories.${entry.category}`)} · {t('page.check.steps.q3')}
            </p>
            <h1 className="mt-1 text-[24px] font-semibold leading-[1.2] tracking-tight text-ink">
              {t(`catalog.${entry.id}.name`)}
            </h1>
            {entry.unit && <p className="mt-1 text-[12px] text-ink-3">{entry.unit}</p>}
          </div>

          {isTaxi && (
            <div className="space-y-3 rounded-2xl border border-line bg-canvas-2 px-4 py-3.5">
              <p className="text-[12px] font-semibold text-ink-3">
                {t('page.check.form.taxiContext')}
              </p>
              <div>
                <p className="mb-1 text-[12px] font-medium text-ink-3">
                  {t('page.check.form.distance')}
                </p>
                <div className="relative">
                  <input
                    inputMode="decimal"
                    value={km}
                    onChange={(e) => setKm(e.target.value.replace(/[^0-9.]/g, '').slice(0, 6))}
                    placeholder="0.0"
                    className="w-full rounded-xl border border-line bg-surface py-2.5 pl-3 pr-12 text-[16px] font-semibold tabular-nums text-ink outline-none focus:border-brand"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-medium text-ink-3">
                    km
                  </span>
                </div>
              </div>
              <div>
                <p className="mb-1 text-[12px] font-medium text-ink-3">
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
                          ? 'border-ink bg-ink text-on-ink'
                          : 'border-line bg-surface text-ink-2'
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
            <p className="mb-2 text-[12px] font-semibold text-ink-3">
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
                className="w-full rounded-2xl border border-line bg-surface py-5 pl-11 pr-4 text-[28px] font-semibold tabular-nums text-ink outline-none focus:border-brand"
              />
            </div>
            {!isTaxi &&
              (() => {
                const r = getDisplayRange(entry.id, entry.fairMin, entry.fairMax)
                return (
                  <p className="mt-2 text-[12px] text-ink-3">
                    {t('page.check.fairHint')}:{' '}
                    <span className="font-semibold tabular-nums text-ink-2">
                      {formatKrw(r.min, i18n.language)}–{formatKrw(r.max, i18n.language)}
                    </span>
                    {r.isLive && (
                      <span className="ml-1.5 inline-flex items-center rounded-md bg-brand-soft px-1.5 py-0.5 text-[12px] font-bold uppercase tracking-wider text-brand">
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
            className="w-full rounded-2xl bg-ink py-4 text-[15px] font-semibold text-on-ink transition-transform active:scale-[0.99] disabled:opacity-40"
          >
            {t('page.check.form.submit')}
          </button>
        </form>
      )}

      {step === 4 && result && (
        <div className="mx-auto max-w-xl space-y-4">
          <section className={`rounded-3xl border-2 p-5 ${verdictStyles[result.verdict].ring}`}>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-2 w-2 rounded-full ${verdictStyles[result.verdict].dot}`}
              />
              <p
                className={`text-[12px] font-bold uppercase tracking-[0.18em] ${verdictStyles[result.verdict].label}`}
              >
                {t(`page.check.verdict.${result.verdict}`)}
              </p>
            </div>
            <p className="mt-2 text-[22px] font-semibold tracking-tight text-ink">
              {t(`catalog.${result.entry.id}.name`)}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-surface/70 px-4 py-3">
                <p className="text-[12px] font-semibold text-ink-3">
                  {t('page.check.labels.paid')}
                </p>
                <p className="mt-1 text-[18px] font-semibold tabular-nums text-ink">
                  {formatKrw(result.paid, i18n.language)}
                </p>
              </div>
              <div className="rounded-xl bg-surface/70 px-4 py-3">
                <p className="text-[12px] font-semibold text-ink-3">
                  {t('page.check.labels.fair')}
                </p>
                <p className="mt-1 text-[14px] font-semibold tabular-nums text-ink">
                  {formatKrw(result.fairMin, i18n.language)}–
                  {formatKrw(result.fairMax, i18n.language)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-surface/70 px-4 py-3">
              <span className="text-[12px] font-semibold text-ink-3">
                {t('page.check.labels.delta')}
              </span>
              <span
                className={`text-[22px] font-bold tabular-nums ${verdictStyles[result.verdict].label}`}
              >
                {formatPct(result.deltaPct)}
              </span>
            </div>

            {result.verdict !== 'fair' && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-surface/70 px-4 py-3">
                <AlertIcon
                  size={16}
                  className={`mt-0.5 shrink-0 ${verdictStyles[result.verdict].label}`}
                />
                <p className="text-[12px] leading-snug text-ink-2">
                  {t(`page.check.advice.${result.verdict}`)}
                </p>
              </div>
            )}

            {photoPreview && (
              <div className="mt-4 rounded-xl border border-line bg-surface/70 p-3">
                <div className="flex items-start gap-3">
                  <img
                    src={photoUrl ?? photoPreview}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-ink-2">
                      {t('page.check.photo.resultLabel')}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-snug text-ink-3">
                      {photoUploading
                        ? t('page.check.photo.uploading')
                        : photoUrl
                          ? t('page.check.photo.saved')
                          : photoError
                            ? photoError
                            : user
                              ? t('page.check.photo.queued')
                              : t('page.check.photo.localOnly')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {result.source ? (
              <a
                href={result.source.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 block rounded-xl border border-line bg-surface/70 px-4 py-3"
              >
                <p className="text-[12px] font-semibold text-brand">
                  {t('page.check.sourceBadge')}
                </p>
                <p className="mt-0.5 text-[12px] font-medium leading-snug text-ink-2">
                  {result.source.label}
                </p>
                <p className="mt-0.5 text-[12px] leading-snug text-ink-3">
                  {result.source.samples}
                  {t('page.check.sourceSamples')}
                  {result.source.spec ? ` · ${result.source.spec}` : ''}
                </p>
              </a>
            ) : (
              <p className="mt-4 text-[12px] text-ink-3">{t('page.check.sourceNote')}</p>
            )}
          </section>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-2xl border border-line bg-surface py-3.5 text-[13px] font-semibold text-ink transition hover:border-line-strong"
            >
              {t('page.check.again')}
            </button>
            <Link
              to="/kit"
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-ink py-3.5 text-[13px] font-semibold text-on-ink transition-transform active:scale-[0.99]"
            >
              {t('page.check.openKit')}
              <ArrowRightIcon size={14} />
            </Link>
          </div>

          {result.verdict !== 'fair' && (
            <a
              href="tel:1330"
              className="flex items-center justify-between rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3 transition hover:bg-danger/10"
            >
              <div>
                <p className="text-[12px] font-semibold text-danger">
                  {t('page.check.reportLabel')}
                </p>
                <p className="mt-0.5 text-[15px] font-semibold tracking-tight text-ink">
                  {t('page.check.reportTitle')}
                </p>
              </div>
              <span className="text-[18px] font-bold tabular-nums text-danger">1330</span>
            </a>
          )}
        </div>
      )}

      {showOcrModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ocr-modal-title"
          onClick={closeOcrModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-pop sm:max-w-lg sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div className="min-w-0 flex-1">
                <h2
                  id="ocr-modal-title"
                  className="text-[17px] font-semibold tracking-tight text-ink"
                >
                  {t('page.check.photo.modalTitle')}
                </h2>
                <p className="mt-0.5 text-[12px] text-ink-3">
                  {ocrLoading
                    ? t('page.check.photo.analyzingHelper')
                    : t('page.check.photo.modalHelper')}
                </p>
              </div>
              <button
                type="button"
                onClick={closeOcrModal}
                aria-label={t('page.check.photo.close')}
                className="shrink-0 rounded-full p-1.5 text-ink-3 hover:bg-canvas-2 hover:text-ink"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M6 6l12 12M18 6l-12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {ocrLoading ? (
                <div className="flex items-center justify-center gap-3 py-8">
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                  <p className="text-[13px] font-medium text-ink-2">
                    {t('page.check.photo.analyzing')}
                  </p>
                </div>
              ) : !ocrItems || ocrItems.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-[14px] font-semibold text-ink">
                    {t('page.check.photo.noneFound')}
                  </p>
                  <p className="mt-1 text-[12px] leading-snug text-ink-3">
                    {t('page.check.photo.noneFoundHelper')}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {ocrItems.map((item, idx) => (
                    <li key={`${item.label}-${idx}`} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-ink">{item.label}</p>
                        <p className="mt-0.5 text-[12px] font-semibold tabular-nums text-ink-3">
                          {formatKrw(item.price, i18n.language)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeOcrItem(idx)}
                        aria-label={t('page.check.photo.removeItem')}
                        className="shrink-0 rounded-full p-1.5 text-ink-3 hover:bg-canvas-2 hover:text-ink"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M6 6l12 12M18 6l-12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex gap-2 border-t border-line px-5 py-4">
              <button
                type="button"
                onClick={closeOcrModal}
                className="flex-1 rounded-xl border border-line bg-surface py-3 text-[13px] font-semibold text-ink-2 transition hover:border-line-strong hover:text-ink"
              >
                {t('page.check.photo.close')}
              </button>
              <button
                type="button"
                onClick={analyzeExtracted}
                disabled={ocrLoading || !ocrItems || ocrItems.length === 0}
                className="flex-1 rounded-xl bg-ink py-3 text-[13px] font-semibold text-on-ink transition-transform active:scale-[0.99] disabled:opacity-40"
              >
                {t('page.check.photo.analyze')}
              </button>
            </div>
          </div>
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
          <span className="inline-flex shrink-0 items-center rounded-md bg-brand-soft px-1.5 py-0.5 text-[12px] font-bold uppercase tracking-wider text-brand">
            LIVE
          </span>
        )}
      </div>
      {entry.unit && <p className="text-[12px] text-ink-3">{entry.unit}</p>}
      <p className="mt-1 text-[12px] font-medium tabular-nums text-ink-3">
        {entry.inputMode === 'taxi'
          ? t('page.check.byDistance')
          : `${formatKrw(range.min, lang)}–${formatKrw(range.max, lang)}`}
      </p>
    </button>
  )
}
