import bucheonLive from './live-prices-bucheon.json'

export interface LiveSource {
  label: string
  url: string
  fetchedAt: string
  samples: number
  spec: string | null
}

interface LiveItem {
  min: number
  max: number
  avg: number
  absoluteMin: number
  absoluteMax: number
  samples: number
  spec: string | null
  originalName: string
}

interface LiveDB {
  source: string
  sourceUrl: string
  namespace: string
  uddi: string
  fetchedAt: string
  itemCount: number
  totalRows: number
  items: Record<string, LiveItem>
}

const BUCHEON = bucheonLive as LiveDB

// Catalog id → normalized item key in the Bucheon dataset.
// Normalization strips whitespace (냉 면 → 냉면) to match the sync output.
const BUCHEON_MAP: Record<string, string> = {
  bibimbap: '비빔밥',
  gimbap: '김밥',
  jajangmyeon: '짜장면',
  jjamppong: '짬뽕',
  samgyeopsal_200g: '삼겹살(외식)',
  fried_chicken_whole: '튀김닭',
  naengmyeon: '냉면',
  kalguksu: '칼국수',
  kimchi_jjigae: '김치찌개',
  doenjang_jjigae: '된장찌개',
  galbitang: '갈비탕',
  samgyetang: '삼계탕',
  bulgogi_1p: '불고기',
  ramyeon_restaurant: '조리라면(외식)',
  donkatsu: '돈까스',
  americano: '커피(외식)',
  hotel_3star: '숙박(호텔)',
  hostel_dorm: '숙박(여관)',
  jjimjilbang_entry: '찜질방이용료',
}

export interface LiveOverride {
  min: number
  max: number
  source: LiveSource
}

export const getLiveOverride = (entryId: string): LiveOverride | null => {
  const bucheonKey = BUCHEON_MAP[entryId]
  if (!bucheonKey) return null
  const item = BUCHEON.items[bucheonKey]
  if (!item) return null
  return {
    min: item.min,
    max: item.max,
    source: {
      label: BUCHEON.source,
      url: BUCHEON.sourceUrl,
      fetchedAt: BUCHEON.fetchedAt,
      samples: item.samples,
      spec: item.spec,
    },
  }
}
