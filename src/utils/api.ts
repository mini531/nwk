import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

export interface TourSearchItem {
  id: string
  title: string
  addr: string
  lat: number
  lng: number
  thumbnail?: string
}

export interface TourSearchResponse {
  items: TourSearchItem[]
  source: 'live' | 'mock'
}

export const tourSearch = httpsCallable<{ keyword: string; lang?: string }, TourSearchResponse>(
  functions,
  'tourSearch',
)

export interface TourNearbyItem extends TourSearchItem {
  contentTypeId?: string
  dist?: number | null
}

export interface TourNearbyResponse {
  source: 'live' | 'mock' | 'error'
  items: TourNearbyItem[]
  radius?: number
  totalCount?: number
}

export const tourNearby = httpsCallable<
  { lat: number; lng: number; radius?: number; lang?: string; pageNo?: number; numOfRows?: number },
  TourNearbyResponse
>(functions, 'tourNearby')
