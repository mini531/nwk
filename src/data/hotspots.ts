import type { TourSearchItem } from '../utils/api'

export interface Hotspot {
  place: TourSearchItem
  nameKey: string
  regionKey: string
  featuredAdvisoryIds: string[]
}

export const HOTSPOTS: Hotspot[] = [
  {
    place: {
      id: 'hotspot-gyeongbokgung',
      title: '경복궁 Gyeongbokgung Palace',
      addr: '서울특별시 종로구 사직로 161',
      lat: 37.579617,
      lng: 126.977041,
    },
    nameKey: 'page.home.hotspots.gyeongbokgung.name',
    regionKey: 'page.home.hotspots.gyeongbokgung.region',
    featuredAdvisoryIds: ['etiquette.palace_respect', 'transit.subway_seoul', 'price.subway_base'],
  },
  {
    place: {
      id: 'hotspot-myeongdong',
      title: '명동 Myeongdong',
      addr: '서울특별시 중구 명동',
      lat: 37.5636,
      lng: 126.9826,
    },
    nameKey: 'page.home.hotspots.myeongdong.name',
    regionKey: 'page.home.hotspots.myeongdong.region',
    featuredAdvisoryIds: ['safety.crowds', 'etiquette.no_tipping', 'price.meal'],
  },
  {
    place: {
      id: 'hotspot-haeundae',
      title: '해운대 Haeundae Beach',
      addr: '부산광역시 해운대구',
      lat: 35.1587,
      lng: 129.1604,
    },
    nameKey: 'page.home.hotspots.haeundae.name',
    regionKey: 'page.home.hotspots.haeundae.region',
    featuredAdvisoryIds: ['transit.subway_busan', 'transit.ktx', 'safety.tap_water'],
  },
  {
    place: {
      id: 'hotspot-seongsan',
      title: '성산일출봉 Seongsan Ilchulbong',
      addr: '제주특별자치도 서귀포시 성산읍',
      lat: 33.4584,
      lng: 126.9428,
    },
    nameKey: 'page.home.hotspots.seongsan.name',
    regionKey: 'page.home.hotspots.seongsan.region',
    featuredAdvisoryIds: ['transit.taxi_app', 'price.water', 'safety.emergency'],
  },
  {
    place: {
      id: 'hotspot-bulguksa',
      title: '불국사 Bulguksa Temple',
      addr: '경상북도 경주시 불국로 385',
      lat: 35.79,
      lng: 129.3319,
    },
    nameKey: 'page.home.hotspots.bulguksa.name',
    regionKey: 'page.home.hotspots.bulguksa.region',
    featuredAdvisoryIds: ['etiquette.shoes_off', 'transit.ktx', 'etiquette.bow'],
  },
]
