export type PriceCategory = 'food' | 'drink' | 'transit' | 'lodging' | 'tourism' | 'fee'

export type InputMode = 'flat' | 'taxi'

export interface PriceEntry {
  id: string
  category: PriceCategory
  fairMin: number
  fairMax: number
  unit?: string
  inputMode?: InputMode
  popular?: boolean
}

export const PRICE_CATALOG: PriceEntry[] = [
  { id: 'bibimbap', category: 'food', fairMin: 9000, fairMax: 13000, popular: true },
  {
    id: 'samgyeopsal_200g',
    category: 'food',
    fairMin: 16000,
    fairMax: 24000,
    unit: '200g',
    popular: true,
  },
  {
    id: 'fried_chicken_whole',
    category: 'food',
    fairMin: 20000,
    fairMax: 28000,
    unit: '1마리',
    popular: true,
  },
  { id: 'tteokbokki', category: 'food', fairMin: 4000, fairMax: 7000, popular: true },
  { id: 'kimchi_jjigae', category: 'food', fairMin: 8000, fairMax: 11000, popular: true },
  { id: 'samgyetang', category: 'food', fairMin: 16000, fairMax: 22000, popular: true },
  { id: 'gukbap', category: 'food', fairMin: 8000, fairMax: 12000 },
  { id: 'gimbap', category: 'food', fairMin: 3500, fairMax: 5500 },
  { id: 'jajangmyeon', category: 'food', fairMin: 7000, fairMax: 9500 },
  { id: 'jjamppong', category: 'food', fairMin: 8500, fairMax: 11500 },
  { id: 'naengmyeon', category: 'food', fairMin: 10000, fairMax: 14000 },
  { id: 'kalguksu', category: 'food', fairMin: 8000, fairMax: 11000 },
  { id: 'budae_jjigae_1p', category: 'food', fairMin: 11000, fairMax: 15000, unit: '1인' },
  { id: 'doenjang_jjigae', category: 'food', fairMin: 8000, fairMax: 11000 },
  { id: 'sundubu_jjigae', category: 'food', fairMin: 8000, fairMax: 11000 },
  { id: 'galbitang', category: 'food', fairMin: 12000, fairMax: 18000 },
  { id: 'gamjatang_1p', category: 'food', fairMin: 10000, fairMax: 14000, unit: '1인' },
  { id: 'seolleongtang', category: 'food', fairMin: 11000, fairMax: 15000 },
  { id: 'bulgogi_1p', category: 'food', fairMin: 14000, fairMax: 22000, unit: '1인' },
  { id: 'jeyuk_bokkeum_1p', category: 'food', fairMin: 10000, fairMax: 14000, unit: '1인' },
  { id: 'dakgalbi_1p', category: 'food', fairMin: 12000, fairMax: 18000, unit: '1인' },
  { id: 'jokbal_small', category: 'food', fairMin: 30000, fairMax: 45000, unit: '소' },
  { id: 'bossam_small', category: 'food', fairMin: 30000, fairMax: 45000, unit: '소' },
  { id: 'sundae_gukbap', category: 'food', fairMin: 9000, fairMax: 13000 },
  { id: 'mandu', category: 'food', fairMin: 6000, fairMax: 9000, unit: '1접시' },
  { id: 'ramyeon_restaurant', category: 'food', fairMin: 4500, fairMax: 7000, unit: '식당' },
  { id: 'donkatsu', category: 'food', fairMin: 9000, fairMax: 14000 },
  { id: 'udon', category: 'food', fairMin: 7000, fairMax: 10000 },
  { id: 'sujebi', category: 'food', fairMin: 8000, fairMax: 11000 },
  { id: 'pajeon', category: 'food', fairMin: 12000, fairMax: 18000 },

  { id: 'americano', category: 'drink', fairMin: 3500, fairMax: 5500, popular: true },
  { id: 'cafe_latte', category: 'drink', fairMin: 4500, fairMax: 6500, popular: true },
  { id: 'water_500ml', category: 'drink', fairMin: 1000, fairMax: 2000, unit: '관광지·노점' },
  { id: 'soju_bottle', category: 'drink', fairMin: 4000, fairMax: 6000, unit: '식당' },
  { id: 'beer_500ml', category: 'drink', fairMin: 5000, fairMax: 7000, unit: '식당 생맥주' },

  {
    id: 'taxi_seoul',
    category: 'transit',
    fairMin: 0,
    fairMax: 0,
    inputMode: 'taxi',
    popular: true,
  },
  {
    id: 'airport_private_taxi',
    category: 'transit',
    fairMin: 60000,
    fairMax: 90000,
    unit: '인천→서울 콜',
  },

  { id: 'hostel_dorm', category: 'lodging', fairMin: 18000, fairMax: 32000, unit: '1박' },
  {
    id: 'hotel_3star',
    category: 'lodging',
    fairMin: 80000,
    fairMax: 130000,
    unit: '1박',
    popular: true,
  },
  { id: 'hanok_stay', category: 'lodging', fairMin: 90000, fairMax: 180000, unit: '1박' },

  {
    id: 'hanbok_rental_2h',
    category: 'tourism',
    fairMin: 12000,
    fairMax: 20000,
    unit: '2시간',
    popular: true,
  },
  { id: 'jjimjilbang_entry', category: 'tourism', fairMin: 8000, fairMax: 16000, unit: '1회 입장' },
  { id: 'tourist_massage_1h', category: 'tourism', fairMin: 40000, fairMax: 80000, unit: '60분' },
  { id: 'tornado_potato', category: 'tourism', fairMin: 3500, fairMax: 5500, unit: '관광지 노점' },
  { id: 'odeng_cup', category: 'tourism', fairMin: 1000, fairMax: 2500, unit: '노점 1컵' },

  { id: 'atm_global', category: 'fee', fairMin: 1000, fairMax: 1500, unit: '1회', popular: true },
  { id: 'atm_airport', category: 'fee', fairMin: 3500, fairMax: 5000, unit: '1회' },
  { id: 'exchange_spread', category: 'fee', fairMin: 15, fairMax: 30, unit: '원/USD' },
  { id: 'sim_airport_5day', category: 'fee', fairMin: 25000, fairMax: 35000, unit: '5일 무제한' },
]

