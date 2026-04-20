import type { TFunction } from 'i18next'
import { PRICE_CATALOG, type PriceEntry } from '../data/price-catalog'
import type { ExtractedPrice } from './menu-ocr'

export interface MatchedItem {
  extracted: ExtractedPrice
  entry: PriceEntry | null
  similarity: number
}

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[\s\p{P}]+/gu, '') // strip whitespace + punctuation
    .replace(/[^\p{L}\p{N}]/gu, '')

// Dice coefficient on character bigrams — handles partial overlap well and
// works across CJK/Latin without a dictionary.
const dice = (a: string, b: string): number => {
  if (!a || !b) return 0
  if (a === b) return 1
  if (a.length < 2 || b.length < 2) return a === b ? 1 : 0
  const bigrams = (s: string) => {
    const out = new Map<string, number>()
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.slice(i, i + 2)
      out.set(bg, (out.get(bg) ?? 0) + 1)
    }
    return out
  }
  const A = bigrams(a)
  const B = bigrams(b)
  let overlap = 0
  for (const [bg, count] of A) {
    const other = B.get(bg) ?? 0
    overlap += Math.min(count, other)
  }
  const total =
    [...A.values()].reduce((s, c) => s + c, 0) + [...B.values()].reduce((s, c) => s + c, 0)
  return total === 0 ? 0 : (2 * overlap) / total
}

const MIN_SIMILARITY = 0.4

// For each extracted price, find the best-matching catalog entry by
// comparing the extracted label against the translated names in the
// current UI language (and Korean, since menus are in Korean even when
// the UI is English).
export const matchExtractedPrices = (prices: ExtractedPrice[], t: TFunction): MatchedItem[] => {
  // Build a candidate pool: each catalog entry → its localized name + Korean name.
  const candidates = PRICE_CATALOG.flatMap((entry) => {
    const localized = normalize(t(`catalog.${entry.id}.name`))
    const ko = normalize(t(`catalog.${entry.id}.name`, { lng: 'ko' }))
    const names = [localized, ko].filter(Boolean)
    return names.map((n) => ({ entry, name: n }))
  })

  return prices.map((p) => {
    const label = normalize(p.label)
    let bestEntry: PriceEntry | null = null
    let bestScore = 0
    for (const c of candidates) {
      const score = dice(label, c.name)
      if (score > bestScore) {
        bestScore = score
        bestEntry = c.entry
      }
    }
    if (!bestEntry || bestScore < MIN_SIMILARITY) {
      return { extracted: p, entry: null, similarity: bestScore }
    }
    return { extracted: p, entry: bestEntry, similarity: bestScore }
  })
}
