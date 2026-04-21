// Bucheon-specialized tourism course types.
//
// Design principles:
// 1. POI data comes from TourAPI (contentId reference). We do not duplicate
//    names/addrs — they are read live from src/data/live-bucheon-pois.json
//    (populated by scripts/sync-bucheon-pois.mjs) so TourAPI updates propagate
//    automatically. Custom places (로컬 분식집 등) that TourAPI doesn't know
//    carry their own name/addr inline under `customPlace`.
// 2. Region rule — enforced at data-level: 70% or more of stops must sit in
//    Bucheon. Validator in src/data/courses-validate.ts checks this.
// 3. CMS-ready — the same shape works for a static JSON seed today and a
//    Firestore document tomorrow. When an admin editor ships, the only
//    change is swapping the source behind useCourses().

export type Lang = 'ko' | 'en' | 'ja' | 'zh'

// Localized record. ko is required; others fall back via useCourseText() in
// src/hooks/use-courses.ts (ja/zh → en → ko).
export interface Localized<T> {
  ko: T
  en?: T
  ja?: T
  zh?: T
}

export const STYLE_TAGS = [
  'kcomics', // 한국만화박물관·웹툰 성지
  'kfilm', // BIFAN·장르영화 촬영지
  'kdrama', // K-드라마 촬영지 투어
  'kpop', // K-pop 굿즈·아이돌·노래방·MV 감성
  'foodie', // 재래시장·로컬 맛집
  'kculture-day', // 일반 K-컬처 당일치기
  'family', // 가족 단위 (테마파크·체험)
  'nature', // 자연·공원
  'wellness', // 찜질방·스파·힐링 산책
  'history', // 사찰·서원·문학관 등 역사 유적
  'rainy-day', // 우천 대비 실내 중심 대체 코스
  'hidden-gem', // 숨은 명소 (현지인만 아는 공원·시장)
  'transit-easy', // 대중교통 접근성 최상 (환승 최소)
] as const
export type StyleTag = (typeof STYLE_TAGS)[number]

export const DURATIONS = ['half-day', 'day', '1n2d', '2n3d', '3n4d'] as const
export type Duration = (typeof DURATIONS)[number]

export type StopCategory =
  | 'attraction'
  | 'culture'
  | 'food'
  | 'cafe'
  | 'shopping'
  | 'leisure'
  | 'festival'
  | 'transit'
  | 'rest'
  | 'lodging'

// Text fields shown on cards/detail. Arrays render as bullets.
export interface CourseText {
  title: string
  subtitle?: string
  summary: string
  highlights?: string[]
}

export interface StopText {
  note: string
  tips?: string[]
}

export interface TransitHint {
  from: 'seoul' | 'incheon-airport' | 'gimpo-airport'
  mode: string // e.g. 'subway_line_1', 'bus_601'
  minutes: number
}

// Every stop either references a TourAPI contentId (preferred — we reuse the
// sync'd multilang name/addr/thumbnail/coords) OR inlines its own place data.
// Having both means we fell back to TourAPI for the image + coords but
// override the label (rare — mostly for "a corner of X park" kind of stops).
export interface CourseStop {
  order: number
  stayMinutes: number
  category: StopCategory
  tourApiContentId?: string
  customPlace?: {
    coords: { lat: number; lng: number }
    region: 'bucheon' | 'nearby' // counts toward the 70% rule
    i18n: Localized<{ name: string; addr: string }>
  }
  priceCatalogId?: string // Link to price-catalog for the check feature
  i18n: Localized<StopText>
}

export interface Course {
  id: string // slug, e.g. 'bucheon-kcomics-day'
  primaryRegion: 'bucheon'
  styleTags: StyleTag[]
  duration: Duration
  heroImage?: string | null
  budgetKrw: { min: number; max: number }
  transitHint?: TransitHint
  stops: CourseStop[]
  i18n: Localized<CourseText>
  published: boolean
  updatedAt: string // ISO
  updatedBy?: string // admin uid, populated when edited via CMS
}

// Resolves a localized record to the best-available text for a requested
// language. Fallback chain: requested → en → ko.
export const resolveLocalized = <T>(loc: Localized<T>, lang: Lang): T => {
  return loc[lang] ?? loc.en ?? loc.ko
}

// Region-share validator: 70%+ of stops must be in Bucheon.
// A stop counts as Bucheon if:
//   - customPlace.region === 'bucheon', OR
//   - tourApiContentId resolves to a sigungu we marked role='core' in the
//     sync bundle (checked at load time by useCourses).
export const BUCHEON_SHARE_MIN = 0.7

export interface CourseValidationResult {
  valid: boolean
  bucheonShare: number
  stopsInBucheon: number
  totalStops: number
  reason?: string
}

// Used by tests and the admin editor — takes the pre-resolved per-stop flag
// from useCourses (which knows the sync bundle) and applies the 70% rule.
export const validateBucheonShare = (stopsInBucheon: boolean[]): CourseValidationResult => {
  const totalStops = stopsInBucheon.length
  if (totalStops === 0) {
    return { valid: false, bucheonShare: 0, stopsInBucheon: 0, totalStops, reason: 'no stops' }
  }
  const inBucheon = stopsInBucheon.filter(Boolean).length
  const share = inBucheon / totalStops
  return {
    valid: share >= BUCHEON_SHARE_MIN,
    bucheonShare: share,
    stopsInBucheon: inBucheon,
    totalStops,
    reason:
      share >= BUCHEON_SHARE_MIN ? undefined : `Bucheon share ${(share * 100).toFixed(0)}% < 70%`,
  }
}
