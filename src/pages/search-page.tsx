import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const MAX_LEN = 50

export const SearchPage = () => {
  const { t } = useTranslation()
  const [q, setQ] = useState('')

  return (
    <section className="mx-auto max-w-md">
      <h2 className="text-2xl font-bold text-neutral-900">{t('page.search.title')}</h2>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value.slice(0, MAX_LEN))}
        placeholder={t('page.search.placeholder')}
        maxLength={MAX_LEN}
        className="mt-4 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-nwk-primary"
      />
    </section>
  )
}
