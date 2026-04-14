export type PriceCategory = 'food' | 'drink' | 'transit' | 'lodging' | 'tourism' | 'fee'

export interface PriceEntry {
  id: string
  category: PriceCategory
  fairMin: number
  fairMax: number
  unit?: string
}

export const PRICE_CATALOG: PriceEntry[] = [
  { id: 'gukbap', category: 'food', fairMin: 8000, fairMax: 12000 },
  { id: 'bibimbap', category: 'food', fairMin: 9000, fairMax: 13000 },
  { id: 'gimbap', category: 'food', fairMin: 3500, fairMax: 5500 },
  { id: 'jajangmyeon', category: 'food', fairMin: 7000, fairMax: 9500 },
  { id: 'samgyeopsal_200g', category: 'food', fairMin: 16000, fairMax: 24000, unit: '200g' },
  { id: 'fried_chicken_whole', category: 'food', fairMin: 20000, fairMax: 28000, unit: '1마리' },
  { id: 'tteokbokki', category: 'food', fairMin: 4000, fairMax: 7000 },
  { id: 'naengmyeon', category: 'food', fairMin: 10000, fairMax: 14000 },
  { id: 'kalguksu', category: 'food', fairMin: 8000, fairMax: 11000 },

  { id: 'americano', category: 'drink', fairMin: 3500, fairMax: 5500 },
  { id: 'cafe_latte', category: 'drink', fairMin: 4500, fairMax: 6500 },
  { id: 'water_500ml', category: 'drink', fairMin: 1000, fairMax: 2000 },
  { id: 'soju_bottle', category: 'drink', fairMin: 4000, fairMax: 6000, unit: '식당' },
  { id: 'beer_500ml', category: 'drink', fairMin: 5000, fairMax: 7000, unit: '식당' },
  { id: 'convenience_beer', category: 'drink', fairMin: 2500, fairMax: 3500, unit: '편의점' },

  { id: 'subway_base', category: 'transit', fairMin: 1400, fairMax: 1550 },
  { id: 'taxi_base_day', category: 'transit', fairMin: 4800, fairMax: 4800 },
  { id: 'taxi_base_night', category: 'transit', fairMin: 5760, fairMax: 5760 },
  { id: 'limousine_6001', category: 'transit', fairMin: 17000, fairMax: 17000, unit: '인천→명동' },
  { id: 'arex_express', category: 'transit', fairMin: 11000, fairMax: 11000, unit: '인천→서울역' },
  { id: 'ktx_seoul_busan', category: 'transit', fairMin: 53800, fairMax: 59800, unit: '일반실' },

  { id: 'hostel_dorm', category: 'lodging', fairMin: 18000, fairMax: 32000, unit: '1박' },
  { id: 'hotel_3star', category: 'lodging', fairMin: 80000, fairMax: 130000, unit: '1박' },
  { id: 'hanok_stay', category: 'lodging', fairMin: 90000, fairMax: 180000, unit: '1박' },

  { id: 'palace_entry', category: 'tourism', fairMin: 3000, fairMax: 3000, unit: '경복궁 성인' },
  { id: 'hanbok_rental_2h', category: 'tourism', fairMin: 12000, fairMax: 20000, unit: '2시간' },
  { id: 'namsan_cable', category: 'tourism', fairMin: 14000, fairMax: 14000, unit: '왕복' },
  { id: 'jeju_ferry', category: 'tourism', fairMin: 20000, fairMax: 40000, unit: '여객' },

  { id: 'atm_global', category: 'fee', fairMin: 1000, fairMax: 1500, unit: '1회' },
  { id: 'atm_airport', category: 'fee', fairMin: 3500, fairMax: 5000, unit: '1회' },
  { id: 'exchange_spread', category: 'fee', fairMin: 15, fairMax: 30, unit: '원/USD' },
]

export type Verdict = 'fair' | 'careful' | 'bagaji'

export interface CheckResult {
  entry: PriceEntry
  paid: number
  fairMin: number
  fairMax: number
  avg: number
  deltaPct: number
  verdict: Verdict
}

export const checkPrice = (entryId: string, paidKrw: number): CheckResult | null => {
  const entry = PRICE_CATALOG.find((e) => e.id === entryId)
  if (!entry || !Number.isFinite(paidKrw) || paidKrw <= 0) return null
  const avg = (entry.fairMin + entry.fairMax) / 2
  const deltaPct = (paidKrw - avg) / avg
  let verdict: Verdict = 'fair'
  if (paidKrw > entry.fairMax * 1.4) verdict = 'bagaji'
  else if (paidKrw > entry.fairMax * 1.15) verdict = 'careful'
  return {
    entry,
    paid: paidKrw,
    fairMin: entry.fairMin,
    fairMax: entry.fairMax,
    avg,
    deltaPct,
    verdict,
  }
}

export const PRICE_CATEGORIES: PriceCategory[] = [
  'food',
  'drink',
  'transit',
  'lodging',
  'tourism',
  'fee',
]
