import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  query,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { RequireAdmin } from '../components/require-admin'
import coursesData from '../data/courses.json'
import { ArrowLeftIcon } from '../components/icons'

interface RawCoursesFile {
  courses: Array<{ id: string }>
}
const COURSE_IDS = (coursesData as RawCoursesFile).courses.map((c) => c.id)

interface AdminNote {
  path: string
  courseId: string
  noteId: string
  uid: string
  displayName: string
  text: string
  hidden: boolean
  createdAt: Date | null
}

const Content = () => {
  const { t, i18n } = useTranslation()
  const [notesByCourse, setNotesByCourse] = useState<Record<string, AdminNote[]>>({})
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all')

  // One listener per course. Picking this over collectionGroup because
  // Firestore collection-group reads on implicit subcollections (course
  // docs aren't materialized in Firestore yet) were returning empty from
  // the client SDK. Per-course subscriptions hit the regular /notes path
  // and the rules engine evaluates the specific-path rule cleanly.
  useEffect(() => {
    const unsubs: Array<() => void> = []
    for (const courseId of COURSE_IDS) {
      const q = query(collection(db, 'courses', courseId, 'notes'), limit(200))
      const markLoaded = () => {
        setLoadedIds((prev) => {
          if (prev.has(courseId)) return prev
          const next = new Set(prev)
          next.add(courseId)
          return next
        })
      }
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list: AdminNote[] = snap.docs.map((d) => {
            const data = d.data()
            const rawDate = data.createdAt as Timestamp | undefined
            return {
              path: d.ref.path,
              courseId,
              noteId: d.id,
              uid: String(data.uid ?? ''),
              displayName: String(data.displayName ?? ''),
              text: String(data.text ?? ''),
              hidden: Boolean(data.hidden),
              createdAt: rawDate ? rawDate.toDate() : null,
            }
          })
          setNotesByCourse((prev) => ({ ...prev, [courseId]: list }))
          markLoaded()
        },
        (err) => {
          console.error(`admin notes snapshot failed for ${courseId}`, err)
          markLoaded()
        },
      )
      unsubs.push(unsub)
    }
    return () => {
      for (const u of unsubs) u()
    }
  }, [])

  const notes = useMemo(
    () =>
      Object.values(notesByCourse)
        .flat()
        .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)),
    [notesByCourse],
  )

  const filtered = useMemo(() => {
    if (filter === 'visible') return notes.filter((n) => !n.hidden)
    if (filter === 'hidden') return notes.filter((n) => n.hidden)
    return notes
  }, [notes, filter])

  const toggle = async (n: AdminNote) => {
    try {
      await updateDoc(doc(db, 'courses', n.courseId, 'notes', n.noteId), { hidden: !n.hidden })
    } catch (err) {
      console.error('toggle hidden failed', err)
    }
  }

  const remove = async (n: AdminNote) => {
    if (!window.confirm(t('page.admin.notes.confirmDelete'))) return
    try {
      await deleteDoc(doc(db, 'courses', n.courseId, 'notes', n.noteId))
    } catch (err) {
      console.error('delete note failed', err)
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

  const allLoaded = loadedIds.size >= COURSE_IDS.length

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
          {t('page.admin.notes.title')}
        </h1>
        <p className="text-[12px] text-ink-3">{t('page.admin.notes.total', { n: notes.length })}</p>
      </header>

      <div className="flex gap-2">
        {(['all', 'visible', 'hidden'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`rounded-full px-3 py-1 text-[12px] font-semibold transition ${
              filter === k ? 'bg-brand text-on-brand' : 'bg-canvas-2/70 text-ink-2 hover:text-ink'
            }`}
          >
            {t(`page.admin.notes.filter.${k}`)}
          </button>
        ))}
      </div>

      {!allLoaded && (
        <p className="py-10 text-center text-[13px] text-ink-3">{t('page.admin.notes.loading')}</p>
      )}
      {allLoaded && filtered.length === 0 && (
        <p className="py-10 text-center text-[13px] text-ink-3">{t('page.admin.notes.empty')}</p>
      )}

      <ul className="space-y-2">
        {filtered.map((n) => (
          <li key={n.path} className="nwk-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-3">
                  <Link
                    to={`/courses/${n.courseId}`}
                    className="rounded-full bg-brand-soft px-2 py-0.5 font-semibold text-brand hover:underline"
                  >
                    {n.courseId}
                  </Link>
                  <span>{n.displayName || 'anon'}</span>
                  <span>·</span>
                  <span>{formatDate(n.createdAt)}</span>
                  {n.hidden && (
                    <span className="rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-semibold text-on-ink">
                      {t('page.admin.notes.hiddenTag')}
                    </span>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-ink">
                  {n.text}
                </p>
                <p className="mt-1 font-mono text-[10px] text-ink-3">uid: {n.uid}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  onClick={() => toggle(n)}
                  className="rounded-lg bg-canvas-2/80 px-3 py-1 text-[12px] font-semibold text-ink-2 hover:bg-canvas-2"
                >
                  {n.hidden ? t('page.admin.notes.show') : t('page.admin.notes.hide')}
                </button>
                <button
                  type="button"
                  onClick={() => remove(n)}
                  className="rounded-lg bg-danger/10 px-3 py-1 text-[12px] font-semibold text-danger hover:bg-danger/20"
                >
                  {t('page.admin.notes.delete')}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export const AdminNotesPage = () => (
  <RequireAdmin>
    <Content />
  </RequireAdmin>
)
