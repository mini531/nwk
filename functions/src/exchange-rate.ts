import { onRequest, type Request } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { logger } from 'firebase-functions/v2'
import { initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import type { Response } from 'express'

// 한국은행 ECOS OpenAPI 인증키. https://ecos.bok.or.kr 에서 무료 발급.
// 설정: `firebase functions:secrets:set BOK_ECOS_KEY`
const BOK_ECOS_KEY = defineSecret('BOK_ECOS_KEY')

const ALLOWED_ORIGINS = new Set([
  'https://nwkorea.com',
  'https://www.nwkorea.com',
  'https://nwk-app-ba6f8.web.app',
  'https://nwk-app-ba6f8.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5000',
])

const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6시간

// ECOS statistic code: 731Y001 = 일일 원/달러 매매기준율
// 주기 DD, 통계항목 0000001
const ECOS_STAT_CODE = '731Y001'
const ECOS_CYCLE = 'DD'
const ECOS_ITEM_CODE = '0000001'

interface CachedRate {
  rate: number
  date: string // YYYYMMDD
  source: string
  sourceUrl: string
  statCode: string
  fetchedAt: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue
}

const ensureAdmin = () => {
  if (getApps().length === 0) initializeApp()
}

const formatYmd = (d: Date): string => {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

const setCors = (req: Request, res: Response) => {
  const origin = req.get('origin') ?? ''
  if (ALLOWED_ORIGINS.has(origin)) {
    res.set('Access-Control-Allow-Origin', origin)
    res.set('Vary', 'Origin')
  }
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
}

const fetchFromEcos = async (key: string): Promise<{ rate: number; date: string } | null> => {
  // 오늘 기준 최근 7영업일 범위로 조회 → 가장 최신 값 사용 (주말·공휴일 보정)
  const end = new Date()
  const start = new Date(end.getTime() - 10 * 24 * 60 * 60 * 1000)
  const url =
    `https://ecos.bok.or.kr/api/StatisticSearch/${encodeURIComponent(key)}` +
    `/json/kr/1/10/${ECOS_STAT_CODE}/${ECOS_CYCLE}/${formatYmd(start)}/${formatYmd(end)}/${ECOS_ITEM_CODE}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`ECOS HTTP ${res.status}`)
  const body = (await res.json()) as {
    StatisticSearch?: { row?: Array<{ DATA_VALUE?: string; TIME?: string }> }
    RESULT?: { CODE?: string; MESSAGE?: string }
  }
  if (body.RESULT && body.RESULT.CODE && body.RESULT.CODE !== 'INFO-000') {
    throw new Error(`ECOS ${body.RESULT.CODE}: ${body.RESULT.MESSAGE ?? ''}`)
  }
  const rows = body.StatisticSearch?.row ?? []
  if (rows.length === 0) return null
  const latest = rows[rows.length - 1]
  const rate = Number(latest.DATA_VALUE)
  const date = String(latest.TIME ?? '')
  if (!Number.isFinite(rate) || rate <= 0 || !date) return null
  return { rate, date }
}

export const exchangeRate = onRequest(
  { secrets: [BOK_ECOS_KEY], region: 'asia-northeast3' },
  async (req, res) => {
    setCors(req, res)
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'method not allowed' })
      return
    }

    ensureAdmin()
    const db = getFirestore()
    const ref = db.collection('livePrices').doc('exchangeRate')

    let cached: CachedRate | null = null
    try {
      const snap = await ref.get()
      if (snap.exists) cached = snap.data() as CachedRate
    } catch (err) {
      logger.warn('exchangeRate cache read failed', err)
    }

    const now = Date.now()
    const fetchedAt =
      (cached?.fetchedAt as FirebaseFirestore.Timestamp | undefined)?.toMillis?.() ?? 0
    const fresh = cached && now - fetchedAt < CACHE_TTL_MS

    if (fresh && cached) {
      res.set('Cache-Control', 'public, max-age=1800')
      res.json(sanitize(cached))
      return
    }

    let key: string | undefined
    try {
      key = BOK_ECOS_KEY.value()
    } catch {
      key = process.env.BOK_ECOS_KEY || undefined
    }

    if (!key || key === 'placeholder') {
      if (cached) {
        res.set('Cache-Control', 'public, max-age=600')
        res.json(sanitize(cached))
        return
      }
      res.status(503).json({ error: 'ECOS key not configured' })
      return
    }

    try {
      const live = await fetchFromEcos(key)
      if (!live) {
        if (cached) {
          res.json(sanitize(cached))
          return
        }
        res.status(502).json({ error: 'ECOS returned no rows' })
        return
      }
      const payload: CachedRate = {
        rate: live.rate,
        date: live.date,
        source: '한국은행 ECOS · 원/달러 매매기준율 (일별)',
        sourceUrl: 'https://ecos.bok.or.kr/api/',
        statCode: ECOS_STAT_CODE,
        fetchedAt: FieldValue.serverTimestamp(),
      }
      await ref.set(payload)
      res.set('Cache-Control', 'public, max-age=1800')
      res.json({ ...sanitize(payload), date: live.date })
    } catch (err) {
      logger.error('exchangeRate ECOS fetch failed', err)
      if (cached) {
        res.set('Cache-Control', 'public, max-age=300')
        res.json(sanitize(cached))
        return
      }
      res.status(502).json({ error: 'ECOS fetch failed' })
    }
  },
)

const sanitize = (c: CachedRate) => ({
  rate: c.rate,
  date: c.date,
  source: c.source,
  sourceUrl: c.sourceUrl,
  statCode: c.statCode,
})
