import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import hiloLogo from '../assets/logo_hilocompany.png'

export const SiteFooter = () => {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-line/60 bg-canvas-2/40">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-5 gap-y-2 px-5 py-3 text-[12px] text-ink-3 sm:px-6 lg:px-8">
        <img
          src={hiloLogo}
          alt={t('footer.company')}
          className="h-6 w-auto dark:brightness-0 dark:invert"
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <a href="mailto:mini5031@nate.com" className="font-medium text-ink-2 hover:text-brand">
            mini5031@nate.com
          </a>
          <Link to="/about" className="hover:text-ink-2">
            {t('footer.about')}
          </Link>
          <Link to="/faq" className="hover:text-ink-2">
            {t('footer.faq')}
          </Link>
          <Link to="/kit" className="hover:text-ink-2">
            {t('footer.kit')}
          </Link>
          <span className="font-mono text-[11px]">
            © {year} {t('footer.company')}
          </span>
        </div>
      </div>
    </footer>
  )
}
