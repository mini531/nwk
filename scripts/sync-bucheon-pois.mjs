#!/usr/bin/env node
// Fetches TourAPI POIs for the Bucheon-specialized course feature.
// Collects 부천 + 인근 시군구 across 4 language services (Kor/Eng/Jpn/Chs),
// merges translations by contentId, and writes a single multilang bundle.
//
// Output: src/data/live-bucheon-pois.json
//
// Usage:
//   DATA_GO_KR_KEY=... node scripts/sync-bucheon-pois.mjs
//   DATA_GO_KR_KEY=... node scripts/sync-bucheon-pois.mjs --probe   (count-only dry run)

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUT = resolve(ROOT, 'src/data/live-bucheon-pois.json')
const PROBE = process.argv.includes('--probe')

// TourAPI areaCode (KorService2): 1=서울, 2=인천, 31=경기
// Target 시군구 — Bucheon core + immediate neighbors on the 1호선·7호선 belt.
const TARGETS = [
  { areaCode: 31, sigunguName: '부천시', role: 'core' },
  { areaCode: 31, sigunguName: '광명시', role: 'nearby' },
  { areaCode: 31, sigunguName: '김포시', role: 'nearby' },
  { areaCode: 2, sigunguName: '부평구', role: 'nearby' },
  { areaCode: 1, sigunguName: '강서구', role: 'nearby' },
  { areaCode: 1, sigunguName: '구로구', role: 'nearby' },
]

// contentTypeId → tag
// 12=관광지, 14=문화시설, 15=축제공연행사, 28=레포츠, 38=쇼핑, 39=음식점
const CONTENT_TYPES = [
  { id: '12', tag: 'attraction' },
  { id: '14', tag: 'culture' },
  { id: '15', tag: 'festival' },
  { id: '28', tag: 'leisure' },
  { id: '38', tag: 'shopping' },
  { id: '39', tag: 'food' },
]

const LANG_SERVICES = {
  ko: 'KorService2',
  en: 'EngService2',
  ja: 'JpnService2',
  zh: 'ChsService2',
}

const BASE = 'https://apis.data.go.kr/B551011'

const readKey = async () => {
  if (process.env.DATA_GO_KR_KEY) return process.env.DATA_GO_KR_KEY.trim()
  try {
    const txt = await readFile(resolve(ROOT, 'functions/.secret.local'), 'utf8')
    const m = txt.match(/^DATA_GO_KR_KEY=(.+)$/m)
    if (m) return m[1].trim()
  } catch {}
  try {
    const txt = await readFile(resolve(ROOT, 'functions/.env.local'), 'utf8')
    const m = txt.match(/^TOUR_API_KEY=(.+)$/m)
    if (m && m[1].trim()) return m[1].trim()
  } catch {}
  throw new Error('DATA_GO_KR_KEY not set (env or functions/.secret.local or functions/.env.local)')
}

