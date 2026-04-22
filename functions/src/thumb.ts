import { onRequest } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'

// sharp 네이티브 바인딩은 무거워서 모듈 최상위에서 불러오면 Functions
// analyze 단계(10s) 안에 backend spec 검사가 끝나지 않는다.
// 핸들러 내부에서 동적 import로 지연 로드한다.

const ALLOWED_HOSTS = new Set([
  'tong.visitkorea.or.kr',
  'cdn.tour.visitkorea.or.kr',
  'api.visitkorea.or.kr',
])

const ALLOWED_WIDTHS = new Set([320, 480, 640, 960])
const DEFAULT_WIDTH = 480
const DEFAULT_QUALITY = 75
const FETCH_TIMEOUT_MS = 8000

// 1x1 투명 WebP — 실패 시 폴백
const BLANK_WEBP = Buffer.from('UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=', 'base64')

const parseWidth = (raw: unknown): number => {
  const n = Number(raw)
  if (!Number.isFinite(n)) return DEFAULT_WIDTH
  return ALLOWED_WIDTHS.has(n) ? n : DEFAULT_WIDTH
}

const parseSourceUrl = (raw: unknown): URL | null => {
  if (typeof raw !== 'string' || !raw) return null
  try {
    const u = new URL(raw)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
    if (!ALLOWED_HOSTS.has(u.hostname)) return null
    u.protocol = 'https:'
    return u
  } catch {
    return null
  }
}

const fetchWithTimeout = async (url: string, ms: number): Promise<Response> => {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

export const thumb = onRequest(
  { region: 'asia-northeast3', memory: '512MiB', cors: true, maxInstances: 20 },
  async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.status(405).send('method not allowed')
      return
    }

    const src = parseSourceUrl(req.query.url)
    if (!src) {
      res.status(400).send('bad url')
      return
    }
    const width = parseWidth(req.query.w)

    try {
      const upstream = await fetchWithTimeout(src.toString(), FETCH_TIMEOUT_MS)
      if (!upstream.ok) {
        logger.warn('thumb upstream non-ok', { url: src.toString(), status: upstream.status })
        res.setHeader('Content-Type', 'image/webp')
        res.setHeader('Cache-Control', 'public, max-age=300')
        res.status(200).send(BLANK_WEBP)
        return
      }
      const input = Buffer.from(await upstream.arrayBuffer())
      const { default: sharp } = await import('sharp')
      const out = await sharp(input, { failOn: 'none' })
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: DEFAULT_QUALITY, effort: 4 })
        .toBuffer()

      res.setHeader('Content-Type', 'image/webp')
      res.setHeader(
        'Cache-Control',
        'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400, immutable',
      )
      res.setHeader('X-Thumb-Width', String(width))
      res.status(200).send(out)
    } catch (err) {
      logger.error('thumb failed', { url: src.toString(), err })
      res.setHeader('Content-Type', 'image/webp')
      res.setHeader('Cache-Control', 'public, max-age=300')
      res.status(200).send(BLANK_WEBP)
    }
  },
)
