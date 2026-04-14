import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

export type SupportedLang = 'ko' | 'en' | 'ja' | 'zh'

const loadCommon = async (lang: SupportedLang) => {
  const mod = await import(`../locales/${lang}/common.json`)
  return mod.default
}

export const initI18n = async (lang: SupportedLang = 'ko') => {
  const common = await loadCommon(lang)
  await i18n.use(initReactI18next).init({
    lng: lang,
    fallbackLng: 'en',
    resources: { [lang]: { common } },
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  })
  return i18n
}

export default i18n
