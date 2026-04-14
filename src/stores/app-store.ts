import { create } from 'zustand'
import { changeLang, type SupportedLang } from '../i18n'

interface AppState {
  lang: SupportedLang
  setLang: (lang: SupportedLang) => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  lang: 'ko',
  setLang: async (lang) => {
    await changeLang(lang)
    set({ lang })
  },
}))
