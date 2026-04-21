#!/usr/bin/env node
// Augments src/data/live-bucheon-pois.json with en/ja/zh translations using
// TourAPI detailCommon2. Calls 3 language services per contentId and merges
// title/addr back into the existing record. KorService2 rows are already
// populated by sync-bucheon-pois.mjs and left alone.
//
// Modes:
//   default         translate role=core (부천) only
//   --all           translate every POI in the file (3 langs × N calls)
//   --ids=X,Y,Z     translate only these contentIds (for curated courses)
//
// Usage:
//   DATA_GO_KR_KEY=... node scripts/translate-bucheon-pois.mjs
//   DATA_GO_KR_KEY=... node scripts/translate-bucheon-pois.mjs --ids=2470347,558819
//   DATA_GO_KR_KEY=... node scripts/translate-bucheon-pois.mjs --all

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const FILE = resolve(ROOT, 'src/data/live-bucheon-pois.json')

const LANGS = ['en', 'ja', 'zh']
const SERVICE_BY_LANG = { en: 'EngService2', ja: 'JpnService2', zh: 'ChsService2' }
const BASE = 'https://apis.data.go.kr/B551011'
const THROTTLE_MS = 120 // stay under TourAPI's per-second cap

const readKey = async () => {
  if (process.env.DATA_GO_KR_KEY) return process.env.DATA_GO_KR_KEY.trim()
  for (const p of ['functions/.secret.local', 'functions/.env.local']) {
    try {
      const txt = await readFile(resolve(ROOT, p), 'utf8')
      const m = txt.match(/^(?:DATA_GO_KR_KEY|TOUR_API_KEY)=(.+)$/m)
      if (m && m[1].trim()) return m[1].trim()
    } catch {}
  }
  throw new Error('DATA_GO_KR_KEY not set')
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const detailCommon = async (key, service, contentId) => {
  const url = new URL(`${BASE}/${service}/detailCommon2`)
  url.searchParams.set('serviceKey', key)
  url.searchParams.set('MobileOS', 'ETC')
  url.searchParams.set('MobileApp', 'NWK')
  url.searchParams.set('_type', 'json')
  url.searchParams.set('contentId', contentId)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const body = await res.text()
  if (body.trim().startsWith('<')) {
    const err = body.match(/<returnReasonCode>([^<]+)/)?.[1] ?? 'unknown'
    throw new Error(`TourAPI error: ${err}`)
  }
  const json = JSON.parse(body)
  const item = json.response?.body?.items?.item
  const row = Array.isArray(item) ? item[0] : item
  if (!row) return null
  const title = String(row.title ?? '').trim()
  const addr = String(row.addr1 ?? '').trim()
  if (!title) return null
  return { title, addr }
}

const parseIdsArg = () => {
  const arg = process.argv.find((a) => a.startsWith('--ids='))
  if (!arg) return null
  return new Set(
    arg
      .slice(6)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  )
}

const main = async () => {
  const key = await readKey()
  const raw = JSON.parse(await readFile(FILE, 'utf8'))
  const pois = raw.pois ?? []
  const ids = parseIdsArg()
  const all = process.argv.includes('--all')

  const targets = pois.filter((p) => {
    if (ids) return ids.has(p.contentId)
    if (all) return true
    return p.role === 'core'
  })

  process.stdout.write(
    `Translating ${targets.length} POIs × 3 languages (${targets.length * 3} calls)\n`,
  )

  let done = 0
  let failed = 0
  for (const poi of targets) {
    for (const lang of LANGS) {
      // Skip if already translated (idempotent rerun)
      if (poi[lang] && poi[lang].title) {
        done += 1
        continue
      }
      try {
        const out = await detailCommon(key, SERVICE_BY_LANG[lang], poi.contentId)
        if (out) poi[lang] = out
        done += 1
      } catch (err) {
        failed += 1
        process.stdout.write(`  ! ${poi.contentId} ${lang}: ${err.message}\n`)
      }
      await sleep(THROTTLE_MS)
    }
    if (targets.indexOf(poi) % 10 === 0) {
      const pct = Math.round(((targets.indexOf(poi) + 1) / targets.length) * 100)
      process.stdout.write(
        `  progress ${targets.indexOf(poi) + 1}/${targets.length} (${pct}%) — ${poi.ko?.title ?? poi.contentId}\n`,
      )
    }
  }

  // Recount byLang
  const byLang = { ko: 0, en: 0, ja: 0, zh: 0 }
  for (const p of pois) for (const l of Object.keys(byLang)) if (p[l]) byLang[l] += 1
  raw.stats = { ...raw.stats, byLang }
  raw.fetchedAt = new Date().toISOString()

  await writeFile(FILE, JSON.stringify(raw, null, 2) + '\n')
  process.stdout.write(
    `\nDone. calls=${done + failed}, failed=${failed}\n  byLang: ${JSON.stringify(byLang)}\n`,
  )
}

main().catch((err) => {
  console.error('translate failed:', err.message)
  process.exit(1)
})
