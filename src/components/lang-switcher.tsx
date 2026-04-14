import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGS, type SupportedLang } from '../i18n'
import { useAppStore } from '../stores/app-store'

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
    <label className="flex items-center gap-2 text-sm text-neutral-600">
      <span className="sr-only">{t('lang.label')}</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as SupportedLang)}
        className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm"
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
