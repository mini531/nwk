import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { logger } from 'firebase-functions/v2'

const TOUR_API_KEY = defineSecret('TOUR_API_KEY')

const SERVICE_BY_LANG: Record<string, string> = {
  ko: 'KorService2',
  en: 'EngService2',
  ja: 'JpnService2',
  zh: 'ChsService2',
}

const resolveService = (raw: unknown): string => {
  const lang = typeof raw === 'string' ? raw.toLowerCase().slice(0, 2) : 'ko'
  return SERVICE_BY_LANG[lang] ?? SERVICE_BY_LANG.ko
}

const sanitizeContentId = (raw: unknown): string => {
  if (typeof raw !== 'string' && typeof raw !== 'number') {
    throw new HttpsError('invalid-argument', 'contentId required')
  }
  const s = String(raw).trim()
  if (!/^\d{1,12}$/.test(s)) {
    throw new HttpsError('invalid-argument', 'contentId must be numeric')
  }
  return s
}

const callTourApi = async (
  service: string,
  operation: string,
  params: Record<string, string>,
): Promise<Record<string, string> | null> => {
  const url = new URL(`https://apis.data.go.kr/B551011/${service}/${operation}`)
  url.searchParams.set('MobileOS', 'ETC')
  url.searchParams.set('MobileApp', 'NWK')
  url.searchParams.set('_type', 'json')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const body = await res.text()
  if (body.trim().startsWith('<')) throw new Error('non-json response')
  const json = JSON.parse(body) as {
    response?: {
      body?: { items?: { item?: Record<string, string> | Array<Record<string, string>> } }
    }
  }
  const item = json.response?.body?.items?.item
  if (!item) return null
  return Array.isArray(item) ? (item[0] ?? null) : item
}

const stripHtml = (html: string | undefined): string => {
  if (!html) return ''
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+\n/g, '\n')
    .trim()
}

export const tourDetail = onCall(
  { secrets: [TOUR_API_KEY], region: 'asia-northeast3' },
  async (request) => {
    const data = (request.data ?? {}) as { contentId?: unknown; lang?: unknown }
    const contentId = sanitizeContentId(data.contentId)
    const service = resolveService(data.lang)
    let key: string | undefined
    try {
      key = TOUR_API_KEY.value()
    } catch {
      key = process.env.TOUR_API_KEY || undefined
    }

    if (!key || key === 'placeholder') {
      return { source: 'mock' as const, detail: null }
    }

    try {
      const common = await callTourApi(service, 'detailCommon2', {
        serviceKey: key,
        contentId,
      })
      if (!common) return { source: 'live' as const, detail: null }

      const contentTypeId = String(common.contenttypeid ?? '12')

      const [intro] = await Promise.all([
        callTourApi(service, 'detailIntro2', {
          serviceKey: key,
          contentId,
          contentTypeId,
        }).catch(() => null),
      ])

      const detail = {
        contentId: String(common.contentid ?? contentId),
        title: String(common.title ?? ''),
        addr: String(common.addr1 ?? ''),
        tel: String(common.tel ?? ''),
        homepage: stripHtml(common.homepage as string | undefined),
        overview: stripHtml(common.overview as string | undefined),
        firstImage: common.firstimage ? String(common.firstimage) : null,
        firstImageSmall: common.firstimage2 ? String(common.firstimage2) : null,
        mapX: Number(common.mapx) || null,
        mapY: Number(common.mapy) || null,
        useTime: intro ? stripHtml(intro.usetime as string | undefined) : '',
        restDate: intro ? stripHtml(intro.restdate as string | undefined) : '',
        parking: intro ? stripHtml(intro.parking as string | undefined) : '',
      }

      return { source: 'live' as const, detail }
    } catch (err) {
      logger.warn('tourDetail failed', {
        err: err instanceof Error ? err.message : String(err),
        service,
        contentId,
      })
      return { source: 'error' as const, detail: null }
    }
  },
)

export const tourNearby = onCall(
  { secrets: [TOUR_API_KEY], region: 'asia-northeast3' },
  async (request) => {
    const data = (request.data ?? {}) as {
      lat?: unknown
      lng?: unknown
      radius?: unknown
      lang?: unknown
      pageNo?: unknown
      numOfRows?: unknown
    }
    const lat = Number(data.lat)
    const lng = Number(data.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new HttpsError('invalid-argument', 'lat/lng required')
    }
    if (lat < 33 || lat > 39 || lng < 124 || lng > 132) {
      throw new HttpsError('invalid-argument', 'coordinates out of Korea bounds')
    }
    const radius = Math.min(Math.max(Number(data.radius) || 2000, 100), 200000)
    const pageNo = Math.max(1, Math.min(100, Number(data.pageNo) || 1))
    const numOfRows = Math.max(10, Math.min(100, Number(data.numOfRows) || 40))
    const service = resolveService(data.lang)
    let key: string | undefined
    try {
      key = TOUR_API_KEY.value()
    } catch {
      key = process.env.TOUR_API_KEY || undefined
    }
    if (!key || key === 'placeholder') {
      return { source: 'mock' as const, items: [] }
    }

    try {
      const url = new URL(`https://apis.data.go.kr/B551011/${service}/locationBasedList2`)
      url.searchParams.set('serviceKey', key)
      url.searchParams.set('MobileOS', 'ETC')
      url.searchParams.set('MobileApp', 'NWK')
      url.searchParams.set('_type', 'json')
      url.searchParams.set('numOfRows', String(numOfRows))
      url.searchParams.set('pageNo', String(pageNo))
      url.searchParams.set('arrange', 'Q')
      url.searchParams.set('mapX', String(lng))
      url.searchParams.set('mapY', String(lat))
      url.searchParams.set('radius', String(radius))

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = await res.text()
      if (body.trim().startsWith('<')) throw new Error('non-json response')
      const json = JSON.parse(body) as {
        response?: {
          body?: { totalCount?: number; items?: { item?: Array<Record<string, string>> } }
        }
      }
      const totalCount = Number(json.response?.body?.totalCount) || 0
      const raw = json.response?.body?.items?.item ?? []
      const list = Array.isArray(raw) ? raw : [raw]
      const items = list
        .map((r) => ({
          id: String(r.contentid ?? ''),
          title: String(r.title ?? ''),
          addr: String(r.addr1 ?? ''),
          lat: Number(r.mapy) || 0,
          lng: Number(r.mapx) || 0,
          thumbnail: r.firstimage ? String(r.firstimage) : undefined,
          contentTypeId: String(r.contenttypeid ?? ''),
          dist: Number(r.dist) || null,
        }))
        .filter((r) => r.id && r.lat && r.lng)

      return { source: 'live' as const, items, radius, totalCount }
    } catch (err) {
      logger.warn('tourNearby failed', {
        err: err instanceof Error ? err.message : String(err),
      })
      return { source: 'error' as const, items: [] }
    }
  },
)
