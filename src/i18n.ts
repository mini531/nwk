import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

export const SUPPORTED_LANGS = ['ko', 'en', 'ja', 'zh'] as const
export type SupportedLang = (typeof SUPPORTED_LANGS)[number]

const loaders: Record<SupportedLang, () => Promise<{ default: Record<string, unknown> }>> = {
  ko: () => import('../locales/ko/common.json'),
  en: () => import('../locales/en/common.json'),
  ja: () => import('../locales/ja/common.json'),
  zh: () => import('../locales/zh/common.json'),
}

export const detectLang = (): SupportedLang => {
  const stored = localStorage.getItem('nwk.lang') as SupportedLang | null
  if (stored && SUPPORTED_LANGS.includes(stored)) return stored
  const nav = navigator.language.slice(0, 2).toLowerCase()
  return (SUPPORTED_LANGS as readonly string[]).includes(nav) ? (nav as SupportedLang) : 'en'
}

export const initI18n = async (lang: SupportedLang) => {
  const mod = await loaders[lang]()
  await i18n.use(initReactI18next).init({
    lng: lang,
    fallbackLng: 'en',
    resources: { [lang]: { common: mod.default } },
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  })
  return i18n
}

export const changeLang = async (lang: SupportedLang) => {
  if (!i18n.hasResourceBundle(lang, 'common')) {
    const mod = await loaders[lang]()
    i18n.addResourceBundle(lang, 'common', mod.default)
  }
  await i18n.changeLanguage(lang)
  localStorage.setItem('nwk.lang', lang)
}

export default i18n
