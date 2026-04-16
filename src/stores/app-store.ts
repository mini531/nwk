import { create } from 'zustand'
import { changeLang, type SupportedLang } from '../i18n'
import type { TourSearchItem } from '../utils/api'

interface AppState {
  lang: SupportedLang
  setLang: (lang: SupportedLang) => Promise<void>
  selectedPlace: TourSearchItem | null
  setSelectedPlace: (place: TourSearchItem | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  lang: 'ko',
  setLang: async (lang) => {
    await changeLang(lang)
    set({ lang })
  },
  selectedPlace: null,
  setSelectedPlace: (place) => set({ selectedPlace: place }),
}))
