#!/usr/bin/env node
// Queries TourAPI KorService2/EngService2 for the five curated NWK
// hotspots and emits src/data/live-hotspots.json with real titles,
// addresses, thumbnails and contentIds pulled from the Korea
// Tourism Organization public dataset.
//
// Usage:
//   DATA_GO_KR_KEY=... node scripts/sync-tour-hotspots.mjs

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUT = resolve(ROOT, 'src/data/live-hotspots.json')

// Curated list — picked for multilingual audience coverage and NWK's
// narrative (palace, shopping district, beach, Jeju peak, UNESCO temple).
// Each hotspot has per-language keyword + a preferred title prefix used
// to pick the correct row out of noisy keyword search results (English
// results in particular are dominated by 'Tax Refund Shop' entries).
const HOTSPOT_QUERIES = [
  {
    id: 'gyeongbokgung',
    region: 'seoul-jongno',
    ko: { keyword: '경복궁', prefix: '경복궁' },
    en: { keyword: 'Gyeongbokgung', prefix: 'Gyeongbokgung Palace' },
    ja: { keyword: '景福宮', prefix: '景福宮' },
    zh: { keyword: '景福宫', prefix: '景福宫' },
  },
  {
    id: 'nseoultower',
    region: 'seoul-jung',
    ko: { keyword: '남산서울타워', prefix: '남산서울타워' },
    en: { keyword: 'N Seoul Tower', prefix: 'N Seoul Tower' },
    ja: { keyword: '南山ソウルタワー', prefix: '南山ソウルタワー' },
    zh: { keyword: '南山首尔塔', prefix: '南山首尔塔' },
  },
  {
    id: 'haeundae',
    region: 'busan',
    ko: { keyword: '해운대해수욕장', prefix: '해운대해수욕장' },
    en: { keyword: 'Haeundae Beach', prefix: 'Haeundae Beach' },
    ja: { keyword: '海雲台海水浴場', prefix: '海雲台海水浴場' },
    zh: { keyword: '海云台海水浴场', prefix: '海云台海水浴场' },
  },
  {
    id: 'seongsan',
    region: 'jeju',
    ko: { keyword: '성산일출봉', prefix: '성산일출봉' },
    en: { keyword: 'Seongsan Ilchulbong', prefix: 'Seongsan Ilchulbong' },
    ja: { keyword: '城山日出峰', prefix: '城山日出峰' },
    zh: { keyword: '城山日出峰', prefix: '城山日出峰' },
  },
  {
    id: 'bulguksa',
    region: 'gyeongju',
    ko: { keyword: '불국사', prefix: '경주 불국사' },
    en: { keyword: 'Bulguksa', prefix: 'Gyeongju Bulguksa' },
    ja: { keyword: '仏国寺', prefix: '仏国寺' },
    zh: { keyword: '佛国寺', prefix: '佛国寺' },
  },
]

const SERVICE_BY_LANG = {
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

// TourAPI contentTypeId taxonomy varies across language services:
//   KorService2 → 12=관광지, 14=문화시설, 15=행사, 25=여행코스,
//                  28=레포츠, 32=숙박, 38=쇼핑, 39=음식점
//   EngService2 / JpnService2 / ChsService2 → 76=attraction, 78=culture,
//                  79=shopping (Tax Refund shops dominate search)
// Allow everything that looks like an attraction or cultural facility
// across any language, and exclude shopping (38, 79) implicitly.
const ATTRACTION_TYPES = new Set(['12', '14', '76', '78'])

const searchKeyword = async (service, keyword, prefix, key) => {
  const url = new URL(`https://apis.data.go.kr/B551011/${service}/searchKeyword2`)
  url.searchParams.set('serviceKey', key)
  url.searchParams.set('MobileOS', 'ETC')
  url.searchParams.set('MobileApp', 'NWK')
  url.searchParams.set('_type', 'json')
  url.searchParams.set('numOfRows', '40')
  url.searchParams.set('pageNo', '1')
  url.searchParams.set('arrange', 'Q')
  url.searchParams.set('keyword', keyword)

  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${service}`)
  const body = await res.text()
  if (body.trim().startsWith('<')) {
    throw new Error(`non-json from ${service}: ${body.slice(0, 60)}`)
  }
  const json = JSON.parse(body)
  const item = json.response?.body?.items?.item
  if (!item) return null
  const list = Array.isArray(item) ? item : [item]

  const attractions = list.filter((r) => ATTRACTION_TYPES.has(String(r.contenttypeid ?? '')))

  const titleOf = (r) => String(r.title ?? '').trim()
  // 1. exact prefix match among attractions
  const exact = attractions.find((r) => titleOf(r) === prefix)
  if (exact) return exact
  // 2. title starts with prefix among attractions
  const starts = attractions.find((r) => titleOf(r).startsWith(prefix))
  if (starts) return starts
  // 3. any attraction whose title contains the prefix
  const contains = attractions.find((r) => titleOf(r).includes(prefix))
  if (contains) return contains
  // 4. fall back to first attraction
  if (attractions.length > 0) return attractions[0]
  return list[0]
}

const pickBest = (row, fallback) => {
  if (!row) return null
  return {
    contentId: String(row.contentid ?? ''),
    title: String(row.title ?? fallback),
    addr: String(row.addr1 ?? ''),
    lat: Number(row.mapy) || 0,
    lng: Number(row.mapx) || 0,
    thumbnail: row.firstimage ? String(row.firstimage) : null,
    thumbnailSmall: row.firstimage2 ? String(row.firstimage2) : null,
    contentTypeId: String(row.contenttypeid ?? ''),
  }
}

const detailCommon = async (service, contentId, key) => {
  const url = new URL(`https://apis.data.go.kr/B551011/${service}/detailCommon2`)
  url.searchParams.set('serviceKey', key)
  url.searchParams.set('MobileOS', 'ETC')
  url.searchParams.set('MobileApp', 'NWK')
  url.searchParams.set('_type', 'json')
  url.searchParams.set('contentId', contentId)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${service}`)
  const body = await res.text()
  if (body.trim().startsWith('<')) throw new Error(`non-json from ${service}`)
  const json = JSON.parse(body)
  const item = json.response?.body?.items?.item
  if (!item) return null
  return Array.isArray(item) ? item[0] : item
}

const main = async () => {
  const key = await readKey()
  const hotspots = []

  for (const q of HOTSPOT_QUERIES) {
    process.stdout.write(`  ${q.id}...\n`)
    const results = {}
    for (const lang of ['ko', 'en', 'ja', 'zh']) {
      const spec = q[lang]
      if (!spec) {
        results[lang] = null
        continue
      }
      try {
        const row = await searchKeyword(SERVICE_BY_LANG[lang], spec.keyword, spec.prefix, key)
        results[lang] = pickBest(row, spec.keyword)
      } catch (err) {
        process.stdout.write(`    ${lang}: ${err.message}\n`)
        results[lang] = null
      }
    }
    hotspots.push({
      id: q.id,
      region: q.region,
      ko: results.ko,
      en: results.en,
      ja: results.ja,
      zh: results.zh,
    })
  }

  const output = {
    source: '한국관광공사 TourAPI (KorService2 + EngService2)',
    sourceUrl: 'https://www.data.go.kr/data/15101578/openapi.do',
    fetchedAt: new Date().toISOString(),
    hotspots,
  }

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(output, null, 2) + '\n')
  process.stdout.write(`Wrote ${hotspots.length} hotspots to ${OUT}\n`)
}

main().catch((err) => {
  console.error('sync failed:', err.message)
  process.exit(1)
})