const callTourApi = async (key, service, endpoint, params = {}) => {
  const url = new URL(`${BASE}/${service}/${endpoint}`)
  url.searchParams.set('serviceKey', key)
  url.searchParams.set('MobileOS', 'ETC')
  url.searchParams.set('MobileApp', 'NWK')
  url.searchParams.set('_type', 'json')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${endpoint}`)
  const body = await res.text()
  if (body.trim().startsWith('<')) {
    const err = body.match(/<returnReasonCode>([^<]+)/)?.[1] ?? 'unknown'
    throw new Error(`TourAPI error (${endpoint}): ${err}`)
  }
  const json = JSON.parse(body)
  const item = json.response?.body?.items?.item ?? []
  return Array.isArray(item) ? item : item ? [item] : []
}

// Resolve 시군구명 → sigunguCode for each target areaCode via areaCode2.
const resolveSigunguCodes = async (key) => {
  const byArea = new Map()
  const areaCodes = [...new Set(TARGETS.map((t) => t.areaCode))]
  for (const areaCode of areaCodes) {
    const rows = await callTourApi(key, 'KorService2', 'areaCode2', {
      numOfRows: 100,
      pageNo: 1,
      areaCode,
    })
    const map = new Map()
    for (const r of rows) map.set(String(r.name).trim(), String(r.code))
    byArea.set(areaCode, map)
  }
  return TARGETS.map((t) => {
    const code = byArea.get(t.areaCode)?.get(t.sigunguName)
    if (!code) throw new Error(`sigunguCode not found for ${t.sigunguName} (area ${t.areaCode})`)
    return { ...t, sigunguCode: code }
  })
}

const fetchAllPages = async (key, service, areaCode, sigunguCode, contentTypeId) => {
  const rows = []
  let pageNo = 1
  const numOfRows = 100
  while (pageNo <= 10) {
    const page = await callTourApi(key, service, 'areaBasedList2', {
      numOfRows,
      pageNo,
      arrange: 'Q',
      areaCode,
      sigunguCode,
      contentTypeId,
    })
    rows.push(...page)
    if (page.length < numOfRows) break
    pageNo += 1
  }
  return rows
}

const httpsify = (u) => {
  if (!u) return null
  const s = String(u).trim()
  return s ? s.replace(/^http:\/\//i, 'https://') : null
}

const extractCoreFields = (row) => {
  const lng = Number(row.mapx)
  const lat = Number(row.mapy)
  if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng === 0 || lat === 0) return null
  return {
    coords: { lat, lng },
    thumbnail: httpsify(row.firstimage),
    thumbnailSmall: httpsify(row.firstimage2),
  }
}

const extractLangFields = (row) => ({
  title: String(row.title ?? '').trim(),
  addr: String(row.addr1 ?? '').trim(),
})

const main = async () => {
  const key = await readKey()
  process.stdout.write(`Resolving sigunguCodes...\n`)
  const targets = await resolveSigunguCodes(key)
  for (const t of targets) {
    process.stdout.write(
      `  [${t.role}] area=${t.areaCode} sigungu=${t.sigunguCode} (${t.sigunguName})\n`,
    )
  }

  // contentId → merged record
  const records = new Map()

  for (const t of targets) {
    for (const ct of CONTENT_TYPES) {
      for (const [lang, service] of Object.entries(LANG_SERVICES)) {
        const rows = await fetchAllPages(key, service, t.areaCode, t.sigunguCode, ct.id)
        process.stdout.write(`  ${t.sigunguName} [${ct.tag}] ${lang}: ${rows.length}\n`)
        if (PROBE) continue
        for (const row of rows) {
          const contentId = String(row.contentid ?? '').trim()
          if (!contentId) continue
          let rec = records.get(contentId)
          if (!rec) {
            const core = extractCoreFields(row)
            if (!core) continue
            rec = {
              contentId,
              contentTypeId: String(row.contenttypeid ?? ct.id),
              typeTag: ct.tag,
              areaCode: String(t.areaCode),
              sigunguCode: t.sigunguCode,
              sigunguName: t.sigunguName,
              role: t.role,
              coords: core.coords,
              thumbnail: core.thumbnail,
              thumbnailSmall: core.thumbnailSmall,
              ko: null,
              en: null,
              ja: null,
              zh: null,
            }
            records.set(contentId, rec)
          }
          const langFields = extractLangFields(row)
          if (langFields.title) rec[lang] = langFields
          // Prefer image from any lang service that has it
          if (!rec.thumbnail) rec.thumbnail = httpsify(row.firstimage)
          if (!rec.thumbnailSmall) rec.thumbnailSmall = httpsify(row.firstimage2)
        }
      }
    }
  }

  if (PROBE) {
    process.stdout.write(`\n(probe mode — no file written)\n`)
    return
  }

  const pois = [...records.values()].filter((r) => r.ko || r.en || r.ja || r.zh)

  const byRole = pois.reduce((acc, p) => {
    acc[p.role] = (acc[p.role] ?? 0) + 1
    return acc
  }, {})
  const byType = pois.reduce((acc, p) => {
    acc[p.typeTag] = (acc[p.typeTag] ?? 0) + 1
    return acc
  }, {})
  const byLang = { ko: 0, en: 0, ja: 0, zh: 0 }
  for (const p of pois) for (const l of Object.keys(byLang)) if (p[l]) byLang[l] += 1

  const output = {
    source: '한국관광공사 TourAPI (KorService2·EngService2·JpnService2·ChsService2)',
    sourceUrl: 'https://www.data.go.kr/data/15101578/openapi.do',
    fetchedAt: new Date().toISOString(),
    targets,
    stats: { total: pois.length, byRole, byType, byLang },
    pois,
  }

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(output, null, 2) + '\n')
  process.stdout.write(
    `\nWrote ${pois.length} POIs to ${OUT}\n  byRole: ${JSON.stringify(byRole)}\n  byType: ${JSON.stringify(byType)}\n  byLang: ${JSON.stringify(byLang)}\n`,
  )
}

main().catch((err) => {
  console.error('sync failed:', err.message)
  process.exit(1)
})
