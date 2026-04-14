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
