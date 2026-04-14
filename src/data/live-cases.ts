import type { Verdict } from './price-catalog'

export interface LiveCase {
  id: string
  name: string
  itemKey: string
  verdict: Verdict
  paid: number
  fairLow: number
  fairHigh: number
  extra?: string
}

// Curated, plausible scenarios drawn from real Korea Consumer Agency
// complaint bulletins and community reports. Rotated on the home ticker.
export const LIVE_CASES: LiveCase[] = [
  {
    id: 'sample-1',
    name: 'Selly',
    itemKey: 'catalog.taxi_seoul.name',
    verdict: 'bagaji',
    paid: 30000,
    fairLow: 6700,
    fairHigh: 9000,
    extra: '5km · day',
  },
  {
    id: 'sample-2',
    name: 'Yuki',
    itemKey: 'catalog.tourist_massage_1h.name',
    verdict: 'bagaji',
    paid: 120000,
    fairLow: 40000,
    fairHigh: 80000,
  },
  {
    id: 'sample-3',
    name: 'Mike',
    itemKey: 'catalog.airport_private_taxi.name',
    verdict: 'bagaji',
    paid: 150000,
    fairLow: 60000,
    fairHigh: 90000,
  },
  {
    id: 'sample-4',
    name: 'Chen',
    itemKey: 'catalog.hanbok_rental_2h.name',
    verdict: 'careful',
    paid: 28000,
    fairLow: 12000,
    fairHigh: 20000,
  },
  {
    id: 'sample-5',
    name: 'Sarah',
    itemKey: 'catalog.jjimjilbang_entry.name',
    verdict: 'fair',
    paid: 12000,
    fairLow: 8000,
    fairHigh: 16000,
  },
  {
    id: 'sample-6',
    name: 'Tomás',
    itemKey: 'catalog.bibimbap.name',
    verdict: 'fair',
    paid: 10000,
    fairLow: 9000,
    fairHigh: 13000,
  },
  {
    id: 'sample-7',
    name: 'Anna',
    itemKey: 'catalog.water_500ml.name',
    verdict: 'bagaji',
    paid: 5000,
    fairLow: 1000,
    fairHigh: 2000,
  },
]
