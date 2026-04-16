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
  image?: string
}

// Sample cases used to demonstrate the price-check verdict on the home hero.
// Not sourced from any third-party agency — values reflect our own catalog ranges.
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
    image: '/hero/taxi-seoul.webp',
  },
  {
    id: 'sample-2',
    name: 'Yuki',
    itemKey: 'catalog.tourist_massage_1h.name',
    verdict: 'bagaji',
    paid: 120000,
    fairLow: 40000,
    fairHigh: 80000,
    image: '/hero/massage.webp',
  },
  {
    id: 'sample-3',
    name: 'Mike',
    itemKey: 'catalog.airport_private_taxi.name',
    verdict: 'bagaji',
    paid: 150000,
    fairLow: 60000,
    fairHigh: 90000,
    image: '/hero/airport-taxi.webp',
  },
  {
    id: 'sample-4',
    name: 'Chen',
    itemKey: 'catalog.hanbok_rental_2h.name',
    verdict: 'careful',
    paid: 28000,
    fairLow: 12000,
    fairHigh: 20000,
    image: '/hero/hanbok.webp',
  },
  {
    id: 'sample-5',
    name: 'Sarah',
    itemKey: 'catalog.jjimjilbang_entry.name',
    verdict: 'fair',
    paid: 12000,
    fairLow: 8000,
    fairHigh: 16000,
    image: '/hero/jjimjilbang.webp',
  },
  {
    id: 'sample-6',
    name: 'Tomás',
    itemKey: 'catalog.bibimbap.name',
    verdict: 'fair',
    paid: 10000,
    fairLow: 9000,
    fairHigh: 13000,
    image: '/hero/bibimbap.webp',
  },
  {
    id: 'sample-7',
    name: 'Anna',
    itemKey: 'catalog.water_500ml.name',
    verdict: 'bagaji',
    paid: 5000,
    fairLow: 1000,
    fairHigh: 2000,
    image: '/hero/water.webp',
  },
]
