import type { TFunction } from 'i18next'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCourse } from '../hooks/use-courses'
import { resolveLocalized, type Lang } from '../types/course'
import { useAuth } from '../hooks/use-auth'
import { useCourseLike } from '../hooks/use-course-likes'
import { useCourseNotes } from '../hooks/use-course-notes'
import { shareCourse } from '../utils/course-share'
import { thumb } from '../utils/image'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon,
  CoinIcon,
  HeartIcon,
  MapIcon,
  PinIcon,
  TrainIcon,
} from '../components/icons'

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

const formatMinutes = (m: number, t: TFunction): string => {
  if (m >= 600) {
    const h = Math.round(m / 60)
    return t('page.course.overnightHours', { h })
  }
  if (m >= 60) {
    const h = Math.floor(m / 60)
    const rem = m - h * 60
    return rem ? t('page.course.stayHoursMin', { h, m: rem }) : t('page.course.stayHours', { h })
  }
  return t('page.course.stayMinutes', { m })
}

export const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const lang = (i18n.language.slice(0, 2) as Lang) || 'ko'
  const course = useCourse(id ?? '')
  const { user, signIn } = useAuth()
  const like = useCourseLike(id ?? null)
  const notes = useCourseNotes(id ?? null)
  const [noteDraft, setNoteDraft] = useState('')
  const [shareHint, setShareHint] = useState<'copied' | 'failed' | null>(null)

  const onSubmitNote = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const ok = await notes.submit(noteDraft)
    if (ok) setNoteDraft('')
  }

  const onShare = async () => {
    if (!course) return
    const txt = resolveLocalized(course.i18n, lang)
    const result = await shareCourse({
      title: txt.title,
      text: txt.summary,
      url: `${window.location.origin}/courses/${course.id}`,
    })
    if (result === 'copied') setShareHint('copied')
    else if (result === 'failed') setShareHint('failed')
    else setShareHint(null)
    if (result !== 'shared') {
      window.setTimeout(() => setShareHint(null), 2500)
    }
  }

  if (!course) {
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-[14px] text-ink-3">{t('page.course.notFound')}</p>
        <Link to="/courses" className="text-[13px] font-semibold text-brand hover:underline">
          {t('page.course.back')}
        </Link>
      </div>
    )
  }

  const text = resolveLocalized(course.i18n, lang)
  const bucheonPct = Math.round(course.bucheonShare * 100)

  return (
    <div className="space-y-6 pb-8">
      {/* 데스크톱: 본문 흐름 내 텍스트 링크. 모바일: 좌상단 플로팅 칩. */}
      <Link
        to="/courses"
        className="hidden items-center gap-1 text-[12px] font-medium text-ink-3 hover:text-ink-2 sm:inline-flex"
      >
        <ArrowLeftIcon size={14} />
        {t('page.course.back')}
      </Link>
      <Link
        to="/courses"
        className="fixed left-3 top-[68px] z-30 inline-flex items-center gap-1 rounded-full border border-line bg-surface/95 px-3 py-1.5 text-[12px] font-semibold text-ink-2 shadow-card backdrop-blur-md transition-colors hover:text-ink sm:hidden"
      >
        <ArrowLeftIcon size={14} />
        {t('page.course.back')}
      </Link>

      <div className="space-y-6 bg-canvas">
        <header className="space-y-3">
          {course.heroImage && (
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-canvas-2 sm:aspect-[21/9]">
              <img
                src={thumb(course.heroImage, 960) ?? course.heroImage}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="pointer-events-none absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-bold tracking-wider text-brand shadow-card backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                TourAPI
              </div>
              <div className="absolute inset-x-5 bottom-5 text-white">
                <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-white/80">
                  {t(`page.courses.duration.${course.duration}`)} ·{' '}
                  {t('page.courses.bucheonShare', { pct: bucheonPct })}
                </p>
                <p className="nwk-display mt-1 text-[26px] leading-tight text-white sm:text-[32px]">
                  {text.title}
                </p>
              </div>
            </div>
          )}
          {!course.heroImage && (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-brand">
                {t(`page.courses.duration.${course.duration}`)}
              </p>
              <h1 className="nwk-display mt-1 text-[28px] leading-tight text-ink sm:text-[32px]">
                {text.title}
              </h1>
            </div>
          )}
          {text.subtitle && (
            <p className="text-[15px] leading-relaxed text-ink-2">{text.subtitle}</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {course.styleTags.map((s) => (
              <span
                key={s}
                className="inline-flex items-center rounded-full bg-brand-soft px-2.5 py-1 text-[12px] font-semibold text-brand"
              >
                {t(`page.courses.tag.${s}`)}
              </span>
            ))}
          </div>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="nwk-card flex items-center gap-3 px-4 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
              <CoinIcon size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-ink-3">{t('page.course.budget')}</p>
              <p className="mt-0.5 truncate text-[13px] font-semibold tabular-nums text-ink">
                {formatKrwRange(course.budgetKrw.min, course.budgetKrw.max, i18n.language)}
              </p>
            </div>
          </div>
          {course.transitHint && (
            <div className="nwk-card flex items-center gap-3 px-4 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                <TrainIcon size={16} />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-ink-3">{t('page.course.access')}</p>
                <p className="mt-0.5 truncate text-[13px] font-semibold text-ink">
                  {t(`page.course.fromPoint.${course.transitHint.from}`)} ·{' '}
                  {t('page.course.minutes', { m: course.transitHint.minutes })}
                </p>
              </div>
            </div>
          )}
          <div className="nwk-card flex items-center gap-3 px-4 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-warn-soft text-warn">
              <PinIcon size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-ink-3">{t('page.course.regionRule')}</p>
              <p className="mt-0.5 truncate text-[13px] font-semibold text-ink">
                {t('page.courses.bucheonShare', { pct: bucheonPct })}
              </p>
            </div>
          </div>
        </section>

        {text.highlights && text.highlights.length > 0 && (
          <section className="rounded-2xl border border-brand-soft bg-brand-soft/30 px-5 py-4">
            <p className="text-[12px] font-semibold text-brand">
              {t('page.course.highlightsLabel')}
            </p>
            <ul className="mt-2 space-y-1.5">
              {text.highlights.map((h, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-[14px] leading-snug text-ink-2"
                >
                  <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-brand" />
                  {h}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-2">
          <p className="whitespace-pre-line text-[14px] leading-relaxed text-ink-2">
            {text.summary}
          </p>
        </section>

        <section>
          <h2 className="nwk-display text-[20px] text-ink">{t('page.course.itinerary')}</h2>
          <ol className="mt-3 space-y-3">
            {course.stops.map((stop) => {
              const stopText = resolveLocalized(stop.i18n, lang)
              const poiTitle = stop.poi?.titleByLang[lang] ?? stop.poi?.titleByLang.ko ?? ''
              const poiAddr = stop.poi?.addrByLang[lang] ?? stop.poi?.addrByLang.ko ?? ''
              return (
                <li key={stop.order} className="nwk-card flex gap-4 p-4">
                  <div className="flex w-[72px] shrink-0 flex-col items-center">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-[13px] font-bold text-on-ink">
                      {stop.order}
                    </span>
                    <span className="mt-2 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-canvas-2 px-2 py-0.5 text-[12px] font-semibold text-ink-3">
                      <ClockIcon size={12} />
                      {formatMinutes(stop.stayMinutes, t)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold tracking-tight text-ink">
                          {poiTitle}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] text-ink-3">{poiAddr}</p>
                      </div>
                      {stop.isBucheon && (
                        <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-[12px] font-bold text-brand">
                          {t('page.course.bucheonBadge')}
                        </span>
                      )}
                      {!stop.isBucheon && stop.poi?.sigunguName && (
                        <span className="shrink-0 rounded-full bg-canvas-2 px-2 py-0.5 text-[12px] font-semibold text-ink-3">
                          {stop.poi.sigunguName}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] leading-snug text-ink-2">{stopText.note}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      </div>

      <section className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (!like.canLike) return signIn().catch(() => undefined)
            like.toggle()
          }}
          aria-pressed={like.liked}
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-semibold tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
            like.liked
              ? 'border-accent bg-accent text-on-accent hover:bg-accent/90'
              : 'border-line bg-surface text-ink-2 hover:border-accent hover:text-accent'
          }`}
        >
          <HeartIcon size={16} filled={like.liked} />
          <span>{t('page.course.like')}</span>
          <span className="tabular-nums">{like.count}</span>
        </button>
        <Link
          to={`/map?course=${course.id}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand bg-brand px-4 py-2 text-[13px] font-semibold tracking-tight text-on-brand transition-colors hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <MapIcon size={16} />
          {t('page.course.viewOnMap')}
          <ArrowRightIcon size={12} />
        </Link>
        <button
          type="button"
          onClick={onShare}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-[13px] font-semibold tracking-tight text-ink-2 transition-colors hover:border-ink hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          {t('page.course.share')}
        </button>
        {shareHint === 'copied' && (
          <span className="text-[12px] font-medium text-brand">{t('page.course.shareCopied')}</span>
        )}
        {shareHint === 'failed' && (
          <span className="text-[12px] font-medium text-danger">
            {t('page.course.shareFailed')}
          </span>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="nwk-display text-[20px] text-ink">
            {t('page.course.notesLabel', { count: notes.notes.length })}
          </h2>
        </div>
        <div className="rounded-2xl border border-brand-soft bg-brand-soft/30 px-4 py-3">
          <p className="text-[12px] font-semibold text-brand">
            {t('page.course.notesProposalLabel')}
          </p>
          <p className="mt-1 text-[12px] leading-snug text-ink-2">
            {t('page.course.notesProposalBody')}
          </p>
        </div>

        {notes.canWrite ? (
          <form onSubmit={onSubmitNote} className="space-y-2">
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value.slice(0, 500))}
              placeholder={t('page.course.notePlaceholder')}
              className="h-24 w-full resize-none rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13px] leading-snug text-ink outline-none focus:border-brand"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] text-ink-3 tabular-nums">{noteDraft.length} / 500</p>
              <button
                type="submit"
                disabled={notes.submitting || !noteDraft.trim()}
                className="rounded-full bg-ink px-4 py-2 text-[12px] font-semibold text-on-ink transition hover:bg-ink/90 active:scale-[0.99] disabled:opacity-40 disabled:hover:bg-ink"
              >
                {notes.submitting ? t('page.course.notePosting') : t('page.course.notePost')}
              </button>
            </div>
            {notes.error === 'write-failed' && (
              <p className="text-[12px] text-danger">{t('page.course.noteError')}</p>
            )}
          </form>
        ) : (
          <div className="rounded-xl border border-line bg-surface px-4 py-3">
            <p className="text-[12px] leading-snug text-ink-2">
              {t('page.course.noteLoginPrompt')}
            </p>
            <button
              type="button"
              onClick={() => signIn().catch(() => undefined)}
              className="mt-2 rounded-full bg-ink px-4 py-1.5 text-[12px] font-semibold text-on-ink hover:bg-ink/90"
            >
              {t('page.course.noteSignIn')}
            </button>
          </div>
        )}

        {!notes.loaded ? (
          <p className="py-2 text-[12px] text-ink-3">{t('page.course.notesLoading')}</p>
        ) : notes.notes.length === 0 ? (
          <p className="py-2 text-[12px] text-ink-3">{t('page.course.notesEmpty')}</p>
        ) : (
          <ul className="space-y-2">
            {notes.notes.map((n) => {
              const isMine = user?.uid === n.uid
              return (
                <li key={n.id} className="rounded-xl border border-line bg-surface px-4 py-3">
                  <div className="flex items-center gap-2">
                    {n.photoURL ? (
                      <img
                        src={n.photoURL}
                        alt=""
                        className="h-6 w-6 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-canvas-2 text-[11px] font-bold text-ink-3">
                        {(n.displayName || '?').charAt(0)}
                      </span>
                    )}
                    <span className="text-[12px] font-semibold text-ink-2">
                      {n.displayName || t('page.course.noteAnon')}
                    </span>
                    {n.createdAt && (
                      <span className="text-[11px] text-ink-3">
                        · {n.createdAt.toLocaleDateString()}
                      </span>
                    )}
                    {isMine && (
                      <button
                        type="button"
                        onClick={() => notes.remove(n.id)}
                        className="ml-auto text-[11px] font-medium text-ink-3 hover:text-danger"
                      >
                        {t('page.course.noteDelete')}
                      </button>
                    )}
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-snug text-ink">
                    {n.text}
                  </p>
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
