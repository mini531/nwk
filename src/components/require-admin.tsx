import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/use-auth'
import { useAdminClaim } from '../hooks/use-admin-claim'

export const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading, signIn } = useAuth()
  const { isAdmin, loading: claimLoading } = useAdminClaim()
  const { t } = useTranslation()

  if (authLoading || claimLoading) {
    return (
      <div className="py-16 text-center text-[13px] text-ink-3">{t('page.admin.gate.loading')}</div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <p className="text-[15px] font-semibold text-ink">{t('page.admin.gate.signInTitle')}</p>
        <p className="text-[13px] text-ink-2">{t('page.admin.gate.signInBody')}</p>
        <button
          type="button"
          onClick={() => signIn().catch(() => undefined)}
          className="rounded-xl bg-ink px-5 py-2.5 text-[14px] font-semibold text-on-ink"
        >
          {t('page.admin.gate.signInCta')}
        </button>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md space-y-3 py-16 text-center">
        <p className="text-[15px] font-semibold text-ink">{t('page.admin.gate.deniedTitle')}</p>
        <p className="text-[13px] text-ink-2">{t('page.admin.gate.deniedBody')}</p>
        <p className="text-[11px] font-mono text-ink-3">uid: {user.uid}</p>
        <Link to="/" className="text-[13px] font-semibold text-brand hover:underline">
          {t('page.admin.gate.back')}
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
