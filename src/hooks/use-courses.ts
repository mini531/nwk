// Course reader — merges static courses.json + live-bucheon-pois.json POI
// metadata + poi-translations.json title overrides into ready-to-render
// ResolvedCourse records.
//
// Today the source is a static JSON seed. When the admin CMS ships, swap
// COURSES / POI_INDEX with Firestore subscriptions — every consumer keeps
// working because the ResolvedCourse shape is stable.

import { useMemo } from 'react'
import coursesData from '../data/courses.json'
import poiData from '../data/live-bucheon-pois.json'
import translationsData from '../data/poi-translations.json'
import type {
  Course,
  CourseStop,
  CourseText,
  Duration,
  Lang,
  Localized,
  StopText,
  StyleTag,
} from '../types/course'
import { resolveLocalized, validateBucheonShare } from '../types/course'

interface RawCoursesFile {
  source: string
  updatedAt: string
  courses: Array<Course & { heroContentId?: string | null }>
}

interface RawPoi {
  contentId: string
  contentTypeId: string
  typeTag: string
  areaCode: string
  sigunguCode: string
  sigunguName: string
  role: 'core' | 'nearby'
  coords: { lat: number; lng: number }
  thumbnail: string | null
  thumbnailSmall: string | null
  ko: { title: string; addr: string } | null
  en: { title: string; addr: string } | null
  ja: { title: string; addr: string } | null
  zh: { title: string; addr: string } | null
}

interface RawPoiFile {
  source: string
  sourceUrl: string
  fetchedAt: string
  pois: RawPoi[]
}

interface RawTranslations {
  translations: Record<
    string,
    Partial<Record<Lang, { title?: string; addr?: string; overview?: string }>>
  >
}

const COURSES = (coursesData as RawCoursesFile).courses
const POI_INDEX = new Map<string, RawPoi>((poiData as RawPoiFile).pois.map((p) => [p.contentId, p]))
const POI_TRANSLATIONS = (translationsData as RawTranslations).translations

export interface ResolvedPoi {
  contentId: string
  role: 'core' | 'nearby'
  sigunguName: string
  typeTag: string
  coords: { lat: number; lng: number }
  thumbnail: string | null
  // Resolved per-language text (falls back across poi-translations → TourAPI → ko).
  titleByLang: Record<Lang, string>
  addrByLang: Record<Lang, string>
  // 설명문(한국어는 TourAPI KorService2 로만 취득 가능 — 여기서는
  // poi-translations.json 의 수동 번역만 쓴다. 해당 언어 override 가 없으면
  // 빈 문자열 → 툴팁은 이 필드를 무시하고 기본 tourDetail 결과에 의존.)
  overviewByLang: Record<Lang, string>
}

export interface ResolvedStop {
  order: number
  stayMinutes: number
  category: CourseStop['category']
  priceCatalogId?: string
  poi: ResolvedPoi | null
  // True if this stop counts toward the 70% Bucheon rule.
  isBucheon: boolean
  i18n: Localized<StopText>
}

export interface ResolvedCourse {
  id: string
  styleTags: StyleTag[]
  duration: Duration
  budgetKrw: { min: number; max: number }
  transitHint: Course['transitHint']
  heroImage: string | null
  stops: ResolvedStop[]
  i18n: Localized<CourseText>
  bucheonShare: number
  published: boolean
  updatedAt: string
}

const resolvePoi = (contentId: string): ResolvedPoi | null => {
  const raw = POI_INDEX.get(contentId)
  if (!raw) return null
  const overrides = POI_TRANSLATIONS[contentId] ?? {}
  const pick = (lang: Lang): { title: string; addr: string; overview: string } => {
    const koTitle = raw.ko?.title ?? ''
    const koAddr = raw.ko?.addr ?? ''
    const override = overrides[lang]
    if (lang === 'ko') {
      return { title: koTitle, addr: koAddr, overview: override?.overview ?? '' }
    }
    const tourApiLang = raw[lang]
    const title = override?.title ?? tourApiLang?.title ?? koTitle
    const addr = override?.addr ?? tourApiLang?.addr ?? koAddr
    const overview = override?.overview ?? ''
    return { title, addr, overview }
  }
  const titleByLang: Record<Lang, string> = {
    ko: pick('ko').title,
    en: pick('en').title,
    ja: pick('ja').title,
    zh: pick('zh').title,
  }
  const addrByLang: Record<Lang, string> = {
    ko: pick('ko').addr,
    en: pick('en').addr,
    ja: pick('ja').addr,
    zh: pick('zh').addr,
  }
  const overviewByLang: Record<Lang, string> = {
    ko: pick('ko').overview,
    en: pick('en').overview,
    ja: pick('ja').overview,
    zh: pick('zh').overview,
  }
  return {
    contentId,
    role: raw.role,
    sigunguName: raw.sigunguName,
    typeTag: raw.typeTag,
    coords: raw.coords,
    thumbnail: raw.thumbnail,
    titleByLang,
    addrByLang,
    overviewByLang,
  }
}

