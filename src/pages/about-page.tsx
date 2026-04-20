import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ChevronRightIcon, NwkLogo, ShieldIcon } from '../components/icons'
import { useInstallPrompt } from '../hooks/use-install-prompt'

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
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brand text-on-brand">
          <NwkLogo size={22} />
        </div>
        <h1 className="text-lg font-semibold tracking-tight text-ink">{t('page.about.title')}</h1>
        <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{t('page.about.tagline')}</p>
        <p className="mt-4 text-[12px] uppercase tracking-[0.14em] text-ink-3">
          {t('page.about.version')} 0.1.0
        </p>
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
                className="mt-4 w-full rounded-xl bg-ink py-3 text-[15px] font-medium tracking-tight text-on-ink active:scale-[0.98]"
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
