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
  PinIcon,
  ShieldIcon,
  TrainIcon,
} from '../components/icons'
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

  useEffect(() => {
    if (!place) navigate('/search', { replace: true })
  }, [place, navigate])

  const groups = useMemo(() => (place ? groupByCategory(matchAdvisories(place)) : []), [place])

  if (!place) return null

  return (
    <div className="space-y-6 pb-4">
      <div>
        <Link
          to="/search"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink"
        >
          <ArrowLeftIcon size={16} />
          {t('page.place.back')}
        </Link>
      </div>

      <header className="nwk-card p-5">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
            <PinIcon size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[20px] font-semibold tracking-tight text-ink">
              {place.title}
            </h1>
            <p className="mt-1 flex items-start gap-1 text-[13px] leading-snug text-ink-3">
              <PinIcon size={12} className="mt-[3px] shrink-0" />
              <span className="truncate">{place.addr}</span>
            </p>
          </div>
        </div>
      </header>

      <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-3">
        {t('page.place.matchedLabel')}
      </p>

      <div className="space-y-5">
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
