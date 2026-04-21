import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { RequireAdmin } from '../components/require-admin'
import coursesData from '../data/courses.json'
import type { Lang } from '../types/course'
import { resolveLocalized } from '../types/course'
import { ArrowLeftIcon, CourseIcon } from '../components/icons'

interface StaticCourse {
  id: string
  duration: string
  styleTags: string[]
  published: boolean
  stops: unknown[]
  i18n: {
    ko: { title: string; summary: string }
    en?: { title: string; summary: string }
    ja?: { title: string; summary: string }
    zh?: { title: string; summary: string }
  }
}

interface RawCoursesFile {
  courses: StaticCourse[]
}

const staticCourses = (coursesData as RawCoursesFile).courses

const Content = () => {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language.slice(0, 2) as Lang) || 'ko'
  const [overrides, setOverrides] = useState<Record<string, { published: boolean }>>({})
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'courses'),
      (snap) => {
        const next: Record<string, { published: boolean }> = {}
        for (const d of snap.docs) {
          const data = d.data()
          next[d.id] = { published: Boolean(data.published) }
        }
        setOverrides(next)
      },
      (err) => {
        console.error('courses snapshot failed', err)
      },
    )
    return unsub
  }, [])

  const merged = useMemo(
    () =>
      staticCourses.map((c) => ({
        ...c,
        effectivePublished: overrides[c.id]?.published ?? c.published,
        isOverridden: c.id in overrides,
      })),
    [overrides],
  )

  const togglePublished = async (courseId: string, current: boolean) => {
    setSaving(courseId)
    try {
      const source = staticCourses.find((c) => c.id === courseId)
      if (!source) return
      // Upsert: write a minimal doc that carries the full course shape so
      // Firestore holds the source of truth once edited. Rules require
      // admin claim; read stays gated by published=true for the public.
      await setDoc(
        doc(db, 'courses', courseId),
        {
          ...source,
          published: !current,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      )
    } catch (err) {
      console.error('toggle published failed', err)
    } finally {
      setSaving(null)
    }
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
          {t('page.admin.courses.title')}
        </h1>
        <p className="text-[12px] text-ink-3">
          {t('page.admin.courses.help', { n: staticCourses.length })}
        </p>
      </header>

      <ul className="space-y-2">
        {merged.map((c) => {
          const text = resolveLocalized(c.i18n, lang)
          return (
            <li key={c.id} className="nwk-card p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                  <CourseIcon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-[14px] font-semibold text-ink">{text.title}</p>
                    {c.isOverridden && (
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                        {t('page.admin.courses.firestore')}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-ink-3">
                    {c.id} · {c.duration} · {c.styleTags.join(', ')}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[12px] text-ink-2">{text.summary}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <button
                    type="button"
                    disabled={saving === c.id}
                    onClick={() => togglePublished(c.id, c.effectivePublished)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                      c.effectivePublished ? 'bg-brand text-on-brand' : 'bg-canvas-2/80 text-ink-3'
                    } ${saving === c.id ? 'opacity-50' : ''}`}
                  >
                    {c.effectivePublished
                      ? t('page.admin.courses.published')
                      : t('page.admin.courses.draft')}
                  </button>
                  <Link
                    to={`/courses/${c.id}`}
                    className="text-[11px] font-semibold text-brand hover:underline"
                  >
                    {t('page.admin.courses.preview')}
                  </Link>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export const AdminCoursesPage = () => (
  <RequireAdmin>
    <Content />
  </RequireAdmin>
)
