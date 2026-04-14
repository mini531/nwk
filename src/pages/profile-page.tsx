import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/use-auth'

export const ProfilePage = () => {
  const { t } = useTranslation()
  const { user, loading, signIn, logout } = useAuth()

  if (loading) {
    return (
      <section className="mx-auto max-w-md">
        <div className="mt-10 text-center text-sm text-neutral-500">...</div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-md">
      <h2 className="text-2xl font-bold text-neutral-900">{t('page.profile.title')}</h2>

      {user ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
            <p className="text-sm text-neutral-500">{t('page.profile.signedInAs')}</p>
            <p className="mt-1 truncate text-base font-medium text-neutral-900">
              {user.displayName ?? user.email ?? user.uid}
            </p>
          </div>
          <button
            onClick={() => logout()}
            className="w-full rounded-xl border border-neutral-300 bg-white py-3 text-base font-medium text-neutral-700 active:scale-95"
          >
            {t('page.profile.signout')}
          </button>
        </div>
      ) : (
        <button
          onClick={() => signIn().catch((e) => console.error(e))}
          className="mt-6 w-full rounded-xl bg-nwk-primary py-3 text-base font-medium text-white shadow-sm active:scale-95"
        >
          {t('page.profile.signin')}
        </button>
      )}
    </section>
  )
}
