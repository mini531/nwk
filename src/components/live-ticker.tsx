import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LIVE_CASES } from '../data/live-cases'
import type { Verdict } from '../data/price-catalog'

const VERDICT_DOT: Record<Verdict, string> = {
  fair: 'bg-brand',
  careful: 'bg-warn',
  bagaji: 'bg-danger',
}

const maskName = (name: string): string => {
  const chars = Array.from(name)
  if (chars.length <= 2) return chars[0] + '*'
  if (chars.length === 3) return `${chars[0]}*${chars[2]}`
  const middle = '*'.repeat(Math.min(chars.length - 2, 3))
  return `${chars[0]}${middle}${chars[chars.length - 1]}`
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

export const LiveTicker = () => {
  const { t, i18n } = useTranslation()
  const [i, setI] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setI((prev) => (prev + 1) % LIVE_CASES.length)
    }, 3800)
    return () => window.clearInterval(id)
  }, [])

  const c = LIVE_CASES[i]
  const dot = VERDICT_DOT[c.verdict]

  return (
    <div className="flex items-center gap-3 rounded-full border border-line bg-surface px-4 py-2.5 shadow-card">
      <span className={`relative inline-flex h-2 w-2 shrink-0 rounded-full ${dot}`}>
        <span className={`absolute inset-0 animate-ping rounded-full opacity-60 ${dot}`} />
      </span>
      <p className="flex-1 truncate text-[12px] leading-snug text-ink-2">
        <span className="font-semibold text-ink">{maskName(c.name)}</span>
        {' · '}
        <span>{t(c.itemKey)}</span>
        {c.extra && <span className="text-ink-3"> · {c.extra}</span>}
        {' · '}
        <span className="font-semibold tabular-nums text-ink">
          {formatKrw(c.paid, i18n.language)}
        </span>
        {' · '}
        <span
          className={`text-[11px] font-bold uppercase tracking-wider ${
            c.verdict === 'bagaji'
              ? 'text-danger'
              : c.verdict === 'careful'
                ? 'text-warn'
                : 'text-brand'
          }`}
        >
          {t(`page.check.verdict.${c.verdict}`)}
        </span>
      </p>
    </div>
  )
}
