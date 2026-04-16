#!/usr/bin/env node
// Pulls 강원특별자치도_물가정보(가격비교) CPI index series
// and emits src/data/live-cpi-gangwon.json with the latest month
// plus month-over-month and year-over-year deltas for the
// 개인서비스 index.
//
// Usage:
//   DATA_GO_KR_KEY=... node scripts/sync-gangwon-cpi.mjs

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUT = resolve(ROOT, 'src/data/live-cpi-gangwon.json')

const NAMESPACE = '3037865/v1'
const UDDI = 'uddi:1c6c7a0c-78ed-4636-adee-9a3dd57adc3e'
const SOURCE_LABEL = '강원특별자치도 물가정보 (가격비교)'
const SOURCE_URL = 'https://www.data.go.kr/data/15125533/openapi.do'

const readKey = async () => {
  if (process.env.DATA_GO_KR_KEY) return process.env.DATA_GO_KR_KEY.trim()
  try {
    const txt = await readFile(resolve(ROOT, 'functions/.secret.local'), 'utf8')
    const match = txt.match(/^DATA_GO_KR_KEY=(.+)$/m)
    if (match) return match[1].trim()
  } catch {}
  throw new Error('DATA_GO_KR_KEY not found in env or functions/.secret.local')
}

// "121.8.3" kind of typo → strip to first valid float; otherwise plain Number.
const toFloat = (raw) => {
  if (typeof raw === 'number') return raw
  const s = String(raw ?? '').trim()
  const m = s.match(/^\d+(?:\.\d+)?/)
  return m ? Number(m[0]) : NaN
}

const fetchAll = async (key) => {
  const url = new URL(`https://api.odcloud.kr/api/${NAMESPACE}/${UDDI}`)
  url.searchParams.set('page', '1')
  url.searchParams.set('perPage', '100')
  url.searchParams.set('returnType', 'JSON')
  url.searchParams.set('serviceKey', key)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  return res.json()
}

const main = async () => {
  const key = await readKey()
  process.stdout.write(`Fetching ${NAMESPACE}/${UDDI}...\n`)
  const body = await fetchAll(key)
  const rows = Array.isArray(body.data) ? body.data : []

  const series = rows
    .map((r) => ({
      month: String(r['월'] ?? '').slice(0, 10),
      national: toFloat(r['전국']),
      personalService: toFloat(r['개인서비스']),
      publicService: toFloat(r['공공서비스']),
      agri: toFloat(r['농수산물']),
      industrial: toFloat(r['공업제품']),
      total: toFloat(r['총지수']),
    }))
    .filter((p) => p.month && Number.isFinite(p.personalService))
    .sort((a, b) => a.month.localeCompare(b.month))

  const latest = series[series.length - 1]
  const prev = series[series.length - 2] ?? null
  const yearAgo = series.find((p) => {
    if (!latest) return false
    const d = new Date(latest.month)
    d.setFullYear(d.getFullYear() - 1)
    const target = d.toISOString().slice(0, 10)
    return p.month === target
  })

  const pct = (cur, base) => {
    if (!base || !Number.isFinite(base) || base === 0) return null
    return Math.round(((cur - base) / base) * 10000) / 100
  }

  const output = {
    source: SOURCE_LABEL,
    sourceUrl: SOURCE_URL,
    namespace: NAMESPACE,
    uddi: UDDI,
    fetchedAt: new Date().toISOString(),
    pointCount: series.length,
    latest,
    momPct: prev && latest ? pct(latest.personalService, prev.personalService) : null,
    yoyPct: yearAgo && latest ? pct(latest.personalService, yearAgo.personalService) : null,
    series,
  }

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(output, null, 2) + '\n')
  process.stdout.write(
    `Wrote ${series.length} monthly points to ${OUT} (latest ${latest?.month} personal=${latest?.personalService})\n`,
  )
}

main().catch((err) => {
  console.error('sync failed:', err.message)
  process.exit(1)
})
