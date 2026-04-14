import { onRequest } from 'firebase-functions/v2/https'
import { setGlobalOptions } from 'firebase-functions/v2'
import cors from 'cors'

setGlobalOptions({ region: 'asia-northeast3', maxInstances: 10 })

const ALLOWED_ORIGINS = [
  'https://nwk-app-ba6f8.web.app',
  'https://nwk-app-ba6f8.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5000',
]

const corsHandler = cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      cb(null, true)
    } else {
      cb(new Error('Not allowed by CORS'))
    }
  },
})

export const api = onRequest((req, res) => {
  corsHandler(req, res, () => {
    res.status(200).json({
      ok: true,
      service: 'nwk-api',
      time: new Date().toISOString(),
    })
  })
})

export { tourSearch } from './tour-api'
export { tourDetail, tourNearby } from './tour-detail'
export { mapTile } from './map-tile'
