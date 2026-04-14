import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'
import {
  ChevronRightIcon,
  GlobeIcon,
  LogOutIcon,
  PinIcon,
  ShieldIcon,
  UserIcon,
} from '../components/icons'

const initialsOf = (name: string | null | undefined, fallback: string) => {
  const src = (name ?? fallback).trim()
  if (!src) return 'NW'
  const parts = src.split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || src.slice(0, 2).toUpperCase()
}

export const ProfilePage = () => {
  const { t } = useTranslation()
  const { user, loading, signIn, logout } = useAuth()

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="nwk-card h-32 animate-pulse" />
        <div className="nwk-card h-44 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-4">
      <header>
        <h1 className="text-[26px] font-semibold tracking-tight text-ink">
          {t('page.profile.title')}
        </h1>
      </header>

      {user ? (
        <section className="nwk-card p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-brand text-base font-semibold tracking-wide text-white">
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
              <UserIcon size={26} />
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
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 text-[15px] font-medium tracking-tight text-white transition-transform active:scale-[0.98]"
          >
            {t('page.profile.signin')}
          </button>
        </section>
      )}

      <section className="nwk-card overflow-hidden">
        <Row icon={<GlobeIcon size={18} />} label={t('page.profile.rows.language')} />
        <Divider />
        <Row icon={<PinIcon size={18} />} label={t('page.profile.rows.saved')} />
        <Divider />
        <Row icon={<ShieldIcon size={18} />} label={t('page.profile.rows.about')} to="/about" />
      </section>

      {user && (
        <button
          type="button"
          onClick={() => logout().catch((e) => console.error(e))}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-white py-3.5 text-sm font-medium tracking-tight text-ink-2 transition hover:border-line-strong hover:text-ink"
        >
          <LogOutIcon size={16} />
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
      <ChevronRightIcon size={18} className="text-ink-3" />
    </>
  )
  const cls = 'flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-canvas'
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

const Divider = () => <div className="mx-5 h-px bg-line" />
