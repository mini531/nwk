import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { logger } from 'firebase-functions/v2'

const VWORLD_API_KEY = defineSecret('VWORLD_API_KEY')

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
      key = undefined
    }
    if (!key) {
      logger.error('mapTile: VWORLD_API_KEY not configured')
      res.status(503).send('map key not configured')
      return
    }

    const url = `https://api.vworld.kr/req/wmts/1.0.0/${key}/${layer}/${z}/${y}/${x}.png`

    try {
      const upstream = await fetch(url)
      if (!upstream.ok) {
        logger.warn('vworld upstream', { status: upstream.status, z, x, y, layer })
        res.status(upstream.status).send('upstream error')
        return
      }
      const buf = Buffer.from(await upstream.arrayBuffer())
      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800')
      res.status(200).send(buf)
    } catch (err) {
      logger.error('mapTile fetch failed', err)
      res.status(502).send('bad gateway')
    }
  },
)
