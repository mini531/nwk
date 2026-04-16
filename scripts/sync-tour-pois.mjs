#!/usr/bin/env node
// Fetches top tourist POIs across major Korean regions via
// KorService2 areaBasedList2 and writes a normalized GeoJSON bundle
// to src/data/live-tour-pois.json. Powers the map-first /search tab.
//
// Usage:
//   DATA_GO_KR_KEY=... node scripts/sync-tour-pois.mjs

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUT = resolve(ROOT, 'src/data/live-tour-pois.json')

// TourAPI areaCode:
//   1=서울, 2=인천, 6=부산, 39=제주, 37=경북, 35=강원, 32=경기
// contentTypeId 12 = 관광지 (attraction), 14 = 문화시설
const REGIONS = [
  { areaCode: 1, region: 'seoul', label: '서울' },
  { areaCode: 6, region: 'busan', label: '부산' },
  { areaCode: 39, region: 'jeju', label: '제주' },
  { areaCode: 37, region: 'gyeongbuk', label: '경북' },
  { areaCode: 35, region: 'gangwon', label: '강원' },
  { areaCode: 32, region: 'gyeonggi', label: '경기' },
]

const CONTENT_TYPES = [
  { id: '12', tag: 'attraction' },
  { id: '14', tag: 'culture' },
]

const LANG_SERVICES = {
  ko: 'KorService2',
  en: 'EngService2',
  ja: 'JpnService2',
  zh: 'ChsService2',
}

const readKey = async () => {
  if (process.env.DATA_GO_KR_KEY) return process.env.DATA_GO_KR_KEY.trim()
  try {
    const txt = await readFile(resolve(ROOT, 'functions/.secret.local'), 'utf8')
    const match = txt.match(/^DATA_GO_KR_KEY=(.+)$/m)
    if (match) return match[1].trim()
  } catch {}
  throw new Error('DATA_GO_KR_KEY not found in env or functions/.secret.local')
}

const areaBasedList = async (key, service, areaCode, contentTypeId, pageNo) => {
  const url = new URL(`https://apis.data.go.kr/B551011/${service}/areaBasedList2`)
  url.searchParams.set('serviceKey', key)
  url.searchParams.set('MobileOS', 'ETC')
  url.searchParams.set('MobileApp', 'NWK')
  url.searchParams.set('_type', 'json')
  url.searchParams.set('numOfRows', '50')
  url.searchParams.set('pageNo', String(pageNo))
  url.searchParams.set('arrange', 'Q') // image-first
  url.searchParams.set('areaCode', String(areaCode))
  url.searchParams.set('contentTypeId', contentTypeId)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const body = await res.text()
  if (body.trim().startsWith('<')) throw new Error('non-json response')
  const json = JSON.parse(body)
  const item = json.response?.body?.items?.item ?? []
  return Array.isArray(item) ? item : [item]
}

const toFeature = (row, regionTag, typeTag) => {
  const lng = Number(row.mapx)
  const lat = Number(row.mapy)
  if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng === 0 || lat === 0) return null
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties: {
      id: String(row.contentid),
      title: String(row.title ?? '').trim(),
      addr: String(row.addr1 ?? ''),
      thumbnail: row.firstimage ? String(row.firstimage) : null,
      thumbnailSmall: row.firstimage2 ? String(row.firstimage2) : null,
      contentTypeId: String(row.contenttypeid ?? ''),
      typeTag,
      region: regionTag,
    },
  }
}

const main = async () => {
  const key = await readKey()
  const features = []
  const seen = new Set()

  // KorService2 has the cleanest taxonomy (12=관광지, 14=문화시설). The
  // foreign-language services (Eng/Jpn/Chs) re-bucket the same entries
  // under different contentTypeIds that don't map cleanly to
  // attraction/culture, so we stick to KO for the static cluster and
  // let the top search bar hit tourSearch() live for user-language
  // translations.
  for (const region of REGIONS) {
    for (const type of CONTENT_TYPES) {
      const rows = await areaBasedList(key, 'KorService2', region.areaCode, type.id, 1)
      process.stdout.write(`  ${region.label} ${type.tag}: ${rows.length}\n`)
      for (const row of rows) {
        const feat = toFeature(row, region.region, type.tag)
        if (!feat) continue
        const fid = feat.properties.id
        if (seen.has(fid)) continue
        seen.add(fid)
        features.push(feat)
      }
    }
  }

  const output = {
    type: 'FeatureCollection',
    source: '한국관광공사 TourAPI KorService2 areaBasedList2',
    sourceUrl: 'https://www.data.go.kr/data/15101578/openapi.do',
    fetchedAt: new Date().toISOString(),
    featureCount: features.length,
    features,
  }

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(output) + '\n')
  process.stdout.write(`\nWrote ${features.length} POIs to ${OUT}\n`)
}

main().catch((err) => {
  console.error('sync failed:', err.message)
  process.exit(1)
})
