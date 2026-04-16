#!/usr/bin/env node
// Fetches 경기도 부천시 개인서비스요금 현황 (data.go.kr namespace 3079356)
// and writes a normalized snapshot to src/data/live-prices-bucheon.json.
//
// Usage:
//   DATA_GO_KR_KEY=... node scripts/sync-bucheon-prices.mjs
//
// The key may also be read from functions/.secret.local for convenience.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUT = resolve(ROOT, 'src/data/live-prices-bucheon.json')

const NAMESPACE = '3079356/v1'
const UDDI = 'uddi:59f52e8f-2d39-4c45-909e-97d413996b66' // 경기도 부천시_개인서비스요금 현황_20250514
const SOURCE_LABEL = '경기도 부천시 개인서비스요금 현황 (2025-05)'
const SOURCE_URL = 'https://www.data.go.kr/data/3079356/openapi.do'

const readKey = async () => {
  if (process.env.DATA_GO_KR_KEY) return process.env.DATA_GO_KR_KEY.trim()
  try {
    const txt = await readFile(resolve(ROOT, 'functions/.secret.local'), 'utf8')
    const match = txt.match(/^DATA_GO_KR_KEY=(.+)$/m)
    if (match) return match[1].trim()
  } catch {}
  throw new Error('DATA_GO_KR_KEY not found in env or functions/.secret.local')
}

const isDongField = (key) =>
  /(동|가|리|읍|면)$/.test(key) && !['품목', '규격', '연번'].includes(key)

const normalize = (name) => name.replace(/\s+/g, '')

const fetchAll = async (key) => {
  const url = new URL(`https://api.odcloud.kr/api/${NAMESPACE}/${UDDI}`)
  url.searchParams.set('page', '1')
  url.searchParams.set('perPage', '100')
  url.searchParams.set('returnType', 'JSON')
  url.searchParams.set('serviceKey', key)

  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  const body = await res.json()
  if (!Array.isArray(body.data)) throw new Error('unexpected response shape')
  return body
}

const summarize = (row) => {
  const prices = []
  for (const [k, v] of Object.entries(row)) {
    if (!isDongField(k)) continue
    if (typeof v === 'number' && v > 0) prices.push(v)
    else if (typeof v === 'string') {
      const n = Number(v.replace(/[^0-9.]/g, ''))
      if (Number.isFinite(n) && n > 0) prices.push(n)
    }
  }
  if (prices.length === 0) return null
  const sorted = [...prices].sort((a, b) => a - b)
  const sum = prices.reduce((a, b) => a + b, 0)
  // Use 10th/90th percentile as fair range to ignore single-dong outliers.
  const pct = (p) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))]
  return {
    min: pct(0.1),
    max: pct(0.9),
    avg: Math.round(sum / prices.length),
    absoluteMin: sorted[0],
    absoluteMax: sorted[sorted.length - 1],
    samples: prices.length,
  }
}

const main = async () => {
  const key = await readKey()
  process.stdout.write(`Fetching ${NAMESPACE}/${UDDI}...\n`)
  const body = await fetchAll(key)
  const rows = body.data

  const items = {}
  for (const row of rows) {
    const name = typeof row['품목'] === 'string' ? normalize(row['품목']) : null
    if (!name) continue
    const stats = summarize(row)
    if (!stats) continue
    items[name] = {
      ...stats,
      spec: row['규격'] ?? null,
      originalName: row['품목'],
    }
  }

  const output = {
    source: SOURCE_LABEL,
    sourceUrl: SOURCE_URL,
    namespace: NAMESPACE,
    uddi: UDDI,
    fetchedAt: new Date().toISOString(),
    itemCount: Object.keys(items).length,
    totalRows: rows.length,
    items,
  }

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(output, null, 2) + '\n')
  process.stdout.write(
    `Wrote ${Object.keys(items).length} items to ${OUT} (of ${rows.length} raw rows)\n`,
  )
}

main().catch((err) => {
  console.error('sync failed:', err.message)
  process.exit(1)
})
