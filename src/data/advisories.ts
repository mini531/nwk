export type AdvisoryCategory = 'price' | 'transit' | 'etiquette' | 'safety'

export interface Advisory {
  id: string
  category: AdvisoryCategory
  regions?: string[]
  keywords?: string[]
  amount?: { value: number; currency: 'KRW' }
}

export const ADVISORIES: Advisory[] = [
  { id: 'price.water', category: 'price', amount: { value: 1500, currency: 'KRW' } },
  { id: 'price.coffee', category: 'price', amount: { value: 4500, currency: 'KRW' } },
  { id: 'price.meal', category: 'price', amount: { value: 10000, currency: 'KRW' } },
  {
    id: 'price.taxi_base',
    category: 'price',
    amount: { value: 4800, currency: 'KRW' },
    regions: ['서울', 'Seoul'],
  },
  {
    id: 'price.subway_base',
    category: 'price',
    amount: { value: 1400, currency: 'KRW' },
    regions: [
      '서울',
      'Seoul',
      '부산',
      'Busan',
      '인천',
      'Incheon',
      '대구',
      'Daegu',
      '대전',
      'Daejeon',
      '광주',
      'Gwangju',
    ],
  },

  { id: 'transit.tmoney', category: 'transit' },
  { id: 'transit.subway_seoul', category: 'transit', regions: ['서울', 'Seoul'] },
  { id: 'transit.subway_busan', category: 'transit', regions: ['부산', 'Busan'] },
  { id: 'transit.ktx', category: 'transit' },
  { id: 'transit.taxi_app', category: 'transit' },

  {
    id: 'etiquette.shoes_off',
    category: 'etiquette',
    keywords: ['한옥', 'hanok', '사찰', 'temple', '절', '전통'],
  },
  { id: 'etiquette.bow', category: 'etiquette' },
  { id: 'etiquette.no_tipping', category: 'etiquette' },
  {
    id: 'etiquette.palace_respect',
    category: 'etiquette',
    keywords: ['궁', 'palace', 'Palace', '宮'],
  },

  { id: 'safety.emergency', category: 'safety' },
  { id: 'safety.tap_water', category: 'safety' },
  {
    id: 'safety.crowds',
    category: 'safety',
    keywords: ['명동', '홍대', 'market', '시장', 'Myeongdong'],
  },
]
