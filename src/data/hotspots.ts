import type { TourSearchItem } from '../utils/api'
import liveHotspots from './live-hotspots.json'

export interface Hotspot {
  place: TourSearchItem
  nameByLang: Record<string, string>
  addrByLang: Record<string, string>
  thumbnail: string | null
  regionKey: string
  featuredAdvisoryIds: string[]
}

interface LiveHotspotEntry {
  contentId: string
  title: string
  addr: string
  lat: number
  lng: number
  thumbnail: string | null
  thumbnailSmall: string | null
  contentTypeId: string
}

interface LiveHotspotRecord {
  id: string
  region: string
  ko: LiveHotspotEntry | null
  en: LiveHotspotEntry | null
  ja: LiveHotspotEntry | null
  zh: LiveHotspotEntry | null
}

interface LiveHotspotDB {
  source: string
  sourceUrl: string
  fetchedAt: string
  hotspots: LiveHotspotRecord[]
}

const LIVE = liveHotspots as LiveHotspotDB

// Featured advisory mapping is product-curated (not from TourAPI) —
// each hotspot highlights the 2–3 advisories that actually apply there.
const FEATURED: Record<string, { region: string; advisories: string[] }> = {
  gyeongbokgung: {
    region: 'page.home.hotspots.gyeongbokgung.region',
    advisories: ['etiquette.palace_respect', 'transit.subway_seoul', 'price.subway_base'],
  },
  nseoultower: {
    region: 'page.home.hotspots.nseoultower.region',
    advisories: ['transit.subway_seoul', 'safety.crowds', 'etiquette.no_tipping'],
  },
  haeundae: {
    region: 'page.home.hotspots.haeundae.region',
    advisories: ['transit.subway_busan', 'transit.ktx', 'safety.tap_water'],
  },
  seongsan: {
    region: 'page.home.hotspots.seongsan.region',
    advisories: ['transit.taxi_app', 'price.water', 'safety.emergency'],
  },
  bulguksa: {
    region: 'page.home.hotspots.bulguksa.region',
    advisories: ['etiquette.shoes_off', 'transit.ktx', 'etiquette.bow'],
  },
}

const toHotspot = (rec: LiveHotspotRecord): Hotspot | null => {
  const meta = FEATURED[rec.id]
  if (!meta) return null
  const primary = rec.ko ?? rec.en ?? rec.ja ?? rec.zh
  if (!primary) return null
  const nameByLang: Record<string, string> = {}
  const addrByLang: Record<string, string> = {}
  for (const lang of ['ko', 'en', 'ja', 'zh'] as const) {
    const row = rec[lang]
    if (row) {
      nameByLang[lang] = row.title
      addrByLang[lang] = row.addr
    }
  }
  return {
    place: {
      id: `hotspot-${rec.id}`,
      title: primary.title,
      addr: primary.addr,
      lat: primary.lat,
      lng: primary.lng,
      thumbnail: primary.thumbnail ?? undefined,
    },
    nameByLang,
    addrByLang,
    thumbnail: primary.thumbnail ?? primary.thumbnailSmall,
    regionKey: meta.region,
    featuredAdvisoryIds: meta.advisories,
  }
}

export const HOTSPOTS: Hotspot[] = LIVE.hotspots
  .map(toHotspot)
  .filter((h): h is Hotspot => Boolean(h))

export const HOTSPOTS_SOURCE = {
  label: LIVE.source,
  url: LIVE.sourceUrl,
  fetchedAt: LIVE.fetchedAt,
}

export const hotspotName = (h: Hotspot, lang: string): string => {
  return h.nameByLang[lang] ?? h.nameByLang.ko ?? h.place.title
}

export const hotspotAddr = (h: Hotspot, lang: string): string => {
  return h.addrByLang[lang] ?? h.addrByLang.ko ?? h.place.addr
}
