import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LangSwitcher } from './lang-switcher'
import { CompassIcon, HomeIcon, KitIcon, ScaleIcon, UserIcon } from './icons'
import { useCloudSync } from '../hooks/use-cloud-sync'
import type { ComponentType, SVGProps } from 'react'

interface Tab {
  to: string
  key: 'home' | 'check' | 'kit' | 'tour' | 'profile'
  Icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>
  end: boolean
}

const tabs: Tab[] = [
  { to: '/', key: 'home', Icon: HomeIcon, end: true },
  { to: '/check', key: 'check', Icon: ScaleIcon, end: false },
  { to: '/kit', key: 'kit', Icon: KitIcon, end: false },
  { to: '/map', key: 'tour', Icon: CompassIcon, end: false },
  { to: '/profile', key: 'profile', Icon: UserIcon, end: false },
]

export const AppLayout = () => {
  const { t } = useTranslation()
  useCloudSync()

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-3 focus:py-2 focus:text-[13px] focus:font-semibold focus:text-white"
      >
        {t('a11y.skipToContent')}
      </a>

      <header
        className="sticky top-0 z-30 border-b border-line/70 bg-canvas/85 backdrop-blur-md"
        role="banner"
      >
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-6">
            <span className="truncate text-[17px] font-semibold tracking-tight text-ink">
              No Worries Korea
            </span>
            <nav aria-label={t('a11y.primaryNav')} className="hidden lg:block">
              <ul className="flex items-center gap-1">
                {tabs.map(({ to, key, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        `rounded-full px-3 py-1.5 text-[13px] font-medium tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${
                          isActive
                            ? 'bg-ink text-white'
                            : 'text-ink-2 hover:bg-canvas-2 hover:text-ink'
                        }`
                      }
                    >
                      {t(`nav.${key}`)}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <LangSwitcher />
        </div>
      </header>

      <main id="main" className="flex-1 overflow-y-auto pb-24 lg:pb-10" role="main">
        <div className="mx-auto w-full max-w-6xl px-5 pt-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <nav
        aria-label={t('a11y.primaryNav')}
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line/70 bg-canvas/90 backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto flex h-16 max-w-md items-stretch justify-around px-2">
          {tabs.map(({ to, key, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                  isActive ? 'text-brand' : 'text-ink-3 hover:text-ink-2'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 1.9 : 1.6} aria-hidden="true" />
                  <span>{t(`nav.${key}`)}</span>
                  <span
                    aria-hidden="true"
                    className={`absolute -top-px h-[2px] w-8 rounded-full transition-all ${
                      isActive ? 'bg-brand opacity-100' : 'opacity-0'
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
