import { useTranslation } from 'react-i18next'

export const ProfilePage = () => {
  const { t } = useTranslation()
  return (
    <section className="mx-auto max-w-md">
      <h2 className="text-2xl font-bold text-neutral-900">{t('page.profile.title')}</h2>
      <button className="mt-6 w-full rounded-xl bg-nwk-primary py-3 text-base font-medium text-white shadow-sm active:scale-95">
        {t('page.profile.signin')}
      </button>
    </section>
  )
}
