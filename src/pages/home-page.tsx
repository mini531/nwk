import { useTranslation } from 'react-i18next'

const tiles = ['nearby', 'prices', 'transit', 'tips'] as const
const icons: Record<(typeof tiles)[number], string> = {
  nearby: '📍',
  prices: '💰',
  transit: '🚇',
  tips: '⚠️',
}

export const HomePage = () => {
  const { t } = useTranslation()
  return (
    <section className="mx-auto max-w-md">
      <h2 className="text-2xl font-bold text-neutral-900">{t('page.home.title')}</h2>
      <p className="mt-2 text-sm text-neutral-600">{t('app.tagline')}</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {tiles.map((key) => (
          <button
            key={key}
            className="flex h-24 flex-col items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 transition-transform active:scale-95"
          >
            <span className="text-2xl">{icons[key]}</span>
            <span className="mt-1 text-sm font-medium">{t(`page.home.${key}`)}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
