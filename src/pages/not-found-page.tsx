import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ArrowRightIcon, CompassIcon } from '../components/icons'

export const NotFoundPage = () => {
  const { t } = useTranslation()

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-5 py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-soft text-brand">
        <CompassIcon size={28} aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <p className="text-[12px] font-semibold text-ink-3">404</p>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink">
          {t('page.notFound.title')}
        </h1>
        <p className="text-[14px] leading-relaxed text-ink-2">{t('page.notFound.body')}</p>
      </div>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-[14px] font-semibold text-on-ink transition hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        {t('page.notFound.cta')}
        <ArrowRightIcon size={14} aria-hidden="true" />
      </Link>
    </div>
  )
}
