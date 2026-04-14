import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGS, type SupportedLang } from '../i18n'
import { useAppStore } from '../stores/app-store'
import { ChevronDownIcon, GlobeIcon } from './icons'

const LABELS: Record<SupportedLang, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  zh: '中文',
}

export const LangSwitcher = () => {
  const { t } = useTranslation()
  const lang = useAppStore((s) => s.lang)
  const setLang = useAppStore((s) => s.setLang)

  return (
    <label className="relative inline-flex items-center gap-1.5 rounded-full border border-line bg-white/70 px-3 py-1.5 text-sm text-ink-2 backdrop-blur transition hover:border-line-strong hover:text-ink">
      <span className="sr-only">{t('lang.label')}</span>
      <GlobeIcon size={16} className="text-ink-3" />
      <span className="font-medium tracking-tight">{LABELS[lang]}</span>
      <ChevronDownIcon size={12} className="text-ink-3" />
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as SupportedLang)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label={t('lang.label')}
      >
        {SUPPORTED_LANGS.map((l) => (
          <option key={l} value={l}>
            {LABELS[l]}
          </option>
        ))}
      </select>
    </label>
  )
}
