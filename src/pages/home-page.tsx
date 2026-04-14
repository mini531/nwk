import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRightIcon,
  CoinIcon,
  CompassIcon,
  ShieldIcon,
  SparkIcon,
  TrainIcon,
} from '../components/icons'
import type { ComponentType, SVGProps } from 'react'
import { useKstClock } from '../hooks/use-kst-clock'

interface Tile {
  key: 'nearby' | 'prices' | 'transit' | 'tips'
  Icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>
  to: string
  tone: 'brand' | 'accent' | 'warn' | 'ink'
}

const tiles: Tile[] = [
  { key: 'nearby', Icon: CompassIcon, to: '/map', tone: 'brand' },
  { key: 'prices', Icon: CoinIcon, to: '/search', tone: 'accent' },
  { key: 'transit', Icon: TrainIcon, to: '/map', tone: 'ink' },
  { key: 'tips', Icon: ShieldIcon, to: '/search', tone: 'warn' },
]

const toneClasses: Record<Tile['tone'], { bg: string; text: string }> = {
  brand: { bg: 'bg-brand-soft', text: 'text-brand' },
  accent: { bg: 'bg-accent-soft', text: 'text-accent' },
  warn: { bg: 'bg-warn-soft', text: 'text-warn' },
  ink: { bg: 'bg-line', text: 'text-ink' },
}

export const HomePage = () => {
  const { t } = useTranslation()
  const kst = useKstClock()

  return (
    <div className="space-y-8 pb-4">
      <header className="space-y-2">
        <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-ink-3">
          <SparkIcon size={12} />
          {t('page.home.eyebrow')}
        </p>
        <h1 className="text-[28px] font-semibold leading-[1.15] tracking-tight text-ink">
          {t('page.home.headline')}
        </h1>
        <p className="text-[15px] leading-relaxed text-ink-2">{t('page.home.subhead')}</p>
      </header>

      <Link
        to="/search"
        className="group flex items-center justify-between rounded-2xl bg-ink px-5 py-4 text-white shadow-pop transition-transform active:scale-[0.98]"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/60">
            {t('page.home.searchEyebrow')}
          </p>
          <p className="mt-1 text-base font-medium tracking-tight">{t('page.home.searchCta')}</p>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition group-hover:bg-white/15">
          <ArrowRightIcon size={18} />
        </span>
      </Link>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-3">
            {t('page.home.essentials')}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {tiles.map(({ key, Icon, to, tone }) => {
            const c = toneClasses[tone]
            return (
              <Link
                key={key}
                to={to}
                className="nwk-card group flex h-32 flex-col justify-between p-4 transition-transform active:scale-[0.98]"
              >
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${c.bg} ${c.text}`}>
                  <Icon size={22} />
                </span>
                <div>
                  <p className="text-[15px] font-semibold tracking-tight text-ink">
                    {t(`page.home.tiles.${key}.title`)}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-snug text-ink-3">
                    {t(`page.home.tiles.${key}.desc`)}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="nwk-card p-5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-3">
          {t('page.home.todayLabel')}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-ink-3">
              {t('page.home.today.fx')}
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums tracking-tight text-ink-3">—</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-ink-3">
              {t('page.home.today.weather')}
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums tracking-tight text-ink-3">—</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-ink-3">
              {t('page.home.today.time')}
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums tracking-tight text-ink">
              {kst}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
