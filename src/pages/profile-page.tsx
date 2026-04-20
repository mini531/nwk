import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'
import { useFavorites } from '../hooks/use-favorites'
import { useRecentChecks } from '../hooks/use-recent-checks'
import { useTheme, type Theme } from '../hooks/use-theme'
import { useAppStore } from '../stores/app-store'
import {
  ChevronRightIcon,
  HeartIcon,
  LogOutIcon,
  MoonIcon,
  PinIcon,
  ScaleIcon,
  ShieldIcon,
  SunIcon,
  UserIcon,
} from '../components/icons'
import type { TourSearchItem } from '../utils/api'

const initialsOf = (name: string | null | undefined, fallback: string) => {
  const src = (name ?? fallback).trim()
  if (!src) return 'NW'
  const parts = src.split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || src.slice(0, 2).toUpperCase()
}

const formatKrw = (v: number, lang: string) => {
  try {
    return new Intl.NumberFormat(lang, {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(v)
  } catch {
    return `₩${v.toLocaleString()}`
  }
}

const verdictColor: Record<'fair' | 'careful' | 'bagaji', string> = {
  fair: 'text-brand',
  careful: 'text-warn',
  bagaji: 'text-danger',
}

export const ProfilePage = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, loading, signIn, logout } = useAuth()
  const { favorites, remove: removeFavorite, clear: clearFavorites } = useFavorites()
  const { recent, clear: clearRecent } = useRecentChecks()
  const setSelectedPlace = useAppStore((s) => s.setSelectedPlace)
  const { theme, setTheme } = useTheme()

  const openPlace = (fav: (typeof favorites)[number]) => {
    const place: TourSearchItem = {
      id: fav.id,
      title: fav.title,
      addr: fav.addr,
      lat: fav.lat ?? 0,
      lng: fav.lng ?? 0,
      thumbnail: fav.thumbnail ?? undefined,
    }
    setSelectedPlace(place)
    navigate('/map')
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="nwk-card h-32 animate-pulse" />
        <div className="nwk-card h-44 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-4">
      <header>
        <h1 className="text-[26px] font-semibold tracking-tight text-ink">
          {t('page.profile.title')}
        </h1>
      </header>

      {user ? (
        <section className="nwk-card p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-brand text-base font-semibold tracking-wide text-on-brand">
              {initialsOf(user.displayName, user.email ?? user.uid)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold tracking-tight text-ink">
                {user.displayName ?? user.email ?? t('page.profile.anonymous')}
              </p>
              <p className="mt-0.5 truncate text-[13px] text-ink-3">
                {user.email ?? t('page.profile.signedInAs')}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="nwk-card p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-line text-ink-3">
              <UserIcon size={26} aria-hidden="true" />
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold tracking-tight text-ink">
                {t('page.profile.guest')}
              </p>
              <p className="mt-0.5 text-[13px] text-ink-3">{t('page.profile.guestHint')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signIn().catch((e) => console.error(e))}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 text-[15px] font-medium tracking-tight text-on-ink transition hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            {t('page.profile.signin')}
          </button>
        </section>
      )}

      {favorites.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[12px] font-semibold text-ink-3">
              <HeartIcon size={12} className="mr-1 inline-block text-accent" />
              {t('page.profile.favorites.label')} · {favorites.length}
            </p>
            <button
              type="button"
              onClick={clearFavorites}
              className="text-[12px] font-medium text-ink-3 hover:text-ink-2"
            >
              {t('page.profile.clear')}
            </button>
          </div>
          <ul className="space-y-2">
            {favorites.slice(0, 6).map((f) => (
              <li key={f.id}>
                <div className="nwk-card flex items-center gap-3 p-3">
                  <button
                    type="button"
                    onClick={() => openPlace(f)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  >
                    {f.thumbnail ? (
                      <img
                        src={f.thumbnail}
                        alt=""
                        loading="lazy"
                        className="h-11 w-11 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                        <PinIcon size={18} aria-hidden="true" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold tracking-tight text-ink">
                        {f.title}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-ink-3">{f.addr}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFavorite(f.id)}
                    aria-label={t('a11y.unfavorite')}
                    className="shrink-0 rounded-md p-1.5 text-accent hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  >
                    <HeartIcon size={16} filled />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recent.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[12px] font-semibold text-ink-3">
              <ScaleIcon size={12} className="mr-1 inline-block text-brand" />
              {t('page.profile.recent.label')} · {recent.length}
            </p>
            <button
              type="button"
              onClick={clearRecent}
              className="text-[12px] font-medium text-ink-3 hover:text-ink-2"
            >
              {t('page.profile.clear')}
            </button>
          </div>
          <ul className="nwk-card divide-y divide-line overflow-hidden">
            {recent.slice(0, 6).map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                {r.photoUrl ? (
                  <img
                    src={r.photoUrl}
                    alt=""
                    loading="lazy"
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span
                    className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                      r.verdict === 'fair'
                        ? 'bg-brand'
                        : r.verdict === 'careful'
                          ? 'bg-warn'
                          : 'bg-danger'
                    }`}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold tracking-tight text-ink">
                    {t(`catalog.${r.entryId}.name`)}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-ink-3">
                    {formatKrw(r.paid, i18n.language)} · {t(`page.check.verdict.${r.verdict}`)}
                  </p>
                </div>
                <span className={`text-[13px] font-bold tabular-nums ${verdictColor[r.verdict]}`}>
                  {r.deltaPct >= 0 ? '+' : ''}
                  {Math.round(r.deltaPct * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <p className="mb-2 text-[12px] font-semibold text-ink-3">{t('page.profile.themeLabel')}</p>
        <div className="grid grid-cols-3 gap-2">
          {(['light', 'dark', 'system'] as Theme[]).map((t_) => (
            <button
              key={t_}
              type="button"
              onClick={() => setTheme(t_)}
              className={`nwk-card flex items-center justify-center gap-1.5 py-3 text-[12px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                theme === t_ ? 'border-ink text-ink' : 'text-ink-2'
              }`}
              aria-pressed={theme === t_}
            >
              {t_ === 'light' && <SunIcon size={14} aria-hidden="true" />}
              {t_ === 'dark' && <MoonIcon size={14} aria-hidden="true" />}
              {t(`page.profile.theme.${t_}`)}
            </button>
          ))}
        </div>
      </section>

      <section className="nwk-card overflow-hidden">
        <Row icon={<ShieldIcon size={18} />} label={t('page.profile.rows.about')} to="/about" />
      </section>

      {user && (
        <button
          type="button"
          onClick={() => logout().catch((e) => console.error(e))}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface py-3.5 text-sm font-medium tracking-tight text-ink-2 transition hover:border-line-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <LogOutIcon size={16} aria-hidden="true" />
          {t('page.profile.signout')}
        </button>
      )}
    </div>
  )
}

const Row = ({ icon, label, to }: { icon: React.ReactNode; label: string; to?: string }) => {
  const inner = (
    <>
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-canvas text-ink-2">
        {icon}
      </span>
      <span className="flex-1 text-[15px] tracking-tight text-ink">{label}</span>
      <ChevronRightIcon size={18} className="text-ink-3" aria-hidden="true" />
    </>
  )
  const cls =
    'flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset'
  if (to) {
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    )
  }
  return (
    <button type="button" className={cls}>
      {inner}
    </button>
  )
}
