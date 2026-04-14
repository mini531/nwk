import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { tourSearch, type TourSearchItem } from '../utils/api'
import { ChevronRightIcon, PinIcon, SearchIcon } from '../components/icons'
import { useAppStore } from '../stores/app-store'

const MAX_LEN = 50
const SAFE_RE = /[<>"'`;{}\\]/g

const filters = ['all', 'sights', 'food', 'transit'] as const
type Filter = (typeof filters)[number]

export const SearchPage = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const setSelectedPlace = useAppStore((s) => s.setSelectedPlace)
  const [q, setQ] = useState('')
  const [items, setItems] = useState<TourSearchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'live' | 'mock' | null>(null)
  const [active, setActive] = useState<Filter>('all')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const keyword = q.replace(SAFE_RE, '').trim().slice(0, MAX_LEN)
    if (!keyword) return
    setLoading(true)
    setError(null)
    try {
      const res = await tourSearch({ keyword, lang: i18n.language })
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
    <div className="pb-4">
      <header className="mb-6 max-w-3xl space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
            {t('page.search.eyebrow')}
          </p>
        </div>
        <h1 className="text-[28px] font-semibold tracking-tight text-ink sm:text-[32px]">
          {t('page.search.title')}
        </h1>
        <p className="text-[14px] leading-relaxed text-ink-2">{t('page.search.subhead')}</p>
      </header>

      <div className="mx-auto max-w-3xl space-y-6">
        <form onSubmit={onSubmit} className="relative">
          <SearchIcon
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value.slice(0, MAX_LEN))}
            placeholder={t('page.search.placeholder')}
            maxLength={MAX_LEN}
            className="w-full rounded-2xl border border-line bg-white py-3.5 pl-11 pr-4 text-[15px] text-ink shadow-card outline-none transition placeholder:text-ink-3 focus:border-brand focus:shadow-pop"
          />
        </form>

        <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:overflow-visible sm:px-0">
          <div className="flex gap-2 sm:flex-wrap">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActive(f)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium tracking-tight transition ${
                  active === f
                    ? 'border-ink bg-ink text-white'
                    : 'border-line bg-white text-ink-2 hover:border-line-strong'
                }`}
              >
                {t(`page.search.filters.${f}`)}
              </button>
            ))}
          </div>
        </div>

        {source === 'mock' && !loading && items.length > 0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-warn-soft bg-warn-soft/60 px-4 py-3">
            <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-warn" />
            <p className="text-[13px] leading-snug text-warn">{t('page.search.mockNotice')}</p>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="nwk-card h-[88px] animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <p className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        {!loading && items.length === 0 && !error && (
          <div className="nwk-card flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
            <SearchIcon size={28} className="text-ink-3" />
            <p className="text-sm font-medium text-ink">{t('page.search.emptyTitle')}</p>
            <p className="text-[13px] text-ink-3">{t('page.search.emptyHint')}</p>
          </div>
        )}

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedPlace(item)
                  navigate('/place')
                }}
                className="nwk-card group flex w-full items-center gap-4 p-4 text-left transition-transform active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt=""
                    loading="lazy"
                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                    <PinIcon size={22} aria-hidden="true" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold tracking-tight text-ink">
                    {item.title}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-ink-3">
                    <PinIcon size={12} aria-hidden="true" />
                    <span className="truncate">{item.addr}</span>
                  </p>
                </div>
                <ChevronRightIcon size={18} className="shrink-0 text-ink-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