const resolveStop = (stop: CourseStop): ResolvedStop => {
  let poi: ResolvedPoi | null = null
  let isBucheon = false
  if (stop.tourApiContentId) {
    poi = resolvePoi(stop.tourApiContentId)
    isBucheon = poi?.role === 'core'
  } else if (stop.customPlace) {
    isBucheon = stop.customPlace.region === 'bucheon'
    // Synthesize a ResolvedPoi-like shape from customPlace for render parity.
    const cp = stop.customPlace
    poi = {
      contentId: `custom-${stop.order}`,
      role: isBucheon ? 'core' : 'nearby',
      sigunguName: isBucheon ? '부천시' : '',
      typeTag: stop.category,
      coords: cp.coords,
      thumbnail: null,
      titleByLang: {
        ko: cp.i18n.ko.name,
        en: cp.i18n.en?.name ?? cp.i18n.ko.name,
        ja: cp.i18n.ja?.name ?? cp.i18n.en?.name ?? cp.i18n.ko.name,
        zh: cp.i18n.zh?.name ?? cp.i18n.en?.name ?? cp.i18n.ko.name,
      },
      addrByLang: {
        ko: cp.i18n.ko.addr,
        en: cp.i18n.en?.addr ?? cp.i18n.ko.addr,
        ja: cp.i18n.ja?.addr ?? cp.i18n.en?.addr ?? cp.i18n.ko.addr,
        zh: cp.i18n.zh?.addr ?? cp.i18n.en?.addr ?? cp.i18n.ko.addr,
      },
      overviewByLang: {
        ko: '',
        en: '',
        ja: '',
        zh: '',
      },
    }
  }
  return {
    order: stop.order,
    stayMinutes: stop.stayMinutes,
    category: stop.category,
    priceCatalogId: stop.priceCatalogId,
    poi,
    isBucheon,
    i18n: stop.i18n,
  }
}

const resolveCourse = (raw: Course & { heroContentId?: string | null }): ResolvedCourse => {
  const stops = [...raw.stops].sort((a, b) => a.order - b.order).map((s) => resolveStop(s))
  const bucheonFlags = stops.map((s) => s.isBucheon)
  const validation = validateBucheonShare(bucheonFlags)
  let heroImage: string | null = null
  if (raw.heroContentId) {
    const hero = POI_INDEX.get(raw.heroContentId)
    heroImage = hero?.thumbnail ?? null
  }
  if (!heroImage) {
    const first = stops.find((s) => s.poi?.thumbnail)
    heroImage = first?.poi?.thumbnail ?? null
  }
  return {
    id: raw.id,
    styleTags: raw.styleTags,
    duration: raw.duration,
    budgetKrw: raw.budgetKrw,
    transitHint: raw.transitHint,
    heroImage,
    stops,
    i18n: raw.i18n,
    bucheonShare: validation.bucheonShare,
    published: raw.published,
    updatedAt: raw.updatedAt,
  }
}

export const useCourses = (): ResolvedCourse[] => {
  return useMemo(() => COURSES.filter((c) => c.published).map((c) => resolveCourse(c)), [])
}

export const useCourse = (id: string): ResolvedCourse | null => {
  return useMemo(() => {
    const raw = COURSES.find((c) => c.id === id && c.published)
    return raw ? resolveCourse(raw) : null
  }, [id])
}

// Convenience wrapper for components that want localized text directly.
export const useCourseText = (course: ResolvedCourse, lang: Lang): CourseText => {
  return resolveLocalized(course.i18n, lang)
}

export const useStopText = (stop: ResolvedStop, lang: Lang): StopText => {
  return resolveLocalized(stop.i18n, lang)
}
