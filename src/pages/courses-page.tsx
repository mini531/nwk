import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCourses } from '../hooks/use-courses'
import { STYLE_TAGS, DURATIONS, type StyleTag, type Duration, type Lang } from '../types/course'
import { resolveLocalized } from '../types/course'
import { ArrowRightIcon, ClockIcon, CoinIcon } from '../components/icons'

const formatKrwRange = (min: number, max: number, lang: string): string => {
  const fmt = (v: number) => {
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
  return `${fmt(min)} – ${fmt(max)}`
}

export const CoursesPage = () => {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language.slice(0, 2) as Lang) || 'ko'
  const courses = useCourses()
  const [tag, setTag] = useState<StyleTag | null>(null)
  const [duration, setDuration] = useState<Duration | null>(null)

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      if (tag && !c.styleTags.includes(tag)) return false
      if (duration && c.duration !== duration) return false
      return true
    })
  }, [courses, tag, duration])

  return (
    <div className="space-y-6 pb-8">
      <header className="space-y-2">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-brand">
          {t('page.courses.eyebrow')}
        </p>
        <h1 className="nwk-display text-[28px] leading-tight text-ink sm:text-[32px]">
          {t('page.courses.title')}
        </h1>
        <p className="max-w-2xl text-[14px] leading-relaxed text-ink-2">
          {t('page.courses.subtitle')}
        </p>
      </header>

      <section className="space-y-3">
        <div>
          <p className="mb-2 text-[12px] font-semibold text-ink-3">
            {t('page.courses.filterStyle')}
          </p>
          <div className="-mx-5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:overflow-visible sm:px-0">
            <div className="flex min-w-max gap-2 sm:min-w-0 sm:flex-wrap">
              <button
                type="button"
                onClick={() => setTag(null)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium tracking-tight transition ${
                  tag === null
                    ? 'border-ink bg-ink text-on-ink'
                    : 'border-line bg-surface text-ink-2 hover:border-line-strong'
                }`}
              >
                {t('page.courses.filterAll')}
              </button>
              {STYLE_TAGS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTag(tag === s ? null : s)}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium tracking-tight transition ${
                    tag === s
                      ? 'border-ink bg-ink text-on-ink'
                      : 'border-line bg-surface text-ink-2 hover:border-line-strong'
                  }`}
                >
                  {t(`page.courses.tag.${s}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[12px] font-semibold text-ink-3">
            {t('page.courses.filterDuration')}
          </p>
          <div className="-mx-5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:overflow-visible sm:px-0">
            <div className="flex min-w-max gap-2 sm:min-w-0 sm:flex-wrap">
              <button
                type="button"
                onClick={() => setDuration(null)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium tracking-tight transition ${
                  duration === null
                    ? 'border-ink bg-ink text-on-ink'
                    : 'border-line bg-surface text-ink-2 hover:border-line-strong'
                }`}
              >
                {t('page.courses.filterAll')}
              </button>
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(duration === d ? null : d)}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium tracking-tight transition ${
                    duration === d
                      ? 'border-ink bg-ink text-on-ink'
                      : 'border-line bg-surface text-ink-2 hover:border-line-strong'
                  }`}
                >
                  {t(`page.courses.duration.${d}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface px-5 py-10 text-center">
            <p className="text-[14px] text-ink-3">{t('page.courses.empty')}</p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => {
              const text = resolveLocalized(c.i18n, lang)
              return (
                <li key={c.id} className="h-full">
                  <Link
                    to={`/courses/${c.id}`}
                    className="nwk-card nwk-card-hover group flex h-full flex-col overflow-hidden p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  >
                    {c.heroImage && (
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-canvas-2">
                        <img
                          src={c.heroImage}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-bold tracking-wider text-brand shadow-card backdrop-blur">
                          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                          TourAPI
                        </div>
                        <div className="absolute right-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-[12px] font-bold text-on-ink backdrop-blur">
                          {t(`page.courses.duration.${c.duration}`)}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-1 flex-col gap-3 px-5 py-4">
                      <div>
                        <p className="nwk-display line-clamp-2 min-h-[2.6em] text-[18px] leading-tight text-ink">
                          {text.title}
                        </p>
                        <p className="mt-1 line-clamp-2 min-h-[2.4em] text-[12px] leading-snug text-ink-3">
                          {text.subtitle ?? ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {c.styleTags.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center rounded-full bg-brand-soft px-2 py-0.5 text-[12px] font-semibold text-brand"
                          >
                            {t(`page.courses.tag.${s}`)}
                          </span>
                        ))}
                      </div>
                      <div className="mt-auto space-y-2">
                        <div className="flex items-center justify-between border-t border-line pt-3 text-[12px] text-ink-3">
                          <span className="inline-flex items-center gap-1">
                            <CoinIcon size={14} />
                            {formatKrwRange(c.budgetKrw.min, c.budgetKrw.max, i18n.language)}
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold text-brand">
                            {t('page.courses.viewCourse')}
                            <ArrowRightIcon size={12} />
                          </span>
                        </div>
                        <p className="text-[12px] text-ink-3">
                          <ClockIcon size={12} className="mr-1 inline-block" />
                          {t('page.courses.bucheonShare', {
                            pct: Math.round(c.bucheonShare * 100),
                          })}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-canvas-2 px-5 py-4">
        <p className="text-[12px] font-semibold text-ink-3">{t('page.courses.sourceLabel')}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-2">
          {t('page.courses.sourceBody')}
        </p>
      </section>
    </div>
  )
}
