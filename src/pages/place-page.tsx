import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '../stores/app-store'
import { matchAdvisories, groupByCategory } from '../utils/match-advisories'
import type { AdvisoryCategory } from '../data/advisories'
import {
  ArrowLeftIcon,
  CoinIcon,
  GlobeIcon,
  HeartIcon,
  PinIcon,
  ShieldIcon,
  TrainIcon,
} from '../components/icons'
import { useFavorites } from '../hooks/use-favorites'
import type { ComponentType, SVGProps } from 'react'

type CategoryMeta = {
  Icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>
  tone: 'accent' | 'ink' | 'brand' | 'warn'
}

const CATEGORY_META: Record<AdvisoryCategory, CategoryMeta> = {
  price: { Icon: CoinIcon, tone: 'accent' },
  transit: { Icon: TrainIcon, tone: 'ink' },
  etiquette: { Icon: GlobeIcon, tone: 'brand' },
  safety: { Icon: ShieldIcon, tone: 'warn' },
}

const TONE: Record<CategoryMeta['tone'], { bg: string; text: string }> = {
  brand: { bg: 'bg-brand-soft', text: 'text-brand' },
  accent: { bg: 'bg-accent-soft', text: 'text-accent' },
  warn: { bg: 'bg-warn-soft', text: 'text-warn' },
  ink: { bg: 'bg-line', text: 'text-ink' },
}

const formatKrw = (value: number, lang: string) => {
  try {
    return new Intl.NumberFormat(lang, {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `₩${value.toLocaleString()}`
  }
}

export const PlacePage = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const place = useAppStore((s) => s.selectedPlace)
  const { isFavorite, toggle } = useFavorites()

  useEffect(() => {
    if (!place) navigate('/search', { replace: true })
  }, [place, navigate])

  const groups = useMemo(() => (place ? groupByCategory(matchAdvisories(place)) : []), [place])

  if (!place) return null

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-4">
      <div>
        <Link
          to="/search"
          className="inline-flex items-center gap-1.5 rounded-lg text-[13px] font-medium text-ink-2 transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <ArrowLeftIcon size={16} aria-hidden="true" />
          {t('page.place.back')}
        </Link>
      </div>

      <header className="nwk-card overflow-hidden p-0">
        {place.thumbnail && (
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-canvas-2 sm:aspect-[21/9]">
            <img
              src={place.thumbnail}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="flex items-start gap-4 p-5">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
            <PinIcon size={22} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[22px] font-semibold tracking-tight text-ink sm:text-[26px]">
              {place.title}
            </h1>
            <p className="mt-1 flex items-start gap-1 text-[13px] leading-snug text-ink-3">
              <PinIcon size={12} className="mt-[3px] shrink-0" aria-hidden="true" />
              <span className="truncate">{place.addr}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              toggle({
                id: place.id,
                title: place.title,
                addr: place.addr,
                thumbnail: place.thumbnail ?? null,
                lat: place.lat,
                lng: place.lng,
              })
            }
            aria-label={t(isFavorite(place.id) ? 'a11y.unfavorite' : 'a11y.favorite')}
            aria-pressed={isFavorite(place.id)}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
              isFavorite(place.id)
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line bg-white text-ink-3 hover:border-line-strong'
            }`}
          >
            <HeartIcon size={18} filled={isFavorite(place.id)} />
          </button>
        </div>
      </header>

      <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-3">
        {t('page.place.matchedLabel')}
      </p>

      <div className="grid gap-5 md:grid-cols-2">
        {groups.map(({ category, items }) => {
          const meta = CATEGORY_META[category]
          const tone = TONE[meta.tone]
          return (
            <section key={category}>
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`grid h-7 w-7 place-items-center rounded-lg ${tone.bg} ${tone.text}`}
                >
                  <meta.Icon size={16} />
                </span>
                <h2 className="text-sm font-semibold tracking-tight text-ink">
                  {t(`page.place.categories.${category}`)}
                </h2>
              </div>
              <ul className="nwk-card divide-y divide-line overflow-hidden">
                {items.map((a) => (
                  <li key={a.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="flex-1 text-[14px] font-medium tracking-tight text-ink">
                        {t(`advisory.${a.id}.title`)}
                      </p>
                      {a.amount && (
                        <span
                          className={`shrink-0 text-[13px] font-semibold tabular-nums ${tone.text}`}
                        >
                          {formatKrw(a.amount.value, i18n.language)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[13px] leading-snug text-ink-3">
                      {t(`advisory.${a.id}.body`)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
