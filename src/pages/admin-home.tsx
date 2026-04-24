import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RequireAdmin } from '../components/require-admin'
import { useAuth } from '../hooks/use-auth'
import coursesData from '../data/courses.json'
import poiData from '../data/live-bucheon-pois.json'
import { STYLE_TAGS, DURATIONS } from '../types/course'
import { AlertIcon, ArrowRightIcon, CourseIcon, MapIcon, UserIcon } from '../components/icons'

interface RawCoursesFile {
  courses: Array<{ id: string; published: boolean }>
}
interface RawPoiFile {
  pois: Array<{ role: 'core' | 'nearby' }>
}

const courses = (coursesData as RawCoursesFile).courses
const pois = (poiData as RawPoiFile).pois

const Content = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const published = courses.filter((c) => c.published).length
  const corePoi = pois.filter((p) => p.role === 'core').length

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-6">
      <header className="space-y-1">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand">
          {t('page.admin.label')}
        </p>
        <h1 className="nwk-display text-[24px] font-bold tracking-tight text-ink">
          {t('page.admin.home.title')}
        </h1>
        <p className="text-[13px] text-ink-2">
          {t('page.admin.home.greeting', { name: user?.displayName ?? 'admin' })}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { value: String(published), label: t('page.admin.stats.published') },
          { value: String(courses.length), label: t('page.admin.stats.total') },
          { value: String(STYLE_TAGS.length), label: t('page.admin.stats.styles') },
          { value: String(DURATIONS.length), label: t('page.admin.stats.durations') },
        ].map((s) => (
          <div key={s.label} className="nwk-card p-4 text-center">
            <p className="nwk-display text-[24px] font-bold leading-none text-brand">{s.value}</p>
            <p className="mt-1 text-[11px] font-semibold text-ink-3">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          to="/admin/courses"
          className="nwk-card group flex items-center gap-3 p-4 hover:border-brand"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
            <CourseIcon size={20} />
          </span>
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-ink">{t('page.admin.links.courses')}</p>
            <p className="mt-0.5 text-[12px] text-ink-3">
              {t('page.admin.links.coursesDesc', { count: courses.length })}
            </p>
          </div>
          <ArrowRightIcon size={16} className="text-ink-3 group-hover:text-brand" />
        </Link>
        <Link
          to="/admin/notes"
          className="nwk-card group flex items-center gap-3 p-4 hover:border-brand"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
            <UserIcon size={20} />
          </span>
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-ink">{t('page.admin.links.notes')}</p>
            <p className="mt-0.5 text-[12px] text-ink-3">{t('page.admin.links.notesDesc')}</p>
          </div>
          <ArrowRightIcon size={16} className="text-ink-3 group-hover:text-brand" />
        </Link>
        <Link
          to="/admin/checks"
          className="nwk-card group flex items-center gap-3 p-4 hover:border-brand"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-danger/15 text-danger">
            <AlertIcon size={20} />
          </span>
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-ink">{t('page.admin.links.checks')}</p>
            <p className="mt-0.5 text-[12px] text-ink-3">{t('page.admin.links.checksDesc')}</p>
          </div>
          <ArrowRightIcon size={16} className="text-ink-3 group-hover:text-brand" />
        </Link>
      </section>

      <section className="nwk-card p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
            <MapIcon size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-ink">
              {t('page.admin.pipeline.title', { pois: pois.length, core: corePoi })}
            </p>
            <p className="mt-1 text-[12px] leading-snug text-ink-2">
              {t('page.admin.pipeline.body')}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export const AdminHomePage = () => (
  <RequireAdmin>
    <Content />
  </RequireAdmin>
)
