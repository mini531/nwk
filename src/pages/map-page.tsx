import { useTranslation } from 'react-i18next'

export const MapPage = () => {
  const { t } = useTranslation()
  return (
    <section className="mx-auto max-w-md">
      <h2 className="text-2xl font-bold text-neutral-900">{t('page.map.title')}</h2>
      <div className="mt-4 flex h-64 items-center justify-center rounded-2xl bg-neutral-100 text-sm text-neutral-500">
        {t('page.map.loading')}
      </div>
    </section>
  )
}
