import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { logger } from 'firebase-functions/v2'

const VWORLD_API_KEY = defineSecret('VWORLD_API_KEY')

// 1x1 투명 PNG (최소 크기) — VWorld 오류/범위 밖 타일 대체용
const BLANK_TILE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAB' +
    'Nl7BcQAAAABJRU5ErkJggg==',
  'base64',
)

const ALLOWED_ORIGINS = new Set([
  'https://nwk-app-ba6f8.web.app',
  'https://nwk-app-ba6f8.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5000',
])

const LAYERS = new Set(['Base', 'gray', 'midnight', 'Satellite', 'Hybrid'])
const MAX_ZOOM = 19

const setCors = (
  req: { headers: Record<string, string | string[] | undefined> },
  res: {
    setHeader: (k: string, v: string) => void
  },
) => {
  const origin = (req.headers.origin as string | undefined) ?? ''
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
}

export const mapTile = onRequest(
  { secrets: [VWORLD_API_KEY], region: 'asia-northeast3', cors: false },
  async (req, res) => {
    setCors(req, res)
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    if (req.method !== 'GET') {
      res.status(405).send('method not allowed')
      return
    }

    const layer = String(req.query.layer ?? 'Base')
    const z = Number(req.query.z)
    const x = Number(req.query.x)
    const y = Number(req.query.y)

    if (!LAYERS.has(layer)) {
      res.status(400).send('bad layer')
      return
    }
    if (!Number.isInteger(z) || !Number.isInteger(x) || !Number.isInteger(y)) {
      res.status(400).send('bad tile coords')
      return
    }
    if (z < 0 || z > MAX_ZOOM || x < 0 || y < 0) {
      res.status(400).send('out of range')
      return
    }

    let key: string | undefined
    try {
      key = VWORLD_API_KEY.value()
    } catch {
      key = process.env.VWORLD_API_KEY || undefined
    }
    if (!key) {
      logger.error('mapTile: VWORLD_API_KEY not configured')
      res.status(503).send('map key not configured')
      return
    }

    // VWorld Base/gray/midnight: z 6~19, Satellite/Hybrid: z 6~19
    if (z < 6) {
      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Cache-Control', 'public, max-age=86400')
      res.status(200).send(BLANK_TILE)
      return
    }

    const isJpegLayer = layer === 'Satellite' || layer === 'Hybrid'
    const ext = isJpegLayer ? 'jpeg' : 'png'
    const contentType = isJpegLayer ? 'image/jpeg' : 'image/png'
    const url = `https://api.vworld.kr/req/wmts/1.0.0/${key}/${layer}/${z}/${y}/${x}.${ext}`

    try {
      const upstream = await fetch(url)
      const buf = Buffer.from(await upstream.arrayBuffer())

      // VWorld 는 범위 밖 타일이나 키 오류 시 200 + XML 을 반환함
      // PNG (0x89 50 4E 47) 또는 JPEG (0xFF D8 FF) magic bytes 로 이미지 여부 확인
      const isPng =
        buf.length > 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47
      const isJpeg = buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
      const isImage = isJpegLayer ? isJpeg : isPng
      if (!upstream.ok || !isImage) {
        if (!isImage && buf.length > 0) {
          logger.warn('vworld non-image response', {
            z,
            x,
            y,
            layer,
            size: buf.length,
            head: buf.subarray(0, 40).toString('utf8'),
          })
        }
        res.setHeader('Content-Type', 'image/png')
        res.setHeader('Cache-Control', 'public, max-age=3600')
        res.status(200).send(BLANK_TILE)
        return
      }

      res.setHeader('Content-Type', contentType)
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800')
      res.status(200).send(buf)
    } catch (err) {
      logger.error('mapTile fetch failed', err)
      // 네트워크 오류 시에도 빈 타일 반환 (지도 깨짐 방지)
      res.setHeader('Content-Type', 'image/png')
      res.status(200).send(BLANK_TILE)
    }
  },
)
