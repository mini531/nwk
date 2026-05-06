import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  ArrowRightIcon,
  ChevronRightIcon,
  CompassIcon,
  CourseIcon,
  GlobeIcon,
  ScaleIcon,
  ShieldIcon,
  SparkIcon,
} from '../components/icons'
import { useInstallPrompt } from '../hooks/use-install-prompt'
import brandLogo from '../assets/logo_brand.png'

const Stat = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center rounded-2xl bg-canvas-2/70 px-3 py-4 text-center">
    <p className="nwk-display text-[28px] font-bold leading-none text-brand sm:text-[32px]">
      {value}
    </p>
    <p className="mt-1.5 text-[12px] font-semibold text-ink-3">{label}</p>
  </div>
)

export const AboutPage = () => {
  const { t } = useTranslation()
  const { canInstall, installed, promptInstall } = useInstallPrompt()

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-4">
      <header className="flex items-center gap-2 text-ink-3">
        <Link to="/profile" className="inline-flex items-center gap-1 text-sm hover:text-ink">
          <ChevronRightIcon size={16} className="rotate-180" />
          {t('nav.profile')}
        </Link>
      </header>

      <section className="nwk-card p-6 text-center">
        <img
          src={brandLogo}
          alt="No Worries Korea"
          width="260"
          height="44"
          className="mx-auto mb-4 h-9 w-auto dark:brightness-0 dark:invert sm:h-11"
        />
        <h1 className="sr-only">{t('page.about.title')}</h1>
        <p className="text-[14px] leading-relaxed text-ink-2">{t('page.about.tagline')}</p>
        <p className="mt-4 text-[12px] uppercase tracking-[0.14em] text-ink-3">
          {t('page.about.version')} 0.1.0
        </p>
      </section>

      <section className="nwk-card p-5">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand">
          {t('page.about.stats.label')}
        </p>
        <p className="mt-1 text-[15px] font-semibold tracking-tight text-ink">
          {t('page.about.stats.title')}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat value="31" label={t('page.about.stats.courses')} />
          <Stat value="13" label={t('page.about.stats.styles')} />
          <Stat value="5" label={t('page.about.stats.durations')} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Stat value="495+" label={t('page.about.stats.pois')} />
          <Stat value="4" label={t('page.about.stats.languages')} />
        </div>
      </section>

      <section className="nwk-card p-5">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand">
          {t('page.about.pipeline.label')}
        </p>
        <p className="mt-1 text-[15px] font-semibold tracking-tight text-ink">
          {t('page.about.pipeline.title')}
        </p>

        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-line bg-canvas-2/40 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
              {t('page.about.pipeline.sources')}
            </p>
            <div className="mt-3 space-y-3">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                  <GlobeIcon size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-ink">
                    {t('page.about.pipeline.tour.name')}
                  </p>
                  <p className="mt-0.5 break-all text-[11px] leading-snug text-ink-3">
                    {t('page.about.pipeline.tour.endpoints')}
                  </p>
                  <p className="mt-0.5 break-all text-[11px] leading-snug text-ink-3">
                    {t('page.about.pipeline.tour.langs')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                  <ScaleIcon size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-ink">
                    {t('page.about.pipeline.prices.name')}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-snug text-ink-2">
                    {t('page.about.pipeline.prices.body')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-brand text-on-brand"
          >
            <ArrowRightIcon size={14} className="rotate-90" />
          </div>

          <div className="rounded-2xl border border-line bg-canvas-2/40 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
              {t('page.about.pipeline.service')}
            </p>
            <ul className="mt-3 space-y-2 text-[13px] text-ink-2">
              <li className="flex items-center gap-2">
                <CompassIcon size={16} className="shrink-0 text-brand" />
                <span>{t('page.about.pipeline.out.search')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CourseIcon size={16} className="shrink-0 text-brand" />
                <span>{t('page.about.pipeline.out.courses')}</span>
              </li>
              <li className="flex items-center gap-2">
                <ScaleIcon size={16} className="shrink-0 text-brand" />
                <span>{t('page.about.pipeline.out.check')}</span>
              </li>
            </ul>
          </div>

          <div
            aria-hidden="true"
            className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-brand text-on-brand"
          >
            <ArrowRightIcon size={14} className="rotate-90" />
          </div>

          <div className="rounded-2xl border border-line bg-canvas-2/40 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
              {t('page.about.pipeline.feedback')}
            </p>
            <div className="mt-3 flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                <SparkIcon size={16} />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-ink">
                  {t('page.about.pipeline.community.name')}
                </p>
                <p className="mt-0.5 text-[12px] leading-snug text-ink-2">
                  {t('page.about.pipeline.community.body')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="nwk-card p-5">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand">
          {t('page.about.dataSources.label')}
        </p>
        <p className="mt-1 text-[15px] font-semibold tracking-tight text-ink">
          {t('page.about.dataSources.title')}
        </p>
        <ul className="mt-3 space-y-2.5 text-[13px] leading-snug text-ink-2">
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>
              <strong className="text-ink">{t('page.about.dataSources.tour.name')}</strong>
              {' — '}
              {t('page.about.dataSources.tour.body')}
              <br />
              <span className="text-[12px] text-ink-3">
                {t('page.about.dataSources.tour.meta')}
              </span>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-3" />
            <span>
              <strong className="text-ink">{t('page.about.dataSources.kakao.name')}</strong>
              {' — '}
              {t('page.about.dataSources.kakao.body')}
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-3" />
            <span>
              <strong className="text-ink">{t('page.about.dataSources.prices.name')}</strong>
              {' — '}
              {t('page.about.dataSources.prices.body')}
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span>
              <strong className="text-ink">{t('page.about.dataSources.approvals.name')}</strong>
              {' — '}
              {t('page.about.dataSources.approvals.body')}
            </span>
          </li>
        </ul>
      </section>

      {(canInstall || installed) && (
        <section className="nwk-card p-5">
          <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-3">
            {t('page.about.install.eyebrow')}
          </p>
          <p className="mt-1 text-[15px] font-semibold tracking-tight text-ink">
            {installed ? t('page.about.install.done') : t('page.about.install.title')}
          </p>
          {!installed && (
            <>
              <p className="mt-1 text-[13px] text-ink-2">{t('page.about.install.body')}</p>
              <button
                type="button"
                onClick={() => promptInstall().catch((e) => console.error(e))}
                className="mt-4 w-full rounded-xl bg-ink py-3 text-[15px] font-medium tracking-tight text-on-ink transition hover:bg-ink/90 active:scale-[0.98]"
              >
                {t('page.about.install.cta')}
              </button>
            </>
          )}
        </section>
      )}

      <section className="nwk-card p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
            <ShieldIcon size={20} />
          </span>
          <div>
            <p className="text-[15px] font-semibold tracking-tight text-ink">
              {t('page.about.privacy.title')}
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-2">
              {t('page.about.privacy.body')}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
