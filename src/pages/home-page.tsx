import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRightIcon,
  CoinIcon,
  GlobeIcon,
  PinIcon,
  ShieldIcon,
  SparkIcon,
  TrainIcon,
} from '../components/icons'
import { useAppStore } from '../stores/app-store'
import { matchAdvisories, groupByCategory } from '../utils/match-advisories'
import type { AdvisoryCategory } from '../data/advisories'
import type { TourSearchItem } from '../utils/api'
import type { ComponentType, SVGProps } from 'react'

const SAMPLE_PLACE: TourSearchItem = {
  id: 'sample-gyeongbokgung',
  title: '경복궁 Gyeongbokgung Palace',
  addr: '서울특별시 종로구 사직로 161',
  lat: 37.579617,
  lng: 126.977041,
}

const CATEGORY_ICON: Record<
  AdvisoryCategory,
  { Icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>; tone: string }
> = {
  price: { Icon: CoinIcon, tone: 'text-accent bg-accent-soft' },
  transit: { Icon: TrainIcon, tone: 'text-ink bg-line' },
  etiquette: { Icon: GlobeIcon, tone: 'text-brand bg-brand-soft' },
  safety: { Icon: ShieldIcon, tone: 'text-warn bg-warn-soft' },
}

export const HomePage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setSelectedPlace = useAppStore((s) => s.setSelectedPlace)

  const sampleGroups = useMemo(() => {
    const all = matchAdvisories(SAMPLE_PLACE)
    return groupByCategory(all).slice(0, 4)
  }, [])

  const openSample = () => {
    setSelectedPlace(SAMPLE_PLACE)
    navigate('/place')
  }

  return (
    <div className="space-y-8 pb-4">
      <header className="space-y-3">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
          <SparkIcon size={12} />
          {t('page.home.eyebrow')}
        </p>
        <h1 className="text-[30px] font-semibold leading-[1.1] tracking-tight text-ink">
          {t('page.home.headline')}
        </h1>
        <p className="text-[15px] leading-relaxed text-ink-2">{t('page.home.subhead')}</p>
      </header>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
            {t('page.home.sample.eyebrow')}
          </p>
          <button
            type="button"
            onClick={openSample}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:underline"
          >
            {t('page.home.sample.open')}
            <ArrowRightIcon size={14} />
          </button>
        </div>
        <button
          type="button"
          onClick={openSample}
          className="nwk-card block w-full overflow-hidden p-0 text-left transition-transform active:scale-[0.99]"
        >
          <div className="flex items-start gap-4 border-b border-line px-5 py-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
              <PinIcon size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
                {t('page.home.sample.tag')}
              </p>
              <p className="mt-0.5 truncate text-[16px] font-semibold tracking-tight text-ink">
                {SAMPLE_PLACE.title}
              </p>
              <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-ink-3">
                <PinIcon size={12} />
                <span className="truncate">{SAMPLE_PLACE.addr}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px bg-line">
            {sampleGroups.map(({ category, items }) => {
              const meta = CATEGORY_ICON[category]
              const first = items[0]
              return (
                <div key={category} className="bg-white px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className={`grid h-6 w-6 place-items-center rounded-md ${meta.tone}`}>
                      <meta.Icon size={13} />
                    </span>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                      {t(`page.place.categories.${category}`)}
                    </p>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[13px] font-medium leading-snug text-ink">
                    {t(`advisory.${first.id}.title`)}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-[12px] font-medium text-brand">{t('page.home.sample.cta')}</span>
            <ArrowRightIcon size={16} className="text-brand" />
          </div>
        </button>
      </section>

      <Link
        to="/search"
        className="flex items-center justify-between rounded-2xl border border-line bg-white px-5 py-4 text-ink transition-transform active:scale-[0.99] hover:border-line-strong"
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
            {t('page.home.searchEyebrow')}
          </p>
          <p className="mt-1 text-[15px] font-medium tracking-tight">{t('page.home.searchCta')}</p>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-white">
          <ArrowRightIcon size={16} />
        </span>
      </Link>

      <section>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
          {t('page.home.why.label')}
        </h2>
        <ul className="space-y-2">
          {(['publicData', 'languages', 'offline'] as const).map((key) => (
            <li key={key} className="nwk-card flex items-start gap-3 px-4 py-3.5">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              <div className="flex-1">
                <p className="text-[13px] font-semibold tracking-tight text-ink">
                  {t(`page.home.why.${key}.title`)}
                </p>
                <p className="mt-0.5 text-[12px] leading-snug text-ink-3">
                  {t(`page.home.why.${key}.body`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
