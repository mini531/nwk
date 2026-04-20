import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LIVE_CASES, type LiveCase } from '../data/live-cases'
import { AlertIcon } from './icons'

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

const overpaidPct = (c: LiveCase): number => {
  const fairMid = (c.fairLow + c.fairHigh) / 2
  if (fairMid <= 0) return 0
  return Math.round(((c.paid - fairMid) / fairMid) * 100)
}

const BAGAJI_CASES = LIVE_CASES.filter((c) => c.verdict === 'bagaji')
const VISIBLE = 3
const ROTATE_MS = 4200

const pickWindow = (start: number): LiveCase[] => {
  const out: LiveCase[] = []
  for (let i = 0; i < VISIBLE; i++) {
    out.push(BAGAJI_CASES[(start + i) % BAGAJI_CASES.length])
  }
  return out
}

export const BagajiHero = () => {
  const { t, i18n } = useTranslation()
  const [start, setStart] = useState(0)
  const [pulse, setPulse] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setStart((s) => (s + 1) % BAGAJI_CASES.length)
      setPulse((p) => p + 1)
    }, ROTATE_MS)
    return () => window.clearInterval(id)
  }, [])

  const cases = useMemo(() => pickWindow(start), [start])
  const flagged = BAGAJI_CASES.length

  return (
    <section className="relative -mx-5 -mt-6 overflow-hidden bg-ink text-on-ink sm:-mx-6 lg:-mx-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, currentColor 1px, transparent 1px), radial-gradient(circle at 80% 60%, currentColor 1px, transparent 1px)',
          backgroundSize: '38px 38px, 52px 52px',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-danger/20 blur-3xl"
      />
      <div className="relative mx-auto w-full max-w-6xl px-5 py-9 sm:px-6 sm:py-11 lg:px-8 lg:py-14">
        <div className="flex items-center gap-2">
          <span className="relative inline-flex h-2.5 w-2.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-danger opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-danger" />
          </span>
          <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-danger">
            {t('page.home.bagaji.eyebrow')}
          </span>
          <span className="text-[12px] font-medium text-on-ink/50">
            · {t('page.home.bagaji.flagged', { count: flagged })}
          </span>
        </div>

        <h1 className="nwk-display mt-3 max-w-3xl text-[30px] leading-[1.05] text-on-ink sm:text-[40px] lg:text-[52px]">
          {t('page.home.bagaji.headline')}
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-on-ink/70 sm:text-[15px]">
          {t('page.home.bagaji.sub')}
        </p>

        <div
          key={pulse}
          className="mt-7 grid animate-[fadeIn_500ms_ease-out] gap-3 sm:mt-9 sm:grid-cols-3 sm:gap-4"
        >
          {cases.map((c, idx) => {
            const pct = overpaidPct(c)
            return (
              <article
                key={`${c.id}-${pulse}`}
                className="group relative isolate overflow-hidden rounded-2xl border border-on-ink/10 bg-on-ink/[0.04] p-5 backdrop-blur-sm transition hover:border-danger/40"
                style={{ animation: `riseIn 520ms ${idx * 90}ms both ease-out` }}
              >
                {c.image && (
                  <>
                    <img
                      src={c.image}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60 transition duration-700 group-hover:scale-[1.04] group-hover:opacity-75"
                    />
                    <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/85 to-ink/40" />
                    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-transparent via-transparent to-danger/25" />
                  </>
                )}
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-danger/15 px-2 py-1 text-[12px] font-bold uppercase tracking-wider text-danger">
                    <AlertIcon size={11} />
                    {t('page.check.verdict.bagaji')}
                  </span>
                  <span className="nwk-display text-[26px] leading-none tabular-nums text-danger">
                    +{pct}%
                  </span>
                </div>
                <p className="nwk-display mt-4 text-[26px] leading-tight tabular-nums text-on-ink">
                  {formatKrw(c.paid, i18n.language)}
                </p>
                <p className="mt-1 text-[12px] tabular-nums text-on-ink/55">
                  {t('page.home.bagaji.fair')} {formatKrw(c.fairLow, i18n.language)}–
                  {formatKrw(c.fairHigh, i18n.language)}
                </p>
                <div className="mt-4 border-t border-on-ink/10 pt-3">
                  <p className="truncate text-[13px] font-medium tracking-tight text-on-ink/90">
                    {t(c.itemKey)}
                  </p>
                  <p className="mt-0.5 text-[12px] text-on-ink/45">
                    {maskName(c.name)}
                    {c.extra ? ` · ${c.extra}` : ''}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0.4; }
          to { opacity: 1; }
        }
      `}</style>
    </section>
  )
}
