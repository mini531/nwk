import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { logger } from 'firebase-functions/v2'

const TOUR_API_KEY = defineSecret('TOUR_API_KEY')

const MAX_LEN = 50
const SAFE_RE = /[<>"'`;{}\\]/g

interface TourItem {
  id: string
  title: string
  addr: string
  lat: number
  lng: number
  thumbnail?: string
}

const MOCK_ITEMS: TourItem[] = [
  {
    id: 'mock-1',
    title: '경복궁',
    addr: '서울특별시 종로구 사직로 161',
    lat: 37.579617,
    lng: 126.977041,
  },
  {
    id: 'mock-2',
    title: '남산서울타워',
    addr: '서울특별시 용산구 남산공원길 105',
    lat: 37.551169,
    lng: 126.988227,
  },
  {
    id: 'mock-3',
    title: '북촌한옥마을',
    addr: '서울특별시 종로구 계동길 37',
    lat: 37.582604,
    lng: 126.983998,
  },
]

const sanitize = (raw: unknown): string => {
  if (typeof raw !== 'string') {
    throw new HttpsError('invalid-argument', 'keyword must be a string')
  }
  const cleaned = raw.replace(SAFE_RE, '').trim().slice(0, MAX_LEN)
  if (!cleaned) {
    throw new HttpsError('invalid-argument', 'keyword is empty')
  }
  return cleaned
}

const fetchTourApi = async (key: string, keyword: string): Promise<TourItem[]> => {
  const url = new URL('https://apis.data.go.kr/B551011/KorService2/searchKeyword2')
  url.searchParams.set('serviceKey', key)
  url.searchParams.set('MobileOS', 'ETC')
  url.searchParams.set('MobileApp', 'NWK')
  url.searchParams.set('_type', 'json')
  url.searchParams.set('numOfRows', '20')
  url.searchParams.set('pageNo', '1')
  url.searchParams.set('keyword', keyword)

  const res = await fetch(url.toString())
  if (!res.ok) throw new HttpsError('internal', `tour-api ${res.status}`)
  const json = (await res.json()) as {
    response?: { body?: { items?: { item?: Array<Record<string, string>> } } }
  }
  const raw = json.response?.body?.items?.item ?? []
  return raw.map((r) => ({
    id: String(r.contentid),
    title: String(r.title ?? ''),
    addr: String(r.addr1 ?? ''),
    lat: Number(r.mapy) || 0,
    lng: Number(r.mapx) || 0,
    thumbnail: r.firstimage || undefined,
  }))
}

export const tourSearch = onCall(
  { secrets: [TOUR_API_KEY], region: 'asia-northeast3' },
  async (request) => {
    const keyword = sanitize((request.data as { keyword?: unknown })?.keyword)
    let key: string | undefined
    try {
      key = TOUR_API_KEY.value()
    } catch {
      key = undefined
    }

    if (!key) {
      logger.info('tourSearch: no key set, returning mock', { keyword })
      const filtered = MOCK_ITEMS.filter((i) => i.title.includes(keyword))
      return {
        items: filtered.length ? filtered : MOCK_ITEMS,
        source: 'mock' as const,
      }
    }

    try {
      const items = await fetchTourApi(key, keyword)
      return { items, source: 'live' as const }
    } catch (err) {
      logger.error('tourSearch live call failed', err)
      throw new HttpsError('internal', 'tour-api failed')
    }
  },
)
