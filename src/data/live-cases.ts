import type { PriceCategory, Verdict } from './price-catalog'

export interface LiveCase {
  id: string
  email: string
  itemKey: string
  category: PriceCategory
  verdict: Verdict
  paid: number
  fairLow: number
  fairHigh: number
  extra?: string
}

// Seed cases used to illustrate the price-check verdict on the home hero.
// Values are derived from our own catalog ranges; emails are example
// Google-login style addresses and are masked before render.
export const LIVE_CASES: LiveCase[] = [
  {
    id: 'sample-food',
    email: 'kimtaehyun@gmail.com',
    itemKey: 'catalog.samgyeopsal_200g.name',
    category: 'food',
    verdict: 'bagaji',
    paid: 48000,
    fairLow: 16000,
    fairHigh: 24000,
    extra: '관광지 식당',
  },
  {
    id: 'sample-drink',
    email: 'yuki.tanaka@gmail.com',
    itemKey: 'catalog.water_500ml.name',
    category: 'drink',
    verdict: 'bagaji',
    paid: 5000,
    fairLow: 1000,
    fairHigh: 2000,
    extra: '해변 매점',
  },
  {
    id: 'sample-transit',
    email: 'mini5031@nate.com',
    itemKey: 'catalog.taxi_seoul.name',
    category: 'transit',
    verdict: 'bagaji',
    paid: 30000,
    fairLow: 6700,
    fairHigh: 9000,
    extra: '5km · 심야',
  },
  {
    id: 'sample-lodging',
    email: 'sophia.park@gmail.com',
    itemKey: 'catalog.hanok_stay.name',
    category: 'lodging',
    verdict: 'bagaji',
    paid: 380000,
    fairLow: 90000,
    fairHigh: 180000,
    extra: '1박',
  },
  {
    id: 'sample-tourism',
    email: 'chen.wei@gmail.com',
    itemKey: 'catalog.hanbok_rental_2h.name',
    category: 'tourism',
    verdict: 'bagaji',
    paid: 45000,
    fairLow: 12000,
    fairHigh: 20000,
    extra: '고궁 주변',
  },
  {
    id: 'sample-fee',
    email: 'm.garcia@gmail.com',
    itemKey: 'catalog.atm_airport.name',
    category: 'fee',
    verdict: 'bagaji',
    paid: 12000,
    fairLow: 3500,
    fairHigh: 5000,
    extra: '1회 출금',
  },
]
