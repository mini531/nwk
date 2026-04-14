import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LangSwitcher } from './lang-switcher'
import { HomeIcon, KitIcon, NwkLogo, ScaleIcon, UserIcon } from './icons'
import type { ComponentType, SVGProps } from 'react'

interface Tab {
  to: string
  key: 'home' | 'check' | 'kit' | 'profile'
  Icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>
  end: boolean
}

const tabs: Tab[] = [
  { to: '/', key: 'home', Icon: HomeIcon, end: true },
  { to: '/check', key: 'check', Icon: ScaleIcon, end: false },
  { to: '/kit', key: 'kit', Icon: KitIcon, end: false },
  { to: '/profile', key: 'profile', Icon: UserIcon, end: false },
]

export const AppLayout = () => {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between gap-3 px-5">
          <div className="flex min-w-0 items-center gap-2">
            <NwkLogo size={22} className="text-ink" />
            <span className="truncate text-[13px] font-semibold tracking-tight text-ink-2">
              No Worries Korea
            </span>
          </div>
          <LangSwitcher />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="mx-auto max-w-md px-5 pt-6">
          <Outlet />
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line/70 bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-md items-stretch justify-around px-2">
          {tabs.map(({ to, key, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium tracking-tight transition-colors ${
                  isActive ? 'text-brand' : 'text-ink-3 hover:text-ink-2'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 1.9 : 1.6} />
                  <span>{t(`nav.${key}`)}</span>
                  <span
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
