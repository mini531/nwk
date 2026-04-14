import { useTranslation } from 'react-i18next'
import { PinIcon, SearchIcon } from '../components/icons'

export const MapPage = () => {
  const { t } = useTranslation()
  return (
    <div className="space-y-5 pb-4">
      <header className="space-y-1">
        <h1 className="text-[26px] font-semibold tracking-tight text-ink">{t('page.map.title')}</h1>
        <p className="text-sm text-ink-2">{t('page.map.subhead')}</p>
      </header>

      <div className="relative h-[460px] overflow-hidden rounded-3xl border border-line bg-white shadow-card">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 20%, var(--color-brand-soft), transparent 45%), radial-gradient(circle at 70% 70%, var(--color-accent-soft), transparent 50%), linear-gradient(180deg, var(--color-canvas-2) 0%, var(--color-canvas-3) 100%)',
          }}
        />
        <svg
          className="absolute inset-0 h-full w-full text-ink/8"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div className="absolute inset-x-4 top-4">
          <div className="flex items-center gap-2 rounded-full border border-line bg-white/95 px-4 py-2.5 shadow-card backdrop-blur">
            <SearchIcon size={16} className="text-ink-3" />
            <span className="text-sm text-ink-3">{t('page.map.searchHere')}</span>
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <span className="absolute -inset-6 animate-ping rounded-full bg-brand/20" />
            <span className="relative grid h-12 w-12 place-items-center rounded-full bg-brand text-white shadow-pop">
              <PinIcon size={20} />
            </span>
          </div>
        </div>

        <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-line bg-white/95 px-4 py-3 shadow-card backdrop-blur">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-3">
            {t('page.map.placeholder')}
          </p>
          <p className="mt-1 text-sm text-ink-2">{t('page.map.loading')}</p>
        </div>
      </div>
    </div>
  )
}
