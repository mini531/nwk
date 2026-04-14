import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LangSwitcher } from './lang-switcher'

const tabs = [
  { to: '/', key: 'home', icon: '🏠', end: true },
  { to: '/search', key: 'search', icon: '🔍', end: false },
  { to: '/map', key: 'map', icon: '🗺️', end: false },
  { to: '/profile', key: 'profile', icon: '👤', end: false },
] as const

export const AppLayout = () => {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-50">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-neutral-200 bg-white/90 px-4 backdrop-blur">
        <h1 className="text-lg font-bold text-nwk-primary">{t('app.name')}</h1>
        <LangSwitcher />
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <Outlet />
      </main>

      <nav className="sticky bottom-0 flex h-16 items-center justify-around border-t border-neutral-200 bg-white">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex flex-col items-center text-xs ${isActive ? 'text-nwk-primary' : 'text-neutral-500'}`
            }
          >
            <span className="text-lg">{tab.icon}</span>
            {t(`nav.${tab.key}`)}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
