import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export const SiteFooter = () => {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-line/60 bg-canvas-2/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="space-y-1">
          <p className="text-[15px] font-semibold tracking-tight text-ink">{t('footer.company')}</p>
          <p className="text-[12px] text-ink-3">{t('footer.tagline')}</p>
        </div>

        <div className="flex flex-col gap-2 text-[12px] text-ink-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
          <span>
            {t('footer.contactLabel')}:{' '}
            <a
              href="mailto:mini5031@nate.com"
              className="font-semibold text-ink-2 hover:text-brand"
            >
              mini5031@nate.com
            </a>
          </span>
          <Link to="/about" className="hover:text-ink-2">
            {t('footer.about')}
          </Link>
          <Link to="/faq" className="hover:text-ink-2">
            {t('footer.faq')}
          </Link>
          <span className="font-mono text-[11px]">
            © {year} {t('footer.company')}
          </span>
        </div>
      </div>
    </footer>
  )
}
