import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LangSwitcher } from './lang-switcher'
import { CompassIcon, CourseIcon, HomeIcon, ScaleIcon, UserIcon } from './icons'
import { SiteFooter } from './site-footer'
import { useCloudSync } from '../hooks/use-cloud-sync'
import brandLogo from '../assets/logo_brand.png'
import type { ComponentType, SVGProps } from 'react'

interface Tab {
  to: string
  key: 'home' | 'check' | 'courses' | 'tour' | 'profile'
  Icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>
  end: boolean
}

const tabs: Tab[] = [
  { to: '/', key: 'home', Icon: HomeIcon, end: true },
  { to: '/check', key: 'check', Icon: ScaleIcon, end: false },
  { to: '/courses', key: 'courses', Icon: CourseIcon, end: false },
  { to: '/map', key: 'tour', Icon: CompassIcon, end: false },
  { to: '/profile', key: 'profile', Icon: UserIcon, end: false },
]

export const AppLayout = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  useCloudSync()

  // Page identity for remount + scroll-to-top. Keying purely on
  // location.key would remount on every setSearchParams call (e.g. when
  // /map strips the ?course= deep-link param), blowing away the state
  // we just set. Instead we key on pathname + our explicit _remount
  // marker (set by onTabClick on same-path re-clicks), so query-string
  // edits keep the mounted instance alive.
  const remountMarker = (location.state as { _remount?: number } | null | undefined)?._remount ?? 0
  const pageKey = `${location.pathname}|${remountMarker}`

  // Reset scroll position on every navigation. React Router v7 keeps the
  // previous scroll offset on route change, so tapping a deep-list link
  // (e.g. the last course card after scrolling) would land the user on
  // the detail page halfway down. Fires on pageKey change — i.e. true
  // navigation or explicit tab re-click, not query-string edits.
  useEffect(() => {
    const main = document.getElementById('main')
    if (main) main.scrollTop = 0
    if (typeof window !== 'undefined') window.scrollTo(0, 0)
  }, [pageKey])

  // NavLink defaults to a no-op when the target matches the current path.
  // For nav tabs we want a re-click to reset the page to its initial state
  // (e.g. CheckPage step 4 → step 1). Forcing a same-path navigate with a
  // fresh state object changes location.key, which re-mounts <Outlet /> via
  // the key below.
  const onTabClick = useCallback(
    (to: string) => (ev: React.MouseEvent<HTMLAnchorElement>) => {
      if (location.pathname === to) {
        ev.preventDefault()
        navigate(to, { replace: true, state: { _remount: Date.now() } })
      }
    },
    [location.pathname, navigate],
  )

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-3 focus:py-2 focus:text-[13px] focus:font-semibold focus:text-on-ink"
      >
        {t('a11y.skipToContent')}
      </a>

      <header
        className="sticky top-0 z-30 border-b border-line/70 bg-canvas/85 backdrop-blur-md"
        role="banner"
      >
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-5 sm:px-6 lg:px-8">
          <NavLink
            to="/"
            end
            className="inline-flex shrink-0 items-center transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            aria-label={t('a11y.homeLink')}
          >
            <img
              src={brandLogo}
              alt="No Worries Korea"
              width="180"
              height="32"
              className="h-5 w-auto dark:brightness-0 dark:invert sm:h-6"
            />
          </NavLink>
          <nav aria-label={t('a11y.primaryNav')} className="hidden flex-1 justify-center lg:flex">
            <ul className="flex items-center gap-1">
              {tabs.map(({ to, key, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={onTabClick(to)}
                    className={({ isActive }) =>
                      `rounded-full px-3 py-1.5 text-[13px] font-medium tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${
                        isActive
                          ? 'bg-ink text-on-ink'
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
          <div className="flex shrink-0 items-center gap-2">
            <LangSwitcher />
            {/* 모바일 전용: 프로필 아이콘을 하단 탭 대신 헤더 우상단으로 이동.
                하단 탭 라벨이 길어지면서 5칸 간격이 어색해져 4칸으로 축소. */}
            <NavLink
              to="/profile"
              onClick={onTabClick('/profile')}
              aria-label={t('nav.profile')}
              className={({ isActive }) =>
                `grid h-9 w-9 place-items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas lg:hidden ${
                  isActive
                    ? 'border-ink bg-ink text-on-ink'
                    : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink'
                }`
              }
            >
              <UserIcon size={18} />
            </NavLink>
          </div>
        </div>
      </header>

      <main
        id="main"
        className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto pb-16 lg:pb-0"
        role="main"
      >
        {/* flex-1 wrapper pushes the footer to the viewport bottom when
            the routed page is shorter than the screen. */}
        <div className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-5 pt-6 sm:px-6 lg:px-8">
            <Outlet key={pageKey} />
          </div>
        </div>
        {/* Hide footer on /map — the page is full-bleed and the footer
            intrudes on the map view. */}
        {location.pathname !== '/map' && <SiteFooter />}
      </main>

      <nav
        aria-label={t('a11y.primaryNav')}
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line/70 bg-canvas/90 backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto flex h-16 max-w-md items-stretch justify-around px-2">
          {tabs
            .filter((tab) => tab.key !== 'profile')
            .map(({ to, key, Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onTabClick(to)}
                className={({ isActive }) =>
                  `group relative flex flex-1 flex-col items-center justify-center gap-1 text-[12px] font-medium tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
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
