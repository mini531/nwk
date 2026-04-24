import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { RequireAdmin } from '../components/require-admin'
import { ArrowLeftIcon } from '../components/icons'
import type { PriceCategory, Verdict } from '../data/price-catalog'

interface AdminCheck {
  id: string
  entryId: string
  category: PriceCategory
  paid: number
  fairMin: number
  fairMax: number
  verdict: Verdict
  extra?: string
  emailMasked: string
  hidden: boolean
  createdAt: Date | null
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

const VERDICT_STYLE: Record<Verdict, string> = {
  fair: 'bg-brand-soft text-brand',
  careful: 'bg-warn-soft text-warn',
  bagaji: 'bg-danger/15 text-danger',
}

const Content = () => {
  const { t, i18n } = useTranslation()
  const [items, setItems] = useState<AdminCheck[] | null>(null)
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden' | 'bagaji'>('all')

  useEffect(() => {
    // 최근 200건 구독. 모더레이터가 최신 판정을 먼저 검토한다.
    const q = query(collection(db, 'publicChecks'), orderBy('createdAt', 'desc'), limit(200))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: AdminCheck[] = snap.docs.map((d) => {
          const data = d.data()
          const rawDate = data.createdAt as Timestamp | undefined
          return {
            id: d.id,
            entryId: String(data.entryId ?? ''),
            category: data.category as PriceCategory,
            paid: Number(data.paid ?? 0),
            fairMin: Number(data.fairMin ?? 0),
            fairMax: Number(data.fairMax ?? 0),
            verdict: data.verdict as Verdict,
            extra: typeof data.extra === 'string' ? data.extra : undefined,
            emailMasked: String(data.emailMasked ?? ''),
            hidden: Boolean(data.hidden),
            createdAt: rawDate ? rawDate.toDate() : null,
          }
        })
        setItems(list)
      },
      (err) => {
        console.error('admin publicChecks subscription failed', err)
        setItems([])
      },
    )
    return () => unsub()
  }, [])

  const filtered = useMemo(() => {
    if (!items) return []
    if (filter === 'visible') return items.filter((n) => !n.hidden)
    if (filter === 'hidden') return items.filter((n) => n.hidden)
    if (filter === 'bagaji') return items.filter((n) => n.verdict === 'bagaji')
    return items
  }, [items, filter])

  const toggle = async (c: AdminCheck) => {
    try {
      await updateDoc(doc(db, 'publicChecks', c.id), { hidden: !c.hidden })
    } catch (err) {
      console.error('toggle hidden failed', err)
    }
  }

  const remove = async (c: AdminCheck) => {
    if (!window.confirm(t('page.admin.checks.confirmDelete'))) return
    try {
      await deleteDoc(doc(db, 'publicChecks', c.id))
    } catch (err) {
      console.error('delete check failed', err)
    }
  }

  const formatDate = (d: Date | null) => {
    if (!d) return '—'
    try {
      return new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(d)
    } catch {
      return d.toISOString().slice(0, 16)
    }
  }

  const overpaidPct = (c: AdminCheck): number => {
    const mid = (c.fairMin + c.fairMax) / 2
    if (mid <= 0) return 0
    return Math.round(((c.paid - mid) / mid) * 100)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-6">
      <header className="space-y-1">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink-3 hover:text-ink"
        >
          <ArrowLeftIcon size={14} />
          {t('page.admin.back')}
        </Link>
        <h1 className="nwk-display text-[22px] font-bold tracking-tight text-ink">
          {t('page.admin.checks.title')}
        </h1>
        <p className="text-[12px] text-ink-3">
          {t('page.admin.checks.total', { n: items?.length ?? 0 })}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(['all', 'visible', 'hidden', 'bagaji'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`rounded-full px-3 py-1 text-[12px] font-semibold transition ${
              filter === k ? 'bg-brand text-on-brand' : 'bg-canvas-2/70 text-ink-2 hover:text-ink'
            }`}
          >
            {t(`page.admin.checks.filter.${k}`)}
          </button>
        ))}
      </div>

      {items === null && (
        <p className="py-10 text-center text-[13px] text-ink-3">{t('page.admin.checks.loading')}</p>
      )}
      {items !== null && filtered.length === 0 && (
        <p className="py-10 text-center text-[13px] text-ink-3">{t('page.admin.checks.empty')}</p>
      )}

      <ul className="space-y-2">
        {filtered.map((c) => {
          const pct = overpaidPct(c)
          return (
            <li key={c.id} className="nwk-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${VERDICT_STYLE[c.verdict]}`}
                    >
                      {t(`page.check.verdict.${c.verdict}`)}
                    </span>
                    <span className="rounded-full bg-canvas-2/70 px-2 py-0.5 font-semibold text-ink-2">
                      {c.category}
                    </span>
                    <span className="font-mono text-[10px]">{c.entryId}</span>
                    <span>·</span>
                    <span>{formatDate(c.createdAt)}</span>
                    {c.hidden && (
                      <span className="rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-semibold text-on-ink">
                        {t('page.admin.checks.hiddenTag')}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[14px] font-semibold text-ink">
                    {t(`catalog.${c.entryId}.name`, { defaultValue: c.entryId })}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-ink-2">
                    <span>
                      {t('page.check.labels.paid')}:{' '}
                      <span className="font-semibold tabular-nums text-ink">
                        {formatKrw(c.paid, i18n.language)}
                      </span>
                    </span>
                    <span>
                      {t('page.check.labels.fair')}:{' '}
                      <span className="tabular-nums">
                        {formatKrw(c.fairMin, i18n.language)}–{formatKrw(c.fairMax, i18n.language)}
                      </span>
                    </span>
                    <span
                      className={`font-bold tabular-nums ${
                        c.verdict === 'bagaji'
                          ? 'text-danger'
                          : c.verdict === 'careful'
                            ? 'text-warn'
                            : 'text-brand'
                      }`}
                    >
                      {pct >= 0 ? '+' : ''}
                      {pct}%
                    </span>
                    {c.extra && <span className="text-ink-3">· {c.extra}</span>}
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-ink-3">{c.emailMasked}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => toggle(c)}
                    className="rounded-lg bg-canvas-2/80 px-3 py-1 text-[12px] font-semibold text-ink-2 hover:bg-canvas-2"
                  >
                    {c.hidden ? t('page.admin.checks.show') : t('page.admin.checks.hide')}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(c)}
                    className="rounded-lg bg-danger/10 px-3 py-1 text-[12px] font-semibold text-danger hover:bg-danger/20"
                  >
                    {t('page.admin.checks.delete')}
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export const AdminChecksPage = () => (
  <RequireAdmin>
    <Content />
  </RequireAdmin>
)
