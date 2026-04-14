import { create } from 'zustand'
import type { SupportedLang } from '../i18n'

interface AppState {
  lang: SupportedLang
  setLang: (lang: SupportedLang) => void
}

export const useAppStore = create<AppState>((set) => ({
  lang: 'ko',
  setLang: (lang) => set({ lang }),
}))
