import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { tourSearch, type TourSearchItem } from '../utils/api'

const MAX_LEN = 50
const SAFE_RE = /[<>"'`;{}\\]/g

export const SearchPage = () => {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const [items, setItems] = useState<TourSearchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'live' | 'mock' | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const keyword = q.replace(SAFE_RE, '').trim().slice(0, MAX_LEN)
    if (!keyword) return
    setLoading(true)
    setError(null)
    try {
      const res = await tourSearch({ keyword })
      setItems(res.data.items)
      setSource(res.data.source)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'error')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto max-w-md">
      <h2 className="text-2xl font-bold text-neutral-900">{t('page.search.title')}</h2>
      <form onSubmit={onSubmit} className="mt-4">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value.slice(0, MAX_LEN))}
          placeholder={t('page.search.placeholder')}
          maxLength={MAX_LEN}
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-nwk-primary"
        />
      </form>

      {loading && <p className="mt-4 text-sm text-neutral-500">{t('page.search.loading')}</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {source === 'mock' && (
        <p className="mt-3 text-xs text-amber-600">{t('page.search.mockNotice')}</p>
      )}

      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
            <p className="font-medium text-neutral-900">{item.title}</p>
            <p className="mt-1 text-sm text-neutral-500">{item.addr}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