// Seoul taxi 2025 meter rules
// Day: base 4,800 for first 1.6 km, then +100 per 131 m or per 30 s (slow)
// Late-night (00:00–04:00): +20% surcharge on both base and meter
// City airport/intercity surcharges are not modeled here — advise the user separately.
const TAXI_BASE_DAY = 4800
const TAXI_BASE_KM = 1.6
const TAXI_UNIT_M = 131
const TAXI_UNIT_KRW = 100
const TAXI_NIGHT_SURCHARGE = 0.2
// Real trips accumulate idle-time charges + minor traffic delay; buffer +/- on expected.
const TAXI_LOW_BUFFER = 0.9
const TAXI_HIGH_BUFFER = 1.2

export const computeTaxiFairRange = (km: number, night: boolean): [number, number] => {
  if (!Number.isFinite(km) || km <= 0) return [TAXI_BASE_DAY, TAXI_BASE_DAY]
  const baseCharge =
    km <= TAXI_BASE_KM
      ? TAXI_BASE_DAY
      : TAXI_BASE_DAY + Math.ceil(((km - TAXI_BASE_KM) * 1000) / TAXI_UNIT_M) * TAXI_UNIT_KRW
  const withNight = night ? Math.round(baseCharge * (1 + TAXI_NIGHT_SURCHARGE)) : baseCharge
  return [Math.round(withNight * TAXI_LOW_BUFFER), Math.round(withNight * TAXI_HIGH_BUFFER)]
}

export type Verdict = 'fair' | 'careful' | 'bagaji'

export interface CheckExtras {
  km?: number
  night?: boolean
}

import { getLiveOverride, type LiveSource } from './live-price-source'

export interface CheckResult {
  entry: PriceEntry
  paid: number
  fairMin: number
  fairMax: number
  avg: number
  deltaPct: number
  verdict: Verdict
  extras?: CheckExtras
  source?: LiveSource | null
}

export const checkPrice = (
  entryId: string,
  paidKrw: number,
  extras?: CheckExtras,
): CheckResult | null => {
  const entry = PRICE_CATALOG.find((e) => e.id === entryId)
  if (!entry || !Number.isFinite(paidKrw) || paidKrw <= 0) return null

  let fairMin = entry.fairMin
  let fairMax = entry.fairMax
  let source: LiveSource | null = null

  if (entry.inputMode === 'taxi') {
    const km = extras?.km ?? 0
    if (!Number.isFinite(km) || km <= 0) return null
    ;[fairMin, fairMax] = computeTaxiFairRange(km, extras?.night ?? false)
  } else {
    const live = getLiveOverride(entry.id)
    if (live) {
      fairMin = live.min
      fairMax = live.max
      source = live.source
    }
  }

  const avg = (fairMin + fairMax) / 2
  const deltaPct = (paidKrw - avg) / avg
  let verdict: Verdict = 'fair'
  if (paidKrw > fairMax * 1.4) verdict = 'bagaji'
  else if (paidKrw > fairMax * 1.15) verdict = 'careful'

  return {
    entry,
    paid: paidKrw,
    fairMin,
    fairMax,
    avg,
    deltaPct,
    verdict,
    extras,
    source,
  }
}

export const getCatalogLiveSource = (entryId: string): LiveSource | null => {
  const live = getLiveOverride(entryId)
  return live?.source ?? null
}

export const PRICE_CATEGORIES: PriceCategory[] = [
  'food',
  'drink',
  'transit',
  'lodging',
  'tourism',
  'fee',
]
